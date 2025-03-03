import os
import json
import asyncio
import logging
import datetime
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('aggregatorAlbum_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logger = Logger('aggregatorAlbum', log_file=log_filename)

def get_total_artists_fromDB():
    total = 0
    select_query = f"""
        SELECT COUNT(*)
        FROM Artists a
        LEFT JOIN Albums al ON a.id = al.artistid
        WHERE al.id IS NULL
    """
    try:
        with PostgresClient(log=log) as db:
            total = db.query(query=select_query, fetchone=True)[0]
    except Exception as e:
        logger.error(f"ERROR fetching artists from db returning 0. {e}")
    finally:
        return total

@timer_decorator(logger)
def get_artists_fromDB(page_size, offset):
    select_query = f"""
        SELECT a.id, a.name, a.lastfmurl, a.spotifyexternalid
        FROM Artists a
        LEFT JOIN Albums al ON a.id = al.artistid
        WHERE al.id IS NULL
        OFFSET {offset} LIMIT {page_size}
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            artists = [ Artist(id=row[0], name=row[1], lastfm_url=row[2], spotify_id=row[3]) for row in rows ]
            return artists
    except Exception as e:
        logger.error(f"ERROR fetching artists from db returning None. {e}")
        return None

@timer_decorator(logger)
async def find_albums(artist, spotify_client, lastfm_client):
    @timer_decorator(logger)
    async def query_lastFm_albums(client, artist_name, artist_id):
        try:
            resp = await client.get("artist.gettopalbums", [f"artist={artist_name}", "limit=200"])
            if resp.status_code != 200:
                logger.warning(f"Failed to fetch data. Status code:{resp.status_code}")
                return (False, [], [])
            json_data = (resp.json())
            lastfm_albums_list = json_data["topalbums"]["album"]
            # logger.info(f"LASTFM {artist_name} TOP ALBUMS LIST: {lastfm_albums_list}")
            if len(lastfm_albums_list) == 0:
                logger.warning(f"LastFM found 0 albums for {artist_name}")
                return (False, [], [])
            albums = list(map(lambda album: {album["name"].lower(): Album(title=album["name"], lastfmurl=album["url"], artistid=artist_id)}, lastfm_albums_list))
            return (True, albums, [])
        except Exception as e:
            logger.error(f"ERROR finding artist: {artist_name}'s albums on LastFM: {e}")
            return (False, [], [])

    @timer_decorator(logger)
    async def query_spotify_albums(client, artist_spotify_id, artist_id, artist_name):
        albums = []
        genres = []
        if artist_spotify_id is None:
            logger.warning(f"artist: ({artist_name}, {artist_id}) not found on spotify")
            return (True, albums, genres)
        try:
            # if total is more than limit (max spotify api limit 50) paginate to get all albums
            offset = 0
            limit = 50
            resp_total = 51
            while offset + limit <= resp_total:
                resp = await client.get(f"/artists/{artist_spotify_id}/albums?", ["market=US", f"offset={offset}", f"limit={limit}"])
                if resp.status_code != 200:
                    logger.warning(f"Failed to fetch data. Status code:{resp.status_code}, Returning current aggregated albums")
                    return (False, albums, genres)
                json_data = (resp.json())
                # logger.info(f'resp: {json_data}')
                resp_total = json_data["total"]
                for album in json_data["items"]:
                    albums.append({album['name'].lower(): Album(title=album['name'], spotifyexternalid=album['id'], artistid=artist_id)})
                    album_genres = album.get('genres')
                    if album_genres is not None:
                        genres += [ Genre(name=g, artistid=artist_id) for g in album_genres ]
                offset += limit
            return (True, albums, genres)
        except Exception as e:
            logger.error(f"ERROR finding artist: {artist_name} albums on Spotify: {e}")
            return (False, albums, genres)

    failed_artists = []
    artist_albums = {}
    genres = {} # using dict to ensure uniqueness of (genre.name, genre.artist_id)
    try:
        # concurrently search 3rd parties for album data 
        tasks = [
            query_lastFm_albums(lastfm_client, artist.name, artist.id),
            query_spotify_albums(spotify_client, artist.spotify_id, artist.id, artist.name)
        ]
        results = await asyncio.gather(*tasks)
        # Consolidate album info and populate genres object
        itr = 0
        for res in results:
            success, found_albums, found_genres = res
            if not success and itr == 1:
                failed_artists.append((artist.id, f"error finding albums for artist: {artist.name}"))
            for a in found_albums:
                logger.info(f'artist: {artist.name}, album: {a}')
                for key, album in a.items():
                    # check if other api found album
                    if key in artist_albums:
                        # determine if new album data from spotify or lastfm
                        if album.spotify_id is None:
                            artist_albums[key].lastfm_url = album.lastfm_url
                        else:
                            album.lastfm_url = artist_albums[key].lastfm_url
                            artist_albums[key] = album
                    else:
                        artist_albums[key] = album
            for g in found_genres:
                genres[f"{g.name}-{g.artist_id}"] = g
            itr += 1
    except Exception as e:
        logger.error(f"ERROR fetching artist albums, {e}")
        failed_artists.append((artist.id, f"error finding albums for artist: {artist.name}"))
    return (artist_albums.values(), genres, failed_artists)

@timer_decorator(logger)
def save_albums_inDB(albums_to_save):
    insert_query = """
        INSERT INTO Albums (title, spotifyexternalid, lastfmurl, artistid)
        VALUES %s
        ON CONFLICT (lastfmurl)
        DO UPDATE SET
            title = EXCLUDED.title,
            artistid = EXCLUDED.artistid,
            spotifyexternalid = EXCLUDED.spotifyexternalid
        RETURNING id, title, artistid
    """
    try:
        with PostgresClient(log=log) as db:
            album_tuples = list(map(lambda a: a.to_tuple(), albums_to_save))
            rows = db.query(query=insert_query, data=album_tuples, fetchall=True)
            return { row[1]: Album(id=row[0], title=row[1], artistid=row[2]) for row in rows }
    except Exception as e:
        logger.error(f"Error saving Albums to db: {e}")

@timer_decorator(logger)
def save_errors_inDB(artists_not_found):
    insert_query = """
        INSERT INTO Errors (artistid, errormessage)
        VALUES %s
    """
    try:
        logger.info(f"errors: {artists_not_found}")
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=artists_not_found)
    except Exception as e:
        logger.error(f"Error saving errors to db, {e}")

@timer_decorator(logger)
def save_genres_inDB(found_genres):
    """
        found_genres structure: {f"{g.name}-{g.artist_id}":  [Genre,]}
    """
    insert_query_genres = """
        INSERT INTO Genres (name)
        VALUES %s
        ON CONFLICT (name) DO UPDATE
            SET name = EXCLUDED.name -- redundant update to ensure ids returned for join table insert
        RETURNING Name, ID;
    """
    try:
        db_genre_ids = {} # {genre.name: genre.id}
        unique_genres = set()
        for g in found_genres.values():
            unique_genres.add(g.name)
        with PostgresClient(log=log) as db:
            result = db.query(query=insert_query_genres, data=list(unique_genres), fetchall=True)
            db_genre_ids = { row[0]: row[1] for row in result }
    except Exception as e:
        logger.error(f"Error saving Genres to db: {e}")
    insert_query_artistsgenres = """
        INSERT INTO ArtistsGenres (artistid, genreid)
        VALUES %s
        ON CONFLICT DO NOTHING
    """
    try:
        artists_genres = []
        for genres in found_genres.values():
            artists_genres += [ (g.artist_id, db_genre_ids[g.name]) for g in genres ] 
        with PostgresClient(log=log) as db:
            db.query(query=insert_query_artistsgenres, data=artists_genres)
    except Exception as e:
        logger.error(f"Error saving ArtistsGenres to db: {e}")

@timer_decorator(logger)
def get_albums_fromDB():
    select_query = """
        SELECT spotifyexternalid FROM Albums
        WHERE spotifyexternalid IS NOT NULL
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            return { row[0]: True for row in rows }
    except Exception as e:
        logger.error(f"ERROR fetching album spotify ids from db returning None. {e}")
        return None


async def main():
    print('Started album aggregator')
    total = get_total_artists_fromDB()
    page_size = 10
    logger.info(f"number of new artists: {total}")
    for page in range(int(total / page_size)):
        artists = get_artists_fromDB(page_size, page * page_size)
        artists_and_albums = []
        spotify_client = SpotifyClient(log=log)
        await spotify_client.init_access_token()
        lastfm_client = LastFmClient(log=log)
        for artist in artists:
            found_albums, found_genres, errors = await find_albums(artist, spotify_client, lastfm_client)
            #  filter found albums from already found spotify ids, (choosing to filter spotify ids assuming less ids of spotify than lastfmurls), having to filter incase multiple artists share album
            existing_albums = get_albums_fromDB()
            new_found_albums = list(filter(lambda album: album.spotify_id not in existing_albums, found_albums))
            # save data
            saved_albums = {}
            if len(found_albums) > 0:
                saved_albums = save_albums_inDB(new_found_albums)
            if len(errors) > 0:
                save_errors_inDB(errors)
            if found_genres:
                save_genres_inDB(found_genres)
    logger.info('SUCCESSFULL ALBUM AGGREGATION!')
    print(f'Completed album aggregator, logs: {log_filename}')
asyncio.run(main())