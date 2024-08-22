import os
import json
import asyncio
import logging
import datetime
import multiprocessing
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('aggregatorSong_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logging.basicConfig(
    filename=log_filename,
    filemode='w',
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.DEBUG
)
def log(lvl, msg):
    if lvl == 0: logging.info(msg=msg)
    elif lvl == 1: logging.error(msg=msg)
    else: logging.warning(msg=msg)

@timer_decorator
def get_artists():
    artists = []
    select_query = """
        SELECT artists.Name, artists.ID FROM artists
        WHERE artists.Created >= NOW() - INTERVAL '1 week'
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            artists = list(map(lambda row: Artist(name=row[0], id=row[1]), rows))
    except Exception as e:
        log(1, f"ERROR fetching artists from db returning empty list. {e}")
    finally:
        return artists

@timer_decorator
def get_artists_and_albums():
    artists_and_albums = []
    select_query = """
        SELECT artists.Name, albums.ID, albums.SpotifyExternalId FROM artists
        JOIN albums on albums.ArtistID = artists.ID
        WHERE albums.SpotifyExternalId IS NOT NULL
        AND (albums.Created >= NOW() - INTERVAL '1 week'
        OR albums.Updated >= NOW() - INTERVAL '1 week')
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            artists_and_albums = list(map(lambda row: (row[0], Album(id=row[1], spotifyexternalid=row[2])), rows))
    except Exception as e:
        log(1, f"ERROR fetching artists and albums from db returning empty list. {e}")
    finally:
        return artists_and_albums

@timer_decorator
def query_lastFm_songs(artists, res_queue):
    """ Fetches all of artists' songs from lastfm api.
        Adds result tuple (spotify_flag, artists_songs) to multiprocessing queue
    """
    artists_songs = {}
    @timer_decorator
    async def event_loop():
        client = LastFmClient(log=log)
        async def fetch_artist_tracks(artist_name, page):
            try:
                resp = await client.get("artist.gettoptracks", [f"artist={artist_name}", f"page={page}" "limit=200"])
                if resp.status_code == 200:
                    return resp.json()
                log(2, f"Failed to fetch data. Status code: {resp.status_code}, Response: {resp.text}")
                return None
            except Exception as e:
                log(1, f"ERROR finding artist: {artist_name}'s songs on LastFM, {e}")

        for artist in artists:
            page = 1
            total_pages = 1
            found_songs = {}
            while page <= total_pages:
                json_data = await fetch_artist_tracks(artist.name, page)
                if json_data is None:
                    log(2, f"Failed to fetch data. Status code: {resp.status_code}, Response: {resp.text}")
                    break
                try:
                    if total_pages == 1:
                        total_pages = int(json_data["toptracks"]["@attr"]["totalPages"])
                        log(0, f"Scraping {total_pages} total pages for {artist.name}")
                    for track in json_data["toptracks"]["track"]:
                        found_songs[track["name"].lower()] = Song(title=track["name"], lastfmurl=track["url"], artistid=artist.id)
                except Exception as e:
                    log(1, f"ERROR processing artist: {artist.name}'s songs from LastFM, {e}")
                    break
                page += 1
            artists_songs[artist.name] = found_songs

    asyncio.run(event_loop())
    res_queue.put((0, artists_songs))

@timer_decorator
def query_spotify_songs(artists_and_albums, res_queue):
    """ Fetches new songs and album metadata from spotify api.
        Adds result tuple (spotify_flag, artist_songs, update_albums) in multiprocessing queue
    """
    artists_songs = {}
    update_albums = []

    @timer_decorator
    async def event_loop():
        client = SpotifyClient(log=log)
        await client.init_access_token()
        async def fetch_album_tracks(album_ids):
            try:
                ids_str = ",".join(album_ids)
                resp = await client.get(f"/albums?", [f"ids={ids_str}", "market=US"])
                if resp.status_code == 200:
                    return resp.json()
                log(2, f"Failed to fetch spotify albums batch. Status code: {resp.status_code}, Response: {resp.text}")
                return None
            except Exception as e:
                log(1, f"Error fetching albums batch {e}")

        def populate_artists_songs(json_data):
            for spotify_album in json_data["albums"]:
                try:
                    spID = spotify_album["id"]
                    artistName, albumObj = albums_batch[spID]
                    for song in spotify_album["tracks"]["items"]:
                        # init empty dict if first artist album
                        if artistName.lower() not in artists_songs:
                            artists_songs[artistName.lower()] = {}
                        artists_songs[artistName.lower()][song["name"].lower()] = Song(
                            title=song["name"], 
                            spotifyexternalid=song["id"],
                            artistid=albumObj.artist_id,
                            albumid=albumObj.id,
                            albumtracknum=song["track_number"],
                            spotifypreviewurl=song["preview_url"]
                        )
                except Exception as e:
                    log(1, f"Error populating artists_songs, {e}")

        def populate_update_albums(json_data):
            for spotify_album in json_data["albums"]:
                try:
                    spID = spotify_album["id"]
                    artistName, albumObj = albums_batch[spID]
                    albumObj.genres = spotify_album["genres"]
                    albumObj.spotify_popular = int(spotify_album["popularity"])
                    update_albums.append(albumObj)
                except Exception as e:
                    log(1, f"Error populating update_albums, {e}")


        albums_batch = {}
        for aa in artists_and_albums:
            # create spotify albums batch, limit: 20 (https://developer.spotify.com/documentation/web-api/reference/get-multiple-albums)
            if len(albums_batch) < 20:
                artist_name, album = aa
                albums_batch[album.spotify_id] = (artist_name, album)
            else:
                album_ids = list(albums_batch.keys())
                json_data = await fetch_album_tracks(album_ids)
                if json_data:
                    populate_artists_songs(json_data)
                    populate_update_albums(json_data)
                albums_batch.clear()

    asyncio.run(event_loop())
    res_queue.put((1, artists_songs, update_albums))

