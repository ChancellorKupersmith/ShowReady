import os
import re
import json
import asyncio
import logging
import datetime
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('aggregatorArtist_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logger = Logger('aggregatorArtist', log_file=log_filename)

def get_total_events_fromDB():
    total = 0
    select_query= """
        SELECT COUNT(*) FROM Events
        WHERE created >= NOW() - INTERVAL '1 week' OR Events.updated >= NOW() - INTERVAL '1 week'
    """
    try:
        with PostgresClient(logger=logger) as db:
            total += db.query(query=select_query, fetchone=True)[0]
    except Exception as e:
        logger.error(f"Error fetching total events from Events table returning 0, {e}")
    finally:
        return total

def get_events_fromDB(page_size, offset):
    """_summary_
        - selects all events created within last week
        - for events from ticketmaster performing artists should already be found, but spotify and lastfm meta could be null so to skip extracting names from events,
            - replace event name with performing artists' name
            - remove duplicate event
    """
    # storing events as array for multiple performing artists usecase
    events = []
    eo_select_query = f"""
        SELECT name, id, eventdate FROM Events
        WHERE created >= NOW() - INTERVAL '1 week' OR Events.updated >= NOW() - INTERVAL '1 week'
        OFFSET {offset} LIMIT {page_size}
    """
    tm_select_query = f"""
        SELECT Artists.name, Events.id, Events.tmid, Events.eventdate FROM Events
        JOIN EventsArtists AS ea ON ea.eventid = Events.id AND ea.eventdate = Events.eventdate
        JOIN Artists ON Artists.id = ea.artistid
        WHERE
            Artists.spotifyexternalid IS NULL
            AND Events.tmid IS NOT NULL
            AND Events.created >= NOW() - INTERVAL '1 week' OR Events.updated >= NOW() - INTERVAL '1 week'
        ORDER BY Events.Eventdate DESC
        OFFSET {offset} LIMIT {page_size}
    """
    try:
        with PostgresClient(logger=logger) as db:
            rows = db.query(query=eo_select_query, fetchall=True)
            all_new_events = {row[1]: Event(name=row[0], id=row[1], event_date=row[2]) for row in rows }
            rows = db.query(query=tm_select_query, fetchall=True)
            for row in rows:
                events.append(Event(name=row[0], id=row[1], tm_id=row[2], event_date=row[3]))
                all_new_events.pop(row[1], None) # remove duplicate
            events += list(all_new_events.values())
    except Exception as e:
        logger.error(f"Error fetching events from Events table returning empty list, {e}")
    finally:
        return events

def get_existing_artists_fromDB():
    existing_artists = {}
    select_query = "SELECT name, id FROM Artists WHERE spotifyexternalid IS NOT NULL AND lastfmurl IS NOT NULL"
    try:
        with PostgresClient(logger=logger) as db:
            rows = db.query(query=select_query, fetchall=True)
            existing_artists = {row[0]: row[1] for row in rows}
    except Exception as e:
        logger.error(f"ERROR selecting existing artists from db returning empty set, {e}")
        existing_artists.clear()
    finally:
        return existing_artists

def save_artists_inDB(new_artists_batch):
    def get_existing_spotify_artists_fromDB():
        existing_artists = []
        select_query = "SELECT spotifyexternalid FROM Artists WHERE spotifyexternalid IS NOT NULL"
        try:
            with PostgresClient(logger=logger) as db:
                rows = db.query(query=select_query, fetchall=True)
                existing_artists = [row[0] for row in rows]
        except Exception as e:
            logger.error(f"ERROR selecting existing spotify artists from db returning empty set, {e}")
            existing_artists = []
        finally:
            return existing_artists
    
    def get_existing_lastfm_artists_fromDB():
        existing_artists = []
        select_query = "SELECT name FROM Artists WHERE lastfmurl IS NOT NULL"
        try:
            with PostgresClient(logger=logger) as db:
                rows = db.query(query=select_query, fetchall=True)
                existing_artists = [row[0].lower() for row in rows]
        except Exception as e:
            logger.error(f"ERROR selecting existing lfm artists from db returning empty set, {e}")
            existing_artists = []
        finally:
            return existing_artists

    insert_spotify_query = """
        INSERT INTO Artists (name, spotifyexternalid, spotifypopularity, spotifyimg)
        VALUES %s
        ON CONFLICT (name)
        DO UPDATE SET
            spotifyexternalid = EXCLUDED.spotifyexternalid,
            spotifypopularity = EXCLUDED.spotifypopularity,
            spotifyimg = EXCLUDED.spotifyimg
        RETURNING name, id
    """
    update_spotify_query = """
        INSERT INTO Artists (name, spotifypopularity, spotifyimg)
        VALUES %s
        ON CONFLICT (name)
        DO UPDATE SET
            spotifypopularity = EXCLUDED.spotifypopularity,
            spotifyimg = EXCLUDED.spotifyimg
        RETURNING name, id
    """
    insert_lastfm_query = """
        INSERT INTO Artists (name, lastfmurl)
        VALUES %s
        ON CONFLICT (name)
        DO UPDATE SET
            lastfmurl = EXCLUDED.lastfmurl
        RETURNING name, id
    """
    artist_name_ids = {}
    for na in new_artists_batch.values():
        new_artists = { 'debugging': na }
        logger.info( f"artist: {na.name}, spID: {na.spotify_id}, spPop: {na.spotify_popular}, spImg: {na.spotify_img}, lfm: {na.lastfm_url}")
        try:
            # Insert/Update found artists
            existing_spotify_artists = get_existing_spotify_artists_fromDB()
            existing_lastfm_artists = get_existing_lastfm_artists_fromDB()
            new_spotify_artists = list(filter(lambda artist: artist.spotify_id not in existing_spotify_artists, new_artists.values()))
            new_spotify_artists_tuples = [(a.name, a.spotify_id, a.spotify_popular, a.spotify_img) for a in new_spotify_artists]
            logger.info( 'NEW SPOTIFY ARTISTS:')
            logger.info( new_spotify_artists_tuples)
            update_spotify_artists = list(filter(lambda artist: artist.spotify_id in existing_spotify_artists, new_artists.values()))
            update_spotify_artists_tuples = [(a.name, a.spotify_popular, a.spotify_img) for a in update_spotify_artists]
            logger.info( 'UPDATE SPOTIFY ARTISTS:')
            logger.info( update_spotify_artists_tuples)
            new_lastfm_artists = list(filter(lambda artist: artist.name.lower() not in existing_lastfm_artists, new_artists.values()))
            new_lastfm_artists_tuples = [(a.name, a.lastfm_url) for a in new_lastfm_artists]
            logger.info( 'NEW LASTFM ARTISTS:')
            logger.info( new_lastfm_artists_tuples)
            with PostgresClient(logger=logger) as db:
                if len(new_spotify_artists_tuples) > 0:
                    rows = db.query(query=insert_spotify_query, data=new_spotify_artists_tuples, fetchall=True)
                    logger.warning('hit 1')
                    artist_name_ids.update({row[0]: row[1] for row in rows})
                if len(update_spotify_artists_tuples) > 0:
                    rows = db.query(query=update_spotify_query, data=update_spotify_artists_tuples, fetchall=True)
                    logger.warning('hit 2')
                    artist_name_ids.update({row[0]: row[1] for row in rows})
                if len(new_lastfm_artists_tuples) > 0:
                    rows = db.query(query=insert_lastfm_query, data=new_lastfm_artists_tuples, fetchall=True)
                    logger.warning('hit 3')
                    artist_name_ids.update({row[0]: row[1] for row in rows})
        except Exception as e:
            logger.error(f"Error saving artist to db, {e}")
        #     logger.error(f"Error saving artist to db returning empty list, {e}")
        #     artist_name_ids.clear()
        # finally:
        #     return artist_name_ids
    return artist_name_ids

def save_eventsartists_inDB(events_artists_to_store):
    insert_query = """
        INSERT INTO EventsArtists (artistid, eventid, eventdate)
        VALUES %s
        ON CONFLICT (artistid, eventid) DO NOTHING
    """
    try:
        with PostgresClient(logger=logger) as db:
            db.query(query=insert_query, data=events_artists_to_store)
    except Exception as e:
        logger.error(f"Error saving events-artists to db, {e}")

def save_errors_inDB(artist_not_found_events):
    insert_query = """
        INSERT INTO Errors (eventid, eventdate, errormessage)
        VALUES %s
    """
    try:
        with PostgresClient(logger=logger) as db:
            db.query(query=insert_query, data=artist_not_found_events)
    except Exception as e:
        logger.error(f"Error saving errors to db, {e}")

async def find_artists(events):
    async def query_spotify_artist(spotify_client, name, tmid=None):
        artists = {}
        try:
            resp = await spotify_client.get("/search?", [f"q=artist:{name}", "type=artist", "market=US", "limit=1"])
            logger.info( f"RESP: {resp}")
            if resp.status_code != 200:
                logger.warning(f"Failed to fetch data. Status code:{resp.status_code}")
                return (False, artists)
            json_data = (resp.json())["artists"]
            if json_data["total"] == 0 and tmid is None:
                # try to extract artis name from event
                names = name_split(name)
                if names is not None:
                    for n in names:
                        success, found_artists = await query_spotify_artist(spotify_client, n)
                        artists.update(found_artists)
                else:
                    return (False, artists)
            else:
                artist_list = json_data["items"]
                sp_artist = artist_list[0]
                logger.info( 'SP Artist:')
                logger.info( sp_artist)
                artist_img = None
                sp_artist_imgs = sp_artist.get('images')
                if sp_artist_imgs is not None:
                    artist_img = sp_artist_imgs[0].get('url')
                    logger.warning(f'WARNING: aimg {artist_img}')
                a = Artist(name=sp_artist["name"], spotify_id=sp_artist["id"], spotify_popular=sp_artist["popularity"], spotify_img=artist_img)
                logger.warning(f'WARNING: a spotify img {a.spotify_img}')
                artist = {a.name.lower(): a}
                return (True, artist)
        except Exception as e:
            logger.error(f"ERROR finding artist: {name} on Spotify: {e}")
            return (False, artists)
        return (artists != {}, artists)

    async def query_lastFm_artist(lastfm_client, name, tmid=None):
        artists = {}
        try:
            resp = await lastfm_client.get("artist.search", [f"artist={name}", "limit=1"])
            logger.info( f"RESP: {resp}")
            if resp.status_code != 200:
                logger.warning(f"Failed to fetch data. Status code:{resp.status_code}")
                return (False, artists)
            json_data = (resp.json())["results"]
            artist_list = json_data["artistmatches"]["artist"]
            if len(artist_list) == 0 and tmid is None:
                # try to extract artis name from event
                names = name_split(name)
                if names is not None:
                    for n in names:
                        success, found_artists = await query_lastFm_artist(lastfm_client, n)
                        artists.update(found_artists)
                else:
                    return (False, artists)
            else:
                lastfm_artist = artist_list[0]
                lastfm_img = None
                images = lastfm_artist.get('image')
                if images is not None and len(images) > 0:
                    for img in images:
                        # exclude mock png lastfm provides
                        lastfm_img = None if img['#text'].endswith('2a96cbd8b46e442fc41c2b86b821562f.png') else img['#text']
                if lastfm_img is not None:
                    logger.info( f'LASTFM_IMG: {lastfm_img}')
                a = Artist(name=lastfm_artist["name"], lastfm_url=lastfm_artist["url"], lastfm_img=lastfm_img)
                artist = {a.name.lower(): a}
                return (True, artist)
        except Exception as e:
            logger.error(f"ERROR finding artist: {name} on LastFM: {e}")
            return (False, artists)
        return (artists != {}, artists)
    
    
    artists = {}
    try:
        spotify_client = SpotifyClient(logger=logger)
        await spotify_client.init_access_token()
        lastfm_client = LastFmClient(logger=logger)
        num_new_events = 0
        for event in events:
            artists_not_found = {}
            num_new_events += 1
            tasks = [
                query_lastFm_artist(lastfm_client, event.name, event.tm_id),
                query_spotify_artist(spotify_client, event.name, event.tm_id)
            ]
            results = await asyncio.gather(*tasks)
            for res in results:
                success, new_artists = res
                if success:
                    for new_artist in new_artists.values():
                        # check if other api found artist
                        if new_artist.name.lower() in artists:
                            # and consolidate data if already found
                            if new_artist.spotify_id is None:
                                artists[new_artist.name.lower()].lastfm_url = new_artist.lastfm_url
                                artists[new_artist.name.lower()].lastfm_img = new_artist.lastfm_img
                            else:
                                new_artist.lastfm_url = artists[new_artist.name.lower()].lastfm_url
                                new_artist.lastfm_img = artists[new_artist.name.lower()].lastfm_img
                                artists[new_artist.name.lower()] = new_artist
                            logger.warning(f'WARNING new artist sp img: ({new_artist.name}, {new_artist.spotify_img})')
                        else:
                            artists[new_artist.name.lower()] = new_artist
                        # logger.info( f"cached artist: {artists[new_artist.name.lower()].asdict()}")
                else:
                    # Not found in either api
                    if event.id in artists_not_found:
                        logger.warning(f"Failed to find artist for event: ({event.name},{event.id})")
                    artists_not_found[event.id] = True
    except Exception as e:
        logger.error(f"ERROR: Failed to find artists: {e}")
    return artists

not_found_names = {}
def name_split(name):
    patterns = [
        # name: name
        r"(.+): (.+)",
        # name - name
        r"(.+) - (.+)",
        # name live name
        r"(.+) live (.+)",
        # the best of name
        r"the best of (.+)",
        # name with name
        r"(.+) with (.+)",
        r"(.+) w/ (.+)",
        # name ft name
        r"(.+) ft (.+)",
        # name feat name
        r"(.+) feat (.+)",
        # name featuring name
        r"(.+) featuring (.+)",
        # name & name
        r"(.+) & (.+)"
        # name and name,
        r"(.+) and (.+)",
        # name, name
        r"(.+), (.+)"
    ]
    for pattern in patterns:
        match = re.match(pattern, name, re.IGNORECASE)
        if match:
            return match.groups()
    if not_found_names.get(name):
        return None
    else:
        not_found_names[name] = True
        return [name]

async def main():
    print('Started artist aggregator')
    existing_artists = get_existing_artists_fromDB()
    total = get_total_events_fromDB()
    page_size = 10
    logger.info( f"number of new shows: {total}")
    for page in range(int(total / page_size)):
        events = get_events_fromDB(page_size, page * page_size)
        # Avoid unnecessary find_artist compute by filter new artists not saved in db
        new_artist_events = list(filter(lambda event: event.name not in existing_artists.keys(), events))
        logger.info( f"number of new artist events: {len(new_artist_events)}")
        new_artists = await find_artists(new_artist_events)
        # new_artists = await find_artists(events)
        artist_name_ids = save_artists_inDB(new_artists)
        # Match events to artists for event-artist join table in db
        if artist_name_ids is not None:
            existing_artists.update(artist_name_ids)
        events_artists_list = []
        artist_not_found_events = []
        for event in events:
            artistId = existing_artists.get(event.name, None)
            if artistId is None:
                artist_not_found_events.append((event.id, event.date, f"no artists found for event: {event.name}"))
            else:
                events_artists_list.append((artistId, event.id, event.date))
        logger.warning(f'Total artist not fonud events: {len(artist_not_found_events)}')
        save_errors_inDB(artist_not_found_events)
        save_eventsartists_inDB(events_artists_list)
    logger.info( 'SUCCESSFULL ARTIST AGGREGATION!')
    print(f'Completed artist aggregator, logs: {log_filename}')
asyncio.run(main())