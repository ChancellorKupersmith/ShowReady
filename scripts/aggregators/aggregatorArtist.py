import os
import json
import asyncio
import logging
import datetime
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('aggregatorArtist_%Y%m%d_%H%M%S.log')
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

def get_total_events_fromDB():
    total = 0
    # select_query= """
    #     SELECT COUNT(DISTINCT name) FROM Events
    #     WHERE created >= NOW() - INTERVAL '1 week'
    #     OR updated >= NOW() - INTERVAL '1 week'
    # """
    select_query= """
        SELECT COUNT(*) FROM Events
        WHERE created >= NOW() - INTERVAL '1 week'
        OR updated >= NOW() - INTERVAL '1 week'
    """
    try:
        with PostgresClient(log=log) as db:
            total = db.query(query=select_query, fetchone=True)[0]
    except Exception as e:
        log(1, f"Error fetching total events from Events table returning 0, {e}")
    finally:
        return total

def get_events_fromDB(page_size, offset):
    events = []
    # select_query= f"""
    #     SELECT DISTINCT name, id FROM Events
    #     WHERE created >= NOW() - INTERVAL '1 week'
    #     OR updated >= NOW() - INTERVAL '1 week'
    #     OFFSET {offset} LIMIT {page_size}
    # """
    select_query= f"""
        SELECT name, id FROM Events
        WHERE created >= NOW() - INTERVAL '1 week'
        OR updated >= NOW() - INTERVAL '1 week'
        OFFSET {offset} LIMIT {page_size}
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            events = [ Event(name=row[0], id=row[1]) for row in rows ]
    except Exception as e:
        log(1, f"Error fetching events from Events table returning empty list, {e}")
    finally:
        return events

def get_existing_artists_fromDB():
    existing_artists = {}
    select_query = "SELECT name, id FROM Artists"
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            existing_artists = {row[0]: row[1] for row in rows}
    except Exception as e:
        log(1, f"ERROR selecting existing artists from db returning empty set, {e}")
        existing_artists.clear()
    finally:
        return existing_artists

def save_artists_inDB(artists_to_save):
    insert_query = """
        INSERT INTO Artists (name, spotifyexternalid, spotifypopularity, lastfmurl)
        VALUES %s
        ON CONFLICT (name)
        DO UPDATE SET
            spotifyexternalid = EXCLUDED.spotifyexternalid,
            spotifypopularity = EXCLUDED.spotifypopularity,
            lastfmurl = EXCLUDED.lastfmurl
        RETURNING name, id
    """
    artist_name_ids = {}
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=insert_query, data=artists_to_save, fetchall=True)
            artist_name_ids = {row[0]: row[1] for row in rows}
    except Exception as e:
        log(1, f"Error saving artist to db returning empty list, {e}")
        artist_name_ids.clear()
    finally:
        return artist_name_ids

def save_eventsartists_inDB(events_artists_to_store):
    insert_query = """
        INSERT INTO EventsArtists (artistid, eventid)
        VALUES %s
        ON CONFLICT (artistid, eventid) DO NOTHING
    """
    try:
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=events_artists_to_store)
    except Exception as e:
        log(1, f"Error saving events-artists to db, {e}")

def save_errors_inDB(artist_not_found_events):
    insert_query = """
        INSERT INTO Errors (eventid, errormessage)
        VALUES %s
    """
    try:
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=artist_not_found_events)
    except Exception as e:
        log(1, f"Error saving errors to db, {e}")

async def query_spotify_artist(spotify_client, name):
    try:
        resp = await spotify_client.get("/search?", [f"q=artist%3A{name}", "type=artist", "market=US", "limit=1"])
        log(0, f"RESP: {resp}")
        if resp.status_code != 200:
            log(2, f"Failed to fetch data. Status code:{resp.status_code}")
            return (False, None)
        json_data = (resp.json())["artists"]
        if json_data["total"] == 0:
            return (False, None)
        artist_list = json_data["items"]
        sp_artist = artist_list[0]
        artist = Artist(name=sp_artist["name"], spotify_id=sp_artist["id"], spotify_popular=sp_artist["popularity"])
        return (True, artist)
    except Exception as e:
        log(1, f"ERROR finding artist: {name} on Spotify: {e}")
        return (False, None)

async def query_lastFm_artist(lastfm_client, name):
    try:
        resp = await lastfm_client.get("artist.search", [f"artist={name}", "limit=1"])
        log(0, f"RESP: {resp}")
        if resp.status_code != 200:
            log(2, f"Failed to fetch data. Status code:{resp.status_code}")
            return (False, None)
        json_data = (resp.json())["results"]
        artist_list = json_data["artistmatches"]["artist"]
        if len(artist_list) == 0:
            return (False, None)
        lastfm_artist = artist_list[0]
        artist = Artist(name=lastfm_artist["name"], lastfm_url=lastfm_artist["url"])
        return (True, artist)
    except Exception as e:
        log(1, f"ERROR finding artist: {name} on LastFM: {e}")
        return (False, None)

async def find_artists(events):
    artists = {}
    try:
        spotify_client = SpotifyClient(log=log)
        await spotify_client.init_access_token()
        lastfm_client = LastFmClient(log=log)
        num_new_events = 0
        for event in events:
            artists_not_found = {}
            num_new_events += 1
            tasks = [
                query_lastFm_artist(lastfm_client, event.name),
                query_spotify_artist(spotify_client, event.name)
            ]
            results = await asyncio.gather(*tasks)
            for res in results:
                success, new_artist = res
                if success:
                    # check if other api found artist
                    if new_artist.name.lower() in artists:
                        # determine if new artist data from spotify or lastfm
                        if new_artist.spotify_id is None:
                            artists[new_artist.name.lower()].lastfm_url = new_artist.lastfm_url
                        else:
                            new_artist.lastfm_url = artists[new_artist.name.lower()].lastfm_url
                            artists[new_artist.name.lower()] = new_artist
                    else:
                        artists[new_artist.name.lower()] = new_artist
                    # log(0, f"cached artist: {artists[new_artist.name.lower()].asdict()}")
                else:
                    # Not found in either api
                    if event.id in artists_not_found:
                        log(2, f"Failed to find artist for event: ({event.name},{event.id})")
                    artists_not_found[event.id] = True
    except Exception as e:
        log(1, f"ERROR: Failed to find artists: {e}")
    return artists


async def main():
    print('Started artist aggregator')
    existing_artists = get_existing_artists_fromDB()
    total = get_total_events_fromDB()
    page_size = 250
    log(0, f"number of new shows: {total}")
    for page in range(int(total / page_size)):
        events = get_events_fromDB(page_size, page * page_size)
        # Avoid unnecessary find_artist compute by filter new artists not saved in db, event[0] is performing artists name
        new_artist_events = list(filter(lambda event: event.name not in existing_artists, events))
        log(0, f"number of new artist events: {len(new_artist_events)}")
        new_artists = await find_artists(new_artist_events)
        new_artists_tuples = list(map(lambda artist: artist.to_tuple(), new_artists.values()))
        artist_name_ids = save_artists_inDB(new_artists_tuples)

        # Match events to artists for event-artist join table in db
        existing_artists.update(artist_name_ids)
        events_artists_list = []
        artist_not_found_events = []
        for event in events:
            artistId = existing_artists.get(event.name, None)
            if artistId is None:
                artist_not_found_events.append((event.id, f"no artists found for event: {event.name}"))
            else:
                events_artists_list.append((artistId, event.id))
        log(2, f'Total artist not fonud events: {len(artist_not_found_events)}')

        save_errors_inDB(artist_not_found_events)
        save_eventsartists_inDB(events_artists_list)
    log(0, 'SUCCESSFULL ARTIST AGGREGATION!')
    print(f'Completed artist aggregator, logs: {log_filename}')
asyncio.run(main())