@timer_decorator
def save_songs_inDB(songs_to_save):
    insert_query = """
        INSERT INTO Songs (Title, ArtistID, AlbumID, AlbumTrackNum, SpotifyExternalId, SpotifyPreviewUrl, LastFmUrl)
        VALUES %s
        ON CONFLICT (SpotifyExternalId)
        DO UPDATE SET
            Title = EXCLUDED.Title,
            ArtistID = EXCLUDED.ArtistID,
            AlbumID = EXCLUDED.AlbumID,
            AlbumTrackNum = EXCLUDED.AlbumTrackNum,
            SpotifyPreviewUrl = EXCLUDED.SpotifyPreviewUrl,
            LastFmUrl = EXCLUDED.LastFmUrl
    """
    try:
        with PostgresClient(log=log) as db:
            song_tuples = list(map(lambda s: s.to_tuple(), songs_to_save))
            db.query(query=insert_query, data=song_tuples)
            log(0, f"Saved {len(song_tuples)} songs:")
            for st in song_tuples:
                log(0, f"Song: {st}")
    except Exception as e:
        log(1, f"Error inserting songs in db, {e}")

@timer_decorator
def update_albums_inDB(albums_to_update):
    def update_albums(db):
        update_query = "UPDATE Albums SET spotifypopularity = %s WHERE id = %s"
        update_tuples = list(map(lambda a: (a.spotify_popular, a.id), albums_to_update))
        db.query(query=update_query, data=update_tuples)
        log(0, f"Updated {len(update_tuples)} albums.")

    def select_genres(db):
        insert_query = """
            INSERT INTO Genres (name)
            VALUES %s
            ON CONFLICT (name) DO NOTHING
            RETURNING name, id
        """
        genres = [(genre,) for album in albums_to_update for genre in album.genres]
        rows = db.query(query=insert_query, data=genres, fetchall=True)
        return {row[0]: row[1] for row in rows}

    def save_album_genres(db, albums_genres):
        insert_query = """
            INSERT INTO AlbumGenres (albumid, genreid)
            VALUES %s
            ON CONFLICT (albumid, genreid) DO NOTHING
        """
        db.query(query=insert_query, data=albums_genres)

    try:
        with PostgresClient(log=log) as db:
            genres = select_genres(db)
            join_albums_genres = [(album.id, genres[genre]) for album in albums_to_update for genre in album.genres]
            save_album_genres(db, join_albums_genres)
            update_albums(db)
    except Exception as e:
        log(1, f"Error updating album meta in db, {e}")


@timer_decorator
def main():
    print('Running song aggregator')
    # TODO: paginate through artists and albums in db
    artists_and_albums = get_artists_and_albums()
    artists = get_artists()
    """
        Because lastfm takes much longer aggregating songs by artist instead of by album like spotify
        spliting into 2 processes,
        - will need to consolidate songs before saving to db
    """
    results_queue = multiprocessing.Queue()
    lastfm_songs_process = multiprocessing.Process(target=query_lastFm_songs, args=(artists, results_queue))
    spotify_songs_process = multiprocessing.Process(target=query_spotify_songs, args=(artists_and_albums, results_queue))
    lastfm_songs_process.start()
    spotify_songs_process.start()
    lastfm_songs_process.join()
    spotify_songs_process.join()

    # Consolidate songs
    res1 = results_queue.get()
    res2 = results_queue.get()
    # separate by source
    spotify_artists_songs = res1[1] if res1[0] == 1 else res2[1]
    spotify_update_albums = res1[2] if res1[0] == 1 else res2[2]
    lastfm_artists_songs =  res1[1] if res1[0] != 1 else res2[1]

    # first copy lastfm urls to spotify songs then update into lastfm songs in order to insure all songs are saved with no duplicates
    for artist_name in spotify_artists_songs:
        if artist_name in lastfm_artists_songs:
            for song_name in spotify_artists_songs[artist_name]:
                if song_name in lastfm_artists_songs[artist_name]:
                    spotify_artists_songs[artist_name][song_name].lastfm_url = lastfm_artists_songs[artist_name][song_name].lastfm_url
    lastfm_artists_songs.update(spotify_artists_songs)

    # Save data in db
    for artist in lastfm_artists_songs:
        save_songs_inDB(lastfm_artists_songs[artist].values())
    update_albums_inDB(spotify_update_albums)
    print(f'Song aggregator completed. logs: {log_filename}')
main()