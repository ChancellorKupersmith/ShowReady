import os
import re
import asyncio
import logging
import urllib.parse
from aggregatorUtils import *
from datetime import datetime, timedelta
# from selenium import webdriver
# from selenium.webdriver.common.by import By
# from selenium.webdriver.firefox.options import Options

current_path = os.getcwd()
log_filename = datetime.now().strftime('aggregatorShowTM_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logger = Logger('aggregatorShow', log_file=log_filename)

@timer_decorator(logger)
async def tm_event_aggr():
    @timer_decorator(logger)
    def get_tmvenues_fromDB():
        tm_venues = {}
        select_query= """
            SELECT id, name, tmid FROM Venues
            WHERE tmid IS NOT NULL
        """
        try:
            with PostgresClient(log=log) as db:
                rows = db.query(query=select_query, fetchall=True)
                tm_venues = { row[1].lower(): Venue(id=row[0], name=row[1], tm_id=row[2]) for row in rows }
        except Exception as e:
            logger.error( f"Error fetching tm venues from Venues table returning empty, {e}")
        finally:
            return tm_venues

    @timer_decorator(logger)
    def save_new_venues_inDB(new_venues):
        venue_names_ids = {}
        insert_query = """
            INSERT INTO Venues (name, tmid, venueaddress, lng, lat)
            VALUES %s
            ON CONFLICT (name, venueaddress)
            DO UPDATE SET
                tmid = EXCLUDED.tmid,
                lng = EXCLUDED.lng,
                lat = EXCLUDED.lat
        """
        select_query = "SELECT Name, ID, TMID FROM Venues"
        try:
            with PostgresClient(log=log) as db:
                result = db.query(query=select_query, fetchall=True)
                existing_db_tm_venues = {row[2]: True for row in result}
                save_venues = [(v.name, v.tm_id, v.venue_address, v.lng, v.lat) for v in new_venues.values() if existing_db_tm_venues.get(v.tm_id) is None]
                if len(save_venues) > 0:
                    db.query(query=insert_query, data=save_venues)
                    rows = db.query(query=select_query, fetchall=True)
                    venue_names_ids = {row[0].lower(): row[1] for row in rows}
        except Exception as e:
            logger.error( f"Error saving new venues in Venues table returning empty, {e}")
        finally:
            return venue_names_ids

    @timer_decorator(logger)
    def save_new_events_inDB(events_to_save, venueIDs):
        event_tmids_ids = {}
        # If eo already found, update tmid, if tm already found ignore(update info? if notice problem with accurate data)
        insert_query = """
            INSERT INTO Events (name, tmid, tmimg, eventdate, eventtime, price, venueid)
            VALUES %s
            ON CONFLICT (name, eventdate)
            DO UPDATE SET
                tmid = EXCLUDED.tmid,
                tmimg = EXCLUDED.tmimg,
                eventtime = EXCLUDED.eventtime,
                price = EXCLUDED.price,
                venueid = EXCLUDED.venueid
        """
        update_query = """
            INSERT INTO Events (name, eventdate, tmid, tmimg, eventtime, price, venueid)
            VALUES %s
            ON CONFLICT (tmid, eventdate)
            DO UPDATE SET
                eventdate = EXCLUDED.eventdate,
                tmimg = EXCLUDED.tmimg,
                eventtime = EXCLUDED.eventtime,
                price = EXCLUDED.price,
                venueid = EXCLUDED.venueid
        """
        # order by ascending date, assuming latest date is most accurate
        select_query = f"SELECT tmid, id, eventdate FROM Events WHERE tmid = ANY(%s) ORDER BY eventdate ASC"
        select_existing_query = f"SELECT tmid, eventdate FROM Events WHERE tmid = ANY(%s)"
        try:
            with PostgresClient(log=log) as db:
                # filter out already existing tm events
                evs = events_to_save.values()
                event_tmids_ids = { ev[0].tm_id: Event(name=ev[0].name, event_date=ev[0].date) for ev in evs}
                existing_tm_events_rows = db.query(query=select_existing_query, params=[key for key in event_tmids_ids.keys()], fetchall=True)
                existing_tm_ids = [row[0] for row in existing_tm_events_rows]
                existing_tm_dates = [row[1] for row in existing_tm_events_rows]
                new_events = [(ev[0].namec, ev[0].tm_id, ev[0].tm_img, ev[0].date, ev[0].time, ev[0].price, venueIDs.get(ev[1].name.lower())) for ev in evs if ev[0].tm_id not in existing_tm_ids]
                update_event_dates = [(ev[0].name, ev[0].date, ev[0].tm_id, ev[0].tm_img, ev[0].time, ev[0].price,venueIDs.get(ev[1].name.lower())) for ev in evs if ev[0].tm_id in existing_tm_ids and ev[0].date not in existing_tm_dates]
                logger.info( f'NEW EVENTS FOUND: {len(new_events)}')
                if len(new_events) > 0:
                    # Save new events
                    db.query(query=insert_query, data=new_events)
                else:
                    logger.warning( 'No new events found')
                if len(update_event_dates) > 0:
                    db.query(query=update_query, data=update_event_dates)
                else:
                    logger.warning( 'No new updated event dates found')
                # get all event ids for event artist join table
                rows = db.query(query=select_query, params=[key for key in event_tmids_ids.keys()], fetchall=True)
                for row in rows:
                    event = event_tmids_ids.get(row[0])
                    if event is not None:
                        event.id = row[1]
        except Exception as e:
            logger.error( f"Error saving new events in events table returning empty, {e}")
        finally:
            return event_tmids_ids

    def convert_http_to_https(url):
        if url.startswith("http://"):
            return "https://" + url[7:]  # Skip the "http://"
        return url

    @timer_decorator(logger)
    def save_new_artists_inDB(artists_to_save):
        """ Handling artists found on ticketmaster reasoning
            Because artists have multiple unique traits and postgres queries can't handle
            multiple on conflict statements, I have to either:
                1. merge existing db artists with tm found artists, then delete previous artists and insert newly merged
                2. handle 1 type of potential on conflict, and prioritize what is most important unique data to store
                    - Choosing 2 because I think overall it will be less compute for same results.
                        - less db calls
                    - prioritizing lastfm url because its the source with the avg most meta on artists
            POA:
            - if artist with tmid already found ignore (SELECT)
            - if artist with lastfmurl already found ignore (ON CONFLICT DISTINCT)
            - else insert/update artists
        """
        insert_query = """
            INSERT INTO Artists (name, tmid, tmimg, website, mbid)
            VALUES %s
            ON CONFLICT (name) DO UPDATE SET
                tmid = EXCLUDED.tmid,
                tmimg = EXCLUDED.tmimg,
                website = EXCLUDED.website,
                mbid = EXCLUDED.mbid
        """
        select_existing_query = f"SELECT tmid FROM Artists WHERE tmid = ANY(%s)"
        select_allIDs_query = f"SELECT tmid, id FROM Artists WHERE tmid = ANY(%s)"
        artist_tmids_ids = {}
        try:
            with PostgresClient(log=log) as db:
                a_vals = []
                # ensure all lastfm urls are unique (convert http to https to reduce duplicates)
                found_lfms = {}
                a_vals_unfiltered = artists_to_save.values()
                for a in a_vals_unfiltered:
                    if a.lastfm_url is not None and a.lastfm_url != '':
                        a.lastfm_url = convert_http_to_https(a.lastfm_url)
                        if found_lfms.get(a.lastfm_url) is None:
                            found_lfms[a.lastfm_url] = a.name
                            a_vals.append(a)
                        else:
                            continue
                    else:
                        a_vals.append(a)

                artist_tmids_ids = { a.tm_id: Artist(name=a.name) for a in a_vals }
                # filter out existing tmid artists
                existing_artists_rows = db.query(query=select_existing_query, params=[ key for key in artist_tmids_ids.keys() ], fetchall=True)
                existing_artists_tmids = [ row[0] for row in existing_artists_rows ]
                new_artists = [ (a.name, a.tm_id, a.tm_img, a.website, a.mb_id) for a in a_vals if a.tm_id not in existing_artists_tmids ] # if a.tm_id not in existing_artists_tmids
                logger.info( f'NEW ARTISTS FOUND: {len(new_artists)}')
                if len(new_artists) > 0:
                    # save new artists
                    db.query(query=insert_query, data=new_artists)
                else:
                    logger.warning( 'No new artists found')
                # get all artist ids for event artist join table
                rows = db.query(query=select_allIDs_query, params=[ key for key in artist_tmids_ids.keys() ], fetchall=True)
                for row in rows:
                    artist = artist_tmids_ids.get(row[0])
                    if artist is not None:
                        artist.id = row[1]
        except Exception as e:
            logger.error( f"Error saving new artists in db returning empty, {e}")
        finally:
            return artist_tmids_ids

    @timer_decorator(logger)
    def save_events_artists(events_artists, eventIDs, artistIDs):
        """
            events_artists structure: (event_tmid, artist_tmid)
            eventIDs structure: {event_tmid: Event}
            artistIDs structure: {artist_tmid: Artist}
        """
        insert_query = """
            INSERT INTO EventsArtists (eventid, eventdate, artistid)
            VALUES %s
            ON CONFLICT (eventid, artistid) DO UPDATE SET
                eventdate = EXCLUDED.eventdate
        """
        try:
            new_artist_events = []
            event_error = 0
            artist_error = 0
            success = 0
            for ea in events_artists:
                e_id = None
                e_date = None
                a_id = None
                try:
                    e_id = eventIDs[ea[0]].id
                    e_date = eventIDs[ea[0]].date
                except Exception as e:
                    logger.warning( f"failed saving event to db, {e}")
                    event_error += 1
                try:
                    a_id = artistIDs[ea[1]].id
                except Exception as e:
                    logger.warning( f"failed saving artist to db, {e}")
                    artist_error += 1
                if a_id is not None and e_id is not None:
                    try:
                        with PostgresClient(log=log) as db:
                            db.query(query=insert_query, data=[(e_id, e_date, a_id)])
                            new_artist_events.append((e_id, e_date, a_id))
                            success += 1
                    except Exception as e:
                        logger.error( f"Error saving new events-artists to db, {e}")
            logger.info( f'success: {success}, event_errors: {event_error}, artist_errors: {artist_error}')
        except Exception as e:
            logger.error( f"Error in parent func saving new events-artists to db, {e}")

    @timer_decorator(logger)
    def save_new_genres(new_genres, artistIDs):
        """
            saves genres, gets ids, adds to join tables
            new_genres structure: {artist_tmid: {String,}}
            artistIDs structure: {artist_tmid: Artist}
        """
        insert_query_genres = """
            INSERT INTO Genres (name)
            VALUES %s
            ON CONFLICT (name) DO UPDATE
                SET name = EXCLUDED.name -- redundant update to ensure ids returned for join table insert
            RETURNING Name, ID;
        """
        db_genres = {}
        try:
            unique_genres = set()
            for g_set in new_genres.values():
                for genre in g_set:
                    unique_genres.add(genre)
            genre_names = [(name,) for name in unique_genres]
            logger.info( f"genre_names: {genre_names}")
            with PostgresClient(log=log) as db:
                if genre_names:

                    result = db.query(insert_query_genres, data=genre_names, fetchall=True)
                    db_genres = { row[0]: Genre(id=row[1], name=row[0]) for row in result }
        except Exception as e:
            logger.error( f"Error saving genres to db, {e}")

        insert_query_artistsgenres = """
            INSERT INTO ArtistsGenres (artistid, genreid)
            VALUES %s
            ON CONFLICT DO NOTHING
        """
        try:
            join_artists_genres = []
            for artist_tmid, genres in new_genres.items():
                artist = artistIDs.get(artist_tmid)
                if not artist:
                    logger.warning( f"Artist with tmid {artist_tmid} not found in artistIDs")
                    continue
                for g in genres:
                    try:
                        genre = db_genres.get(g)
                        if not genre:
                            logger.warning( f"Genre {g} not found in db_genres for artist {artist_tmid}")
                            continue
                        join_artists_genres.append((artist.id, genre.id))
                    except Exception as e:
                        logger.warning( f'Failed to add tm_artist({artist_tmid}) db id for genre: {g} - {e}')
            logger.info( f'successful genres found: {len(join_artists_genres)}')
            if join_artists_genres:
                with PostgresClient(log=log) as db:
                    db.query(insert_query_artistsgenres, data=join_artists_genres)
        except Exception as e:
            logger.error( f"Error in parent func saving new genres to db, {e}")

    @timer_decorator(logger)
    async def scrape_ticketmaster_events(tm_venues):
        def extract_id(spotify_url):
            # example url: https://open.spotify.com/artist/{id}?{params}
            parsed_url = urllib.parse.urlparse(spotify_url)
            path_parts = parsed_url.path.split('/')
            return path_parts[2]

        def extract_event(tm_event):
            # Required data
            event_name = tm_event['name']
            event_tmid = tm_event['id']
            date = tm_event['dates']['start']['localDate']
            # Optional meta
            time = None
            price = None
            tm_img = None
            try:
                time = tm_event['dates']['start'].get('localTime')
                price_ranges = tm_event.get('priceRanges')
                if price_ranges is not None:
                    priceMin = price_ranges[0].get('min')
                    priceMax = price_ranges[0].get('max')
                    price = f'${priceMin} - ${priceMax}'
                imgs = tm_event.get('images')
                if imgs is not None:
                    tm_img = imgs[0].get('url')
            except Exception as e:
                logger.error( f"ERROR extracting ticketmaster event meta, {e}")
            logger.info( f'Extracted Event: (name: {event_name}, tmid: {event_tmid}, date: {date}, time: {time}, price: {price})')
            return Event(name=event_name, tm_id=event_tmid, event_date=date, event_time=time, price=price, tm_img=tm_img)

        def extract_artist(artist):
            # Required data
            name = artist['name']
            tm_id = artist['id']
            # Optional meta
            lastfm_url = ''
            spotify_id = ''
            artist_website_url = ''
            musicbrainz_id = ''
            tm_img = None
            external_links = artist.get('externalLinks')
            if external_links is not None:
                lastfms = external_links.get('lastfm')
                if lastfms is not None:
                    lastfm_url = lastfms[0].get('url')
                spotifys = external_links.get('spotify')
                if spotifys is not None:
                    spotify_id = extract_id(spotifys[0].get('url'))
                artist_websites = external_links.get('homepage')
                if artist_websites is not None:
                    artist_website_url = artist_websites[0].get('url')
                musicbrainz_ids = external_links.get('musicbrainz')
                if musicbrainz_ids is not None:
                    musicbrainz_id = musicbrainz_ids[0].get('id')
            imgs = artist.get('images')
            if imgs is not None:
                tm_img = imgs[0].get('url')
            logger.info( f'Extracted Artist: (name: {name}, tmid: {tm_id}, tm_img: {tm_img}, lfm_url: {lastfm_url}, sp_id: {spotify_id}, web: {artist_website_url}, mbid: {musicbrainz_id})')
            return Artist(name=name, tm_id=tm_id, tm_img=tm_img, lastfm_url=lastfm_url, spotify_id=spotify_id, website=artist_website_url, mb_id=musicbrainz_id)

        def extract_venue(venue):
            address = ''
            va = venue.get('address')
            if va is not None:
                address = va.get('line1')
            new_venue = Venue(name=venue['name'], tm_id=venue['id'], venue_address=address, lng=venue['location']['longitude'], lat=venue['location']['latitude'])
            return new_venue
        
        def extract_genre(classification):
            # checks for sub genre first (more descriptive), returns none otherwise
            sub_g = classification.get('subGenre')
            if sub_g is not None:
                if sub_g.get('name') != 'Music':
                    return sub_g['name']
            else:
                g = classification.get('genre')
                if g is not None:
                    if g.get('name') != 'Music':
                        return g['name']

        """ Scraping Notes
            events structure: { name-date: (Event, Venue) }
            new_venues structure: { name: Venue }
            new_artists structure: { name: Artist }
            new_genres structure: { artist_tmid: { Genre, } }
            events_artists structure: [ (event_tmid, artist_tmid) ]
        """
        client = TicketMasterClient(log=log)
        events = {}
        new_venues = {}
        new_artists = {}
        new_genres = {}
        events_artists = []
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        # Scrape 1000 upcoming events from seattle (purpose: get events and potentially new ticketmaster venues)
        for page in range(1):
            try:
                params = [ f"city=Seattle", "size=200", f"page={page}", "classificationName=music", f"startDateTime={urllib.parse.quote(yesterday.strftime('%Y-%m-%dT%H:%M:%SZ'))}" ]
                resp = await client.get('/events.json?', params)
                if resp.status_code != 200:
                    logger.error( f'failed to fetch ticketmaster events for Seattle')
                    continue
                data = resp.json()
                logger.info( f"BY CITY")
                if data['page']['totalElements'] > 0:
                    if data.get('_embedded') is None:
                            logger.warning( f'_embedded missing, resp: {data}')
                            continue
                    for tm_event in data['_embedded']['events']:
                        new_event = extract_event(tm_event)
                        # get event genres
                        found_genres = []
                        classifications = tm_event['classifications']
                        if classifications is not None:
                            for classification in classifications:
                                genre = extract_genre(classification)
                                if genre is not None:
                                    found_genres.append(genre)
                        if tm_event.get('_embedded') is None:
                            logger.warning( f'event _embedded missing, event: {tm_event}')
                            continue
                        venues = tm_event['_embedded'].get('venues')
                        if venues is not None:
                            for tm_venue in venues: 
                                new_venue = extract_venue(tm_venue)
                                new_venues[new_venue.name.lower()] = new_venue
                                # add new venue to tm_venues to be included in following search
                                tm_venues[new_venue.name.lower()] = new_venue
                                events[f'{new_event.name.lower()}-{new_event.date}'] = (new_event, new_venue)
                        # get artists
                        artists = tm_event['_embedded'].get('attractions')
                        if artists is not None:
                            for tm_artist in artists:
                                new_artist = extract_artist(tm_artist)
                                new_artists[new_artist.name.lower()] = new_artist
                                events_artists.append((new_event.tm_id, new_artist.tm_id))
                                # get genres from artists
                                artist_classifications = tm_artist['classifications']
                                if artist_classifications is not None:
                                    for classification in artist_classifications:
                                        genre = extract_genre(classification)
                                        if genre is not None:
                                            found_genres.append(genre)
                                    # tag artist with genres
                                    if new_genres.get(new_artist.tm_id) is None and len(found_genres) > 0:
                                        new_genres[new_artist.tm_id] = set()
                                    for genre in found_genres:
                                        new_genres[new_artist.tm_id].add(genre)
            except Exception as e:
                logger.error( f"ERROR fetching ticketmaster events from Seattle. {e}")
        # Scrape tm venues for upcoming shows
        for venue in tm_venues.values():
            for page in range(1):
                try:
                    params = [ f"venueId={venue.tm_id}", "size=200", f"page={page}", "classificationName=music", f"startDateTime={urllib.parse.quote(yesterday.strftime('%Y-%m-%dT%H:%M:%SZ'))}" ]
                    resp = await client.get('/events.json?', params)
                    if resp.status_code != 200:
                        logger.error( f'failed to fetch ticketmaster event for {venue.name}')
                        continue
                    data = resp.json()
                    logger.info( f"BY VENUE")
                    if data['page']['totalElements'] > 0:
                        if data.get('_embedded') is None:
                            logger.warning( f'_embedded missing, resp: {data}')
                            continue
                        for tm_event in data['_embedded']['events']:
                            new_event = extract_event(tm_event)
                            events[f'{new_event.name.lower()}-{new_event.date}'] = (new_event, venue)
                            # get event genres
                            found_genres = []
                            classifications = tm_event['classifications']
                            if classifications is not None:
                                for classification in classifications:
                                    genre = extract_genre(classification)
                                    if genre is not None:
                                        found_genres.append(genre)
                            # get artists
                            if tm_event.get('_embedded') is None:
                                logger.warning( f'event _embedded missing, event: {tm_event}')
                                continue
                            artists = tm_event['_embedded'].get('attractions')
                            if artists is not None:
                                for tm_artist in artists:
                                    new_artist = extract_artist(tm_artist)
                                    new_artists[new_artist.name.lower()] = new_artist
                                    events_artists.append((new_event.tm_id, new_artist.tm_id))
                                    #  get genres from artists
                                    artist_classifications = tm_artist['classifications']
                                    if artist_classifications is not None:
                                        for classification in artist_classifications:
                                            genre = extract_genre(classification)
                                            if genre is not None:
                                                found_genres.append(genre)
                                        # tag artist with genres
                                        if new_genres.get(new_artist.tm_id) is None and len(found_genres) > 0:
                                            new_genres[new_artist.tm_id] = set()
                                        for genre in found_genres:
                                            new_genres[new_artist.tm_id].add(genre)
                except Exception as e:
                    logger.error( f"ERROR fetching ticketmaster events from venues. {e}")
        return (events, new_venues, new_artists, events_artists, new_genres)
    
    # Execute
    try:
        tm_venues = get_tmvenues_fromDB()
        events, new_venues, new_artists, events_artists, new_genres = await scrape_ticketmaster_events(tm_venues)
        venueIDs = save_new_venues_inDB(new_venues)
        eventIDs = save_new_events_inDB(events, venueIDs)
        artistIDs = save_new_artists_inDB(new_artists)
        save_events_artists(events_artists, eventIDs, artistIDs)
        save_new_genres(new_genres, artistIDs)
    except Exception as e:
        logger.error( f"ERROR aggregating ticketmaster events. {e}")


async def main():
    await tm_event_aggr()
    logger.info( 'SUCCESSFULL EVENTS AGGREGATION!')
    print(f'Completed event aggregator, logs: {log_filename}')
asyncio.run(main())