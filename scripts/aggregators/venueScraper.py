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
logger = Logger('venueScraper', log_file=log_filename)

@timer_decorator(logger)
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
        logger.error(f"ERROR fetching venues from db returning None. {e}")
        return None

@timer_decorator(logger)
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
        logger.error(f"ERROR fetching venues from db returning None. {e}")
        return None

@timer_decorator(logger)
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
                logger.error(f'failed to fetch coordinates for {venue}')
            data = resp.json()
            logger.info(f"DATA: {data}")
            if len(data['candidates']) > 0:
                candidate = data['candidates'][0]
                location = candidate['geometry']['location']
                venues_to_update.append((venue.id, location['lat'], location['lng']))
                logger.info(f"venue data scraped: {venues_to_update}")
        return venues_to_update
    except Exception as e:
        logger.error(f"ERROR fetching venues coordinates from google api returning None. {e}")
        return None

@timer_decorator(logger)
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
                logger.error(f'failed to fetch ticketmaster id for {venue.name}')
            data = resp.json()
            logger.info(f"DATA: {data}")
            if data['page']['totalElements'] > 0:
                candidate = data['_embedded']['venues'][0]
                candidate_name = candidate['name']
                tmid = candidate['id']
                logger.info(f'Saving {candidate_name} ID:{tmid}, for {venue.name}')
                venues_to_update.append((venue.id, tmid))
        logger.info(f"venue data scraped: {venues_to_update}")
        return venues_to_update
    except Exception as e:
        logger.error(f"ERROR fetching venues ticketmaster ids returning None. {e}")
        return None


@timer_decorator(logger)
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
        logger.error(f"ERROR saving venues in db. {e}")

@timer_decorator(logger)
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
        logger.error(f"ERROR saving venues in db. {e}")

@timer_decorator(logger)
async def scrapeVenueCoordinates():
    try:
        venues = get_venues_fromDB()
        if len(venues) == 0:
            logger.info("No new venues need addresses.")
            return
        venues_to_update = await get_venue_coordinates(venues)
        if len(venues_to_update)
        save_venues_inDB(venues_to_update)
    except Exception as ex:
        logger.error(f"PARENT ERROR: {ex}")

async def main():
    await scrapeVenueCoordinates()
    # TODO: Add tm consolidaation logic in show aggregator
    # venues = get_venue_coordinates_fromDB()
    # updated_venues = await get_ticketmaster_venueIDs(venues)
    # if updated_venues is not None:
    #     save_venueIDs_inDB(updated_venues)

asyncio.run(main())