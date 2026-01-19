import os
import json
import asyncio
import logging
import datetime
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('aggregatorSongSpotify_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logger = Logger('aggregatorSongSpotify', log_file=log_filename)

@timer_decorator(logger)
def get_total_albums_fromDB():
    total = 0
    select_query = """
        SELECT COUNT(DISTINCT a.id)
        FROM albums a
        LEFT JOIN songs s ON a.id = s.albumid
        WHERE s.id IS NULL AND a.spotifyexternalid IS NOT NULL
    """
    try:
        with PostgresClient(logger=logger) as db:
            res = db.query(query=select_query, fetchone=True)
            total = res[0]
            logger.info(f"total new albums: {total}")
    except Exception as e:
        logger.error(f"ERROR fetching albums total from db returning 0, {e}")
    finally:
        return total

@timer_decorator(logger)
def get_albums_fromDB(page_size, offset):
    albums = {}
    # create spotify albums batch, limit: 20 (https://developer.spotify.com/documentation/web-api/reference/get-multiple-albums)
    select_query = f"""
        SELECT DISTINCT a.id, a.spotifyexternalid, a.artistid, a.title 
        FROM albums a
        LEFT JOIN songs s ON a.id = s.albumid
        WHERE s.id IS NULL AND a.spotifyexternalid IS NOT NULL
        LIMIT {page_size} OFFSET {offset}
    """
    try:
        with PostgresClient(logger=logger) as db:
            rows = db.query(query=select_query, fetchall=True)
            albums = { row[1]: Album(id=row[0], spotifyexternalid=row[1], artistid=row[2], title=row[3]) for row in rows }
    except Exception as e:
        logger.error(f"ERROR fetching artists and albums from db returning empty list. {e}")
    finally:
        return albums

@timer_decorator(logger)
def gather_artist_ids(songs):
    return set(song.artist_id for song in songs)

@timer_decorator(logger)
def create_partitions(artist_ids):
    if not artist_ids:
        return
    partition_queries = [
        f"CREATE TABLE IF NOT EXISTS songs_artist_{artist_id} PARTITION OF Songs FOR VALUES IN ({artist_id});"
        for artist_id in artist_ids
    ]
    # Join all partition creation queries into one to reduce overhead
    combined_query = "\n".join(partition_queries)
    with PostgresClient(logger=logger) as db:
        db.query(query=combined_query)

@timer_decorator(logger)
def save_songs_inDB(songs_to_save):
    insert_query = """
        INSERT INTO Songs (title, artistid, albumid, albumtracknum, spotifyexternalid, spotifypreviewurl)
        VALUES %s
        ON CONFLICT (title, artistid)
        DO UPDATE SET
            albumid = EXCLUDED.albumid,
            albumtracknum = EXCLUDED.albumtracknum,
            spotifyexternalid = EXCLUDED.spotifyexternalid,
            spotifypreviewurl = EXCLUDED.spotifypreviewurl
    """
    try:
        artist_ids = gather_artist_ids(songs_to_save)
        create_partitions(artist_ids)
        with PostgresClient(logger=logger) as db:
            song_tuples = [ (s.title, s.artist_id, s.album_id, s.track_num, s.spotify_id, s.spotify_preview_url) for s in songs_to_save ]
            if len(song_tuples) > 0:
                db.query(query=insert_query, data=song_tuples)
                logger.info(f"Saved {len(song_tuples)} songs")
        return []
    except Exception as e:
        msg = f"Error inserting songs in db, {e}"
        logger.error(msg)
        return [ (s.album_id, msg) for s in songs_to_save ]

@timer_decorator(logger)
def update_songs_inDB(songs_to_update):
    update_query = """
        UPDATE Songs
        SET albumid = %s, albumtracknum = %s, spotifyexternalid = %s, spotifypopularity = %s, spotifypreviewurl = %s
        WHERE title = %s and artistid = %s
    """
    try:
        with PostgresClient(logger=logger) as db:
            song_tuples = [ (s.album_id, s.track_num, s.spotify_id, s.spotify_popular, s.spotify_preview_url, s.title, s.artist_id) for s in songs_to_update ]
            if len(song_tuples) > 0:
                db.query(executemany=True, query=update_query, data=song_tuples)
                logger.info(f"Saved {len(song_tuples)} songs")
        return []
    except Exception as e:
        logger.error(f"Error updating songs in db, {e}")
        return [ s.album_id for s in songs_to_update ]

@timer_decorator(logger)
def save_genres_inDB(album_genres):
    insert_query = """
        INSERT INTO Genres (name, artistid, albumid)
        VALUES %s
    """
    try:
        with PostgresClient(logger=logger) as db:
            genre_tuples = [ (g.name, g.artist_id, g.album_id) for g in album_genres ]
            if len(genre_tuples) > 0:
                db.query(query=insert_query, data=genre_tuples)
                logger.info(f"Saved {len(genre_tuples)} genres")
        return []
    except Exception as e:
        msg = f"Error inserting genres in db, {e}"
        logger.error(msg)
        return [ (g.album_id, msg) for g in album_genres ]

@timer_decorator(logger)
def save_errors_inDB(errors):
    logger.warning(f'albums not found: {len(errors)}')
    insert_query = """
        INSERT INTO Errors (albumid, errormessage)
        VALUES %s
    """
    try:
        if len(errors) > 0:
            with PostgresClient(logger=logger) as db:
                db.query(query=insert_query, data=errors)
    except Exception as e:
        logger.error(f"Error saving errors to db, {e}")

@timer_decorator(logger)
def update_albums_inDB(albums_to_update):
    update_query = """
        INSERT INTO Albums (title, id, spotifypopularity)
        VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            spotifypopularity = EXCLUDED.spotifypopularity
    """
    try:
        with PostgresClient(logger=logger) as db:
            update_tuples = [ (a.title, a.id, a.spotify_popular) for a in albums_to_update ]
            logger.info(f"Update Tuples: {update_tuples}")
            db.query(query=update_query, data=update_tuples)
            return []
    except Exception as e:
        msg = f"Error updating album meta in db, {e}"
        logger.error(msg)
        return [(album.id, msg) for album in albums_to_update]

@timer_decorator(logger)
async def fetch_album_tracks(client, album_ids):
    try:
        ids_str = ",".join(album_ids)
        resp = await client.get(f"/albums?", [f"ids={ids_str}", "market=US"])
        if resp.status_code == 200:
            return resp.json()
        logger.warning(f"Failed to fetch spotify albums batch. Status code: {resp.status_code}, Response: {resp.text}")
        return None
    except Exception as e:
        logger.error(f"Error fetching albums batch, {e}")

@timer_decorator(logger)
def populate_songs(json_data, albums):
    # aggregate songs in hash table to preserve unique SpotifyExternalId property in db
    songs = {}
    errors = []
    genres = []
    for spotify_album in json_data["albums"]:
        spID = spotify_album["id"]
        albumObj = albums[spID]
        try:
            # get genres
            sp_genres = spotify_album.get('genres')
            if sp_genres is not None:
                genres.extend([Genre(name=g.name, artistid=albumObj.artist_id, albumid=albumObj.id) for g in sp_genres])
            # get tracks
            for song in spotify_album["tracks"]["items"]:
                # init empty dict if first artist album
                songs[song["id"]] = Song(
                    title=song.get("name"), 
                    spotifyexternalid=song.get("id"),
                    artistid=albumObj.artist_id,
                    albumid=albumObj.id,
                    albumtracknum=song.get("track_number"),
                    spotifypreviewurl=song.get("preview_url")
                )
        except Exception as e:
            msg = f"Error populating songs, {e}"
            logger.error(msg)
            errors.append((albumObj.id, msg))
    return (songs.values(), genres, errors)

@timer_decorator(logger)
def populate_update_albums(json_data, albums):
    update_albums = []
    errors = []
    for spotify_album in json_data["albums"]:
        spID = spotify_album["id"]
        albumObj = albums[spID]
        try:
            albumObj.spotify_popular = int(spotify_album["popularity"])
            update_albums.append(albumObj)
        except Exception as e:
            msg = f"Error populating update_albums, {e}"
            logger.error(msg)
            errors.append((albumObj.id, msg))
    return (update_albums, errors)

@timer_decorator(logger)
def get_existing_songs():
    titles = {}
    artist_ids = {}
    # create spotify albums batch, limit: 20 (https://developer.spotify.com/documentation/web-api/reference/get-multiple-albums)
    select_query = f"""
        SELECT title, artistid FROM songs
    """
    try:
        with PostgresClient(logger=logger) as db:
            rows = db.query(query=select_query, fetchall=True)
            titles = { row[0]: True for row in rows }
            artist_ids = { row[1]: True for row in rows }
    except Exception as e:
        logger.error(f"ERROR fetching existing songs from db. {e}")
    finally:
        return titles, artist_ids


async def main():
    print('Running spotify song aggregator')
    client = SpotifyClient(logger=logger)
    await client.init_access_token()
    total_albums = get_total_albums_fromDB()
    logger.info(f'total: {total_albums}')
    # spotify albums batch limit: 20 (https://developer.spotify.com/documentation/web-api/reference/get-multiple-albums)
    page_size = 20
    total_pages = int(total_albums / page_size)
    for page in range(total_pages):
        logger.info(f'Scraping page {page}/{total_pages}')
        offset = page * page_size
        albums = get_albums_fromDB(page_size, offset)
        # logger.info(f'albums to search: {len(albums)}, {[ album.title for album in albums ]}')
        json_data = await fetch_album_tracks(client, albums.keys())
        if json_data:
            songs, album_genres, errors = populate_songs(json_data, albums)
            # filter songs based on title and name
            titles, artist_ids = get_existing_songs()
            update_songs = set()
            insert_songs = set()
            for s in songs:
                if s.title not in titles and s.artist_id not in artist_ids:
                    insert_songs.add(s)
                else:
                    update_songs.add(s)
            logger.info(f'new songs ids: {[s.artist_id for s in insert_songs]}')
            logger.info(f'new songs titles: {[s.title for s in insert_songs]}')
            errors += save_songs_inDB(insert_songs)
            errors += update_songs_inDB(update_songs)
            errors += save_genres_inDB(album_genres)
            update_albums, album_errors = populate_update_albums(json_data, albums)
            errors += album_errors
            errors += update_albums_inDB(update_albums)
            save_errors_inDB(errors)
        else:
            save_errors_inDB([(a, 'error fetching albums from spotify') for a in albums.keys()])
    logger.info('SUCCESSFULL SPOTIFY SONG AGGREGATION!')
    print(f'Completed spotify song aggregator, logs: {log_filename}')
asyncio.run(main())
