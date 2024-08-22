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

def get_shows(page):
    shows = []
    offset = str(page * 250)
    select_query= f"SELECT DISTINCT Name, ID FROM Events OFFSET {offset} LIMIT 250"
    try:
        with PostgresClient(log=log) as db:
        shows = db.query(query=select_query, fetchall=True)
    except Exception as e:
        log(1, f"Error fetching events from Events table: {e}\nReturning empty list")
    finally:
        return shows

def get_existing_db_artists():
    existing_artists = {}
    select_query = "SELECT Name, ID FROM artists"
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            existing_artists = {row[0]: row[1] for row in rows}
    except Exception as e:
        log(1, f"ERROR selecting existing artists from db returning empty set. {e}")
        existing_artists.clear()
    finally:
        return existing_artists

def save_artists_to_db(artists_to_save):
    insert_query = """
        INSERT INTO Artists (Name, SpotifyExternalId, SpotifyPopularity, LastFmUrl)
        VALUES %s
        ON CONFLICT (Name)
        DO UPDATE SET
            SpotifyExternalId = EXCLUDED.SpotifyExternalId,
            SpotifyPopularity = EXCLUDED.SpotifyPopularity,
            LastFmUrl = EXCLUDED.LastFmUrl
        RETURNING Name, ID
    """
    artist_name_ids = {}
    try:
        artist_data = [(artist['name'], artist['spotify_external_id'], artist['spotify_popularity'], artist['lastfm_url']) for artist in artists_to_save]
        with PostgresClient(log=log) as db:
            rows = db.query(query=insert_query, data=artist_data, fetchall=True)
            artist_name_ids = {row[0]: row[1] for row in rows}
    except Exception as e:
        log(1, f"Error saving artist to db: {e}. Returning empty list")
        artist_name_ids.clear()
    finally:
        return artist_nameIds

def save_eventsartists_to_db(events_artists_to_store):
    insert_query = """
        INSERT INTO EventsArtists (ArtistID, EventID)
        VALUES %s
        ON CONFLICT (ArtistID, EventID)
        DO NOTHING;
    """
    try:
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=events_artists_to_store)
    except Exception as e:
        log(1, f"Error saving events-artists to db, {e}")

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

async def find_artists(shows):
    try:
        spotify_client = SpotifyClient(log=log)
        await spotify_client.init_access_token()
        lastfm_client = LastFmClient(log=log)
        num_new_shows = 0
        num_unfound_artist = 0
        artists_not_found = {}
        artists = {}
        for show in shows:
            num_new_shows += 1
            name, show_id = show
            tasks = [
                query_lastFm_artist(lastfm_client, name),
                query_spotify_artist(spotify_client, name)
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
                    if show_id in artists_not_found:
                        log(2, f"Failed to find artist for show: ({name},{show_id})")
                        num_unfound_artist += 1
                    artists_not_found[show_id] = True
        # log(0, f'Number of new shows: {num_new_shows}')
        # log(0, f'Num new artists: {len(artists)}')
        # log(2, f"Number of artists not found: {num_unfound_artist}")
        return artists
    except Exception as e:
        log(1, f"ERROR: Failed to find artists: {e}")
        return {}


async def main():
    print('Started artist aggregator')
    for page in range(11):
        shows = get_shows(page)
        existing_artists = get_existing_db_artists()
        # Avoid unnecessary find_artist compute by filter new artists not saved in db, show[0] is performing artists name
        new_artist_shows = filter(lambda show: show[0] not in existing_artists, shows)
        new_artists = await find_artists(new_artist_shows)
        new_artists_tuples = list(map(lambda artist: artist.to_tuple(), new_artists.values()))
        artist_nameIds = save_artists_to_db(new_artists_tuples)
        # Match shows to artists for event-artist join table in db
        existing_artists.update(artist_nameIds)
        events_artists_list = []
        artist_not_found_shows = []
        for show in shows:
            artistId = existing_artists.get(show[0], None)
            if artistId is None:
                artist_not_found_shows.append(show)
            else:
                events_artists_list.append((artistId, show[1]))
        log(2, f'Artist not fonud shows: {artist_not_found_shows}')
        log(2, f'Total artist not fonud shows: {len(artist_not_found_shows)}')
        # Save events-artists list to db
        save_eventsartists_to_db(events_artists_list)
    log(0, 'SUCCESSFULL ARTIST AGGREGATION!')
    print(f'Completed artist aggregator, logs: {log_filename}')
asyncio.run(main())