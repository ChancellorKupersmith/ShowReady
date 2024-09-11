import os
import re
import logging
import datetime
import asyncio
import urllib.parse
from aggregatorUtils import *


current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('venueScraper_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logging.basicConfig(
    filename=log_filename,
    filemode='w',
    format='%(asctime)s %(levelname)s [%(filename)s:%(lineno)d] - %(message)s',
    level=logging.DEBUG
)

def log(lvl, msg):
    if lvl == 0: logging.info(msg=msg)
    elif lvl == 1: logging.error(msg=msg)
    else: logging.warning(msg=msg)

@timer_decorator
def get_venues_fromDB():
    select_query = """
        SELECT name, id, venueaddress FROM Venues
        WHERE lat IS NULL AND venueaddress IS NOT NULL
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            venues = [ Venue(name=row[0], id=row[1], venueaddress=row[2]) for row in rows ]
            return venues
    except Exception as e:
        log(1, f"ERROR fetching venues from db returning None. {e}")
        return None

@timer_decorator
def get_venue_coordinates_fromDB():
    select_query = """
        SELECT name, id, lat, lng FROM Venues
        WHERE lat IS NOT NULL AND lng IS NOT NULL
        AND tmid IS NULL
    """
    try:
        with PostgresClient(log=log) as db:
            rows = db.query(query=select_query, fetchall=True)
            venues = [ Venue(name=row[0], id=row[1], lat=row[2], lng=row[3]) for row in rows ]
            return venues
    except Exception as e:
        log(1, f"ERROR fetching venues from db returning None. {e}")
        return None

@timer_decorator
async def get_venue_coordinates(venues):
    try:
        client = GoogleClient(log=log)
        venues_to_update = []
        for venue in venues:
            params =[ f"input={urllib.parse.quote(venue.venue_address)}", 
                        "inputtype=textquery", "fields=geometry"
                    ]
            resp = await client.get('/place/findplacefromtext/json?', params)
            if resp.status_code != 200:
                log(1, f'failed to fetch coordinates for {venue}')
            data = resp.json()
            log(0, f"DATA: {data}")
            if len(data['candidates']) > 0:
                candidate = data['candidates'][0]
                location = candidate['geometry']['location']
                venues_to_update.append((venue.id, location['lat'], location['lng']))
                log(0, f"venue data scraped: {venues_to_update}")
        return venues_to_update
    except Exception as e:
        log(1, f"ERROR fetching venues coordinates from google api returning None. {e}")
        return None

@timer_decorator
async def get_ticketmaster_venueIDs(venues):
    try:
        client = TicketMasterClient(log=log)
        venues_to_update = []
        for venue in venues:
            # geo_hash = geohash.encode(venue.lat, venue.lng, precision=11)
            params =[ f"keyword={urllib.parse.quote(venue.name)}", 
                        "stateCode=WA", "size=1"
                    ]
            resp = await client.get('/venues.json?', params)
            if resp.status_code != 200:
                log(1, f'failed to fetch ticketmaster id for {venue.name}')
            data = resp.json()
            log(0, f"DATA: {data}")
            if data['page']['totalElements'] > 0:
                candidate = data['_embedded']['venues'][0]
                candidate_name = candidate['name']
                tmid = candidate['id']
                log(0, f'Saving {candidate_name} ID:{tmid}, for {venue.name}')
                venues_to_update.append((venue.id, tmid))
        log(0, f"venue data scraped: {venues_to_update}")
        return venues_to_update
    except Exception as e:
        log(1, f"ERROR fetching venues ticketmaster ids returning None. {e}")
        return None


@timer_decorator
def save_venues_inDB(venues):
    insert_query = """
        INSERT INTO Venues (id, lat, lng)
        VALUES %s
        ON CONFLICT (id)
        DO UPDATE SET
            lat = EXCLUDED.lat,
            lng = EXCLUDED.lng
    """
    try:
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=venues)
    except Exception as e:
        log(1, f"ERROR saving venues in db. {e}")

@timer_decorator
def save_venueIDs_inDB(venues):
    insert_query = """
        INSERT INTO Venues (id, tmid)
        VALUES %s
        ON CONFLICT (id)
        DO UPDATE SET
            tmid = EXCLUDED.tmid
    """
    try:
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=venues)
    except Exception as e:
        log(1, f"ERROR saving venues in db. {e}")

@timer_decorator
async def scrapeVenueCoordinates():
    try:
        venues = get_venues_fromDB()
        venues_to_update = await get_venue_coordinates(venues)
        save_venues_inDB(venues_to_update)
    except Exception as ex:
        log(1, f"PARENT ERROR: {ex}")

async def main():
    await scrapeVenueCoordinates()
    venues = get_venue_coordinates_fromDB()
    updated_venues = await get_ticketmaster_venueIDs(venues)
    if updated_venues is not None:
        save_venueIDs_inDB(updated_venues)

asyncio.run(main())