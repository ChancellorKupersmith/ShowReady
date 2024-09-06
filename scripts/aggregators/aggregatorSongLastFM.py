import os
import json
import asyncio
import logging
import datetime
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('aggregatorSongLastFM_%Y%m%d_%H%M%S.log')
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
def get_total_artists_fromDB():
    total = 0
    select_query = """
        SELECT COUNT(*) AS total FROM Artists
    """
        # WHERE created >= NOW() - INTERVAL '1 week'
    try:
        with PostgresClient(log=log) as db:
            res = db.query(query=select_query, fetchone=True)
            total = res[0]
    except Exception as e:
        log(1, f"ERROR fetching artists total from db returning 0. {e}")
    finally:
        return total

@timer_decorator
def get_artists_fromDB(page_size, offset):
    artists = []
    select_query = f"""
        SELECT name, id FROM Artists
        LIMIT {page_size} OFFSET {offset} 
    """
        # WHERE created >= NOW() - INTERVAL '1 week'
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            artists = list(map(lambda row: Artist(name=row[0], id=row[1]), rows))
    except Exception as e:
        log(1, f"ERROR fetching artists from db returning empty list. {e}")
    finally:
        return artists

@timer_decorator
async def query_lastFm_songs(client, artists):
    artists_songs = {}

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
                log(2, f"Failed to fetch data. continue to next artist")
                break
            try:
                if total_pages == 1:
                    # Limit 600 songs per artist (might increase later if data isn't diverse)
                    total_pages = min(12, int(json_data["toptracks"]["@attr"]["totalPages"]))
                    log(0, f"Scraping {total_pages} total pages for {artist.name}")
                for track in json_data["toptracks"]["track"]:
                    found_songs[track["name"].lower()] = Song(title=track["name"], lastfmurl=track["url"], artistid=artist.id, mbid=track.get("mbid", ""))
            except Exception as e:
                log(1, f"ERROR processing artist: {artist.name}'s songs from LastFM, {e}")
                break
            page += 1
        artists_songs[artist.name] = found_songs
    return artists_songs

@timer_decorator
def save_songs_inDB(songs_to_save):
    insert_query = """
        INSERT INTO Songs (title, artistid, lastfmurl, mbid)
        VALUES %s
        ON CONFLICT (title, artistid)
        DO UPDATE SET
            lastfmurl = EXCLUDED.lastfmurl,
            mbid = EXCLUDED.mbid
    """
    try:
        with PostgresClient(log=log) as db:
            song_tuples = list(map(lambda s: (s.title, s.artist_id, s.lastfm_url, s.mbid), songs_to_save))
            db.query(query=insert_query, data=song_tuples)
            log(0, f"Saved {len(song_tuples)} songs:")
    except Exception as e:
        log(1, f"Error inserting songs in db, {e}")


async def main():
    print('Running LastFM song aggregator')
    client = client = LastFmClient(log=log)
    total_artists = get_total_artists_fromDB()
    log(0, f"total artists: {total_artists}")
    page_size = 20
    for page in range(total_artists):
        offset = page * page_size
        artists = get_artists_fromDB(page_size, offset)
        lastfm_artists_songs = await query_lastFm_songs(client, artists)
        for artist in lastfm_artists_songs:
            save_songs_inDB(lastfm_artists_songs[artist].values())
    log(0, 'SUCCESSFULL LASTFM SONG AGGREGATION!')
    print(f'Completed lastfm song aggregator, logs: {log_filename}')
asyncio.run(main())