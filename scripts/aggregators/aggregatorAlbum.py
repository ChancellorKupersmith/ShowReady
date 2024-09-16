import os
import json
import asyncio
import logging
import datetime
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('aggregatorAlbum_%Y%m%d_%H%M%S.log')
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
def get_artists_fromDB():
    select_query = """
        SELECT DISTINCT a.id, a.name, a.lastfmurl, a.spotifyexternalid
        FROM Artists a
        LEFT JOIN Albums al ON a.id = al.artistid
        WHERE al.id IS NULL;
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            artists = [ Artist(id=row[0], name=row[1], lastfm_url=row[2], spotify_id=row[3]) for row in rows ]
            return artists
    except Exception as e:
        log(1, f"ERROR fetching artists from db returning None. {e}")
        return None

@timer_decorator
async def query_lastFm_albums(client, artist_name, artist_id):
    try:
        resp = await client.get("artist.gettopalbums", [f"artist={artist_name}", "limit=200"])
        if resp.status_code != 200:
            log(2, f"Failed to fetch data. Status code:{resp.status_code}")
            return (False, [])
        json_data = (resp.json())
        lastfm_albums_list = json_data["topalbums"]["album"]
        # log(0, f"LASTFM {artist_name} TOP ALBUMS LIST: {lastfm_albums_list}")
        if len(lastfm_albums_list) == 0:
            log(2, f"LastFM found 0 albums for {artist_name}")
            return (False, [])
        albums = list(map(lambda album: {album["name"].lower(): Album(title=album["name"], lastfmurl=album["url"], artistid=artist_id)}, lastfm_albums_list))
        return (True, albums)
    except Exception as e:
        log(1, f"ERROR finding artist: {artist_name}'s albums on LastFM: {e}")
        return (False, [])

@timer_decorator
async def query_spotify_albums(client, artist_spotify_id, artist_id, artist_name):
    albums = []
    if artist_spotify_id is None:
        log(2, f"artist: ({artist_name}, {artist_id}) not found on spotify")
        return (True, albums)
    try:
        # if total is more than limit (max spotify api limit 50) paginate to get all albums
        offset = 0
        limit = 50
        resp_total = 51
        while offset + limit <= resp_total:
            resp = await client.get(f"/artists/{artist_spotify_id}/albums?", ["market=US", f"offset={offset}", f"limit={limit}"])
            if resp.status_code != 200:
                log(2, f"Failed to fetch data. Status code:{resp.status_code}, Returning current aggregated albums")
                return (False, albums)
            json_data = (resp.json())
            resp_total = json_data["total"]
            albums.extend(map(lambda a: { a["name"].lower(): Album(title=a["name"], spotifyexternalid=a["id"], artistid=artist_id)}, json_data["items"]))
            offset += limit
        return (True, albums)
    except Exception as e:
        log(1, f"ERROR finding artist: {artist_name} albums on Spotify: {e}")
        return (False, albums)

@timer_decorator
async def find_albums(artist):
    spotify_client = SpotifyClient(log=log)
    await spotify_client.init_access_token()
    lastfm_client = LastFmClient(log=log)
    failed_artists = []
    artist_albums = {}
    try:
        # 3rd party searches albums concurrently 
        tasks = [
            query_lastFm_albums(lastfm_client, artist.name, artist.id),
            query_spotify_albums(spotify_client, artist.spotify_id, artist.id, artist.name)
        ]
        results = await asyncio.gather(*tasks)
        # Consolidate album info
        itr = 0
        for res in results:
            success, found_albums = res
            if not success and itr == 1:
                failed_artists.append((artist.id, f"error finding albums for artist: {artist.name}"))
            for a in found_albums:
                log(0, f'artist: {artist.name}, album: {a}')
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
            itr += 1
    except Exception as e:
        log(1, f"ERROR fetching artist albums, {e}")
        failed_artists.append((artist.id, f"error finding albums for artist: {artist.name}"))
    return (artist_albums.values(), failed_artists)

@timer_decorator
def save_albums_inDB(albums_to_save):
    insert_query = """
        INSERT INTO Albums (title, spotifyexternalid, lastfmurl, artistid)
        VALUES %s
        ON CONFLICT (lastfmurl)
        DO UPDATE SET
            title = EXCLUDED.title,
            artistid = EXCLUDED.artistid,
            spotifyexternalid = EXCLUDED.spotifyexternalid
    """
    try:
        with PostgresClient(log=log) as db:
            album_tuples = list(map(lambda a: a.to_tuple(), albums_to_save))
            db.query(query=insert_query, data=album_tuples)
    except Exception as e:
        log(1, f"Error saving Albums to db: {e}")

@timer_decorator
def save_errors_inDB(artists_not_found):
    insert_query = """
        INSERT INTO Errors (artistid, errormessage)
        VALUES %s
    """
    try:
        log(0, f"errors: {artists_not_found}")
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=artists_not_found)
    except Exception as e:
        log(1, f"Error saving errors to db, {e}")

@timer_decorator
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
        log(1, f"ERROR fetching album spotify ids from db returning None. {e}")
        return None


async def main():
    print('Started album aggregator')
    # TODO paginate through artists from db
    artists = get_artists_fromDB()
    artists_and_albums = []
    for artist in artists:
        found_albums, errors = await find_albums(artist)
        #  filter found albums from already found spotify ids, (choosing to filter spotify ids assuming less ids of spotify than lastfmurls), having to filter incase multiple artists share album
        existing_albums = get_albums_fromDB()
        new_found_albums = list(filter(lambda album: album.spotify_id not in existing_albums, found_albums))
        # save data
        if len(found_albums) > 0:
            save_albums_inDB(new_found_albums)
        if len(errors) > 0:
            save_errors_inDB(errors)
    print(f'Completed album aggregator, logs: {log_filename}')
asyncio.run(main())