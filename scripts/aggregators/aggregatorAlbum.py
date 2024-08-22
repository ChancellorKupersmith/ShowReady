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

def get_artists():
    select_query = "SELECT Name, LastFmUrl, SpotifyExternalId, ID FROM artists"
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            artists = map(lambda row: Artist(name=row[0], lastfm_url=row[1], spotify_id=row[2], id=row[3]), rows)
            return artists
    except Exception as e:
        log(1, f"ERROR fetching artists from db returning None. {e}")
        return None

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

async def query_spotify_albums(client, artist_spotify_id, artist_id):
    albums = []
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
        log(1, f"ERROR finding ArtistID: {artist_id} albums on Spotify: {e}")
        return (False, albums)

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
            query_spotify_albums(spotify_client, artist.spotify_id, artist.id)
        ]
        results = await asyncio.gather(*tasks)
        # Consolidate album info
        for res in results:
            log(0, f"result: {res}")
            success, found_albums = res
            if not success:
                failed_artists.append(artist.name)
            for a in found_albums:
                log(0, f'ALBUMMMMMMM: {a}')
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
    except Exception as e:
        log(1, f"ERROR fetching artist albums: {e}")
        failed_artists.append(artist.name)
    log(2, f"Failed to get albums for {failed_artists}")
    return artist_albums.values()

def save_albums_to_db(albums_to_save):
    insert_query = """
        INSERT INTO Albums (Title, SpotifyExternalId, LastFmUrl, ArtistID)
        VALUES %s
        ON CONFLICT (SpotifyExternalId)
        DO UPDATE SET
            Title = EXCLUDED.Title,
            ArtistID = EXCLUDED.ArtistID,
            LastFmUrl = EXCLUDED.LastFmUrl
    """
    try:
        with PostgresClient(log=log) as db:
            album_tuples = list(map(lambda a: a.to_tuple(), albums_to_save))
            db.query(query=insert_query, data=album_tuples)
    except Exception as e:
        log(1, f"Error saving Albums to db: {e}")


async def main():
    print('Started album aggregator')
    # paginate through artists in db
    artists = get_artists()
    artists_and_albums = []
    for artist in artists:
        found_albums = await find_albums(artist)
        # save albums to db
        saved_albums = save_albums_to_db(found_albums)

    print(f'Completed album aggregator, logs: {log_filename}')
asyncio.run(main())