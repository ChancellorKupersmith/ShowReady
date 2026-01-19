import os
import re
import asyncio
import logging
from selenium import webdriver
from models import Event, Venue
from psycopg2.extras import Json
from pydantic import ValidationError
from datetime import datetime, timedelta
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from aggregatorUtils import Logger, timer_decorator, PostgresClient, HandleException


current_path = os.getcwd()
log_filename = os.path.join(current_path, 'scrapingLogs', datetime.now().strftime('aggregatorShowEO_%Y%m%d_%H%M%S.log'))
logger = Logger('aggregatorShowEO', log_file=log_filename)

@timer_decorator(logger)
def scrape_eo_events():
    @timer_decorator(logger)
    def scrape_event_page(browser, date_str):
        logger.info(f"Scraping events for date: {date_str}")
        scraped_events = {}
        scraped_venues = {}

        def blacklist_by_performance_names(performance) -> bool:
            blacklist = False
            blacklist = bool(re.search(r"\bkaraoke\b", performance.lower()))
            return blacklist

        def extract_event_data(event_html_el):
            performance = ''
            try:
                performance_el = event_html_el.find_element(By.CLASS_NAME, 'event-title')
                performance = performance_el.text if performance_el else ''
                if blacklist_by_performance_names(performance): return
                performance_url = ''
                if performance_el:
                    try:
                        url_el = performance_el.find_element(By.CSS_SELECTOR, 'a')
                        performance_url = url_el.get_attribute('href') if url_el else ''
                    except Exception as e:
                        HandleException(
                            logger=logger,
                            error_msg=f"Error extracting performance URL: {e}",
                            obj_type="event"
                        )
            except Exception as e:
                HandleException(
                    logger=logger,
                    error_msg=f"Error extracting event title, {e}",
                    obj_type="event"
                )
            ticket_price = ''
            try:
                ticket_el = event_html_el.find_element(By.CLASS_NAME, 'event-tags')
                ticket_price = ticket_el.text if ticket_el else ''
            except Exception as e:
                logger.warning(f"Error extracting ticket price: {e}")
            event_time = ''
            try:
                time_el = event_html_el.find_element(By.CLASS_NAME, 'event-time')
                event_time = time_el.text if time_el else ''
            except Exception as e:
                logger.warning(f"Error extracting event time: {e}")
            eo_img = ''
            try:
                img_el = event_html_el.find_element(By.CLASS_NAME, 'img-responsive')
                eo_img = img_el.get_attribute('src') if img_el else ''
            except Exception as e:
                HandleException(
                    logger=logger,
                    error_msg=f"Error extracting image: {e}",
                    obj_type="event"
                )            
            logger.info(f"Event Transformation: Name='{performance}', Url='{performance_url}', Price='{ticket_price}, EventDate='{date_str}', EventTime='{event_time}', EOImg='{eo_img}'")
            date_object = datetime.strptime(date_str, "%Y-%m-%d").date()
            external_event = {
                'Name': performance,
                'Url': performance_url,
                'Price': ticket_price,
                'EventDate': date_object,
                'EventTime': event_time,
                'EOImg': eo_img
            }
            try:
                validated_event = Event(**external_event)
                key = f"{performance.lower()}-{date_str}"
                scraped_events[key] = validated_event.dict(by_alias=True)
            except ValidationError as e: 
       Error fetching tm venues from Venues table returning empty         logger.error(e.errors())
            
        def extract_venue_data(event_html_el):
            venue = ''
            venue_eo_url = ''
            try:
                venue_el = event_html_el.find_element(By.CLASS_NAME, 'location-name')
                venue = venue_el.text if venue_el else ''
                try:
                    eo_url_el = venue_el.find_element(By.CSS_SELECTOR, 'a')
                    venue_eo_url = eo_url_el.get_attribute('href') if eo_url_el else ''
                except Exception as e:
                    HandleException(
                        logger=logger,
                        error_msg=f"Error extracting venue URL: {e}",
                        obj_type="venue"
                    )
            except Exception as e:
                HandleException(
                    logger=logger,
                    error_msg=f"Error extracting venue: {e}",
                    obj_type="venue"
                )
            hood = ''
            try:
                hood_el = event_html_el.find_element(By.CLASS_NAME, 'location-region')
                hood = hood_el.text if hood_el else ''
            except Exception as e:
                HandleException(
                    logger=logger,
                    error_msg=f"Error extracting hood: {e}",
                    obj_type="venue"
                )            
            logger.info(f"Venue Transformation: Name='{venue}', EOUrl='{venue_eo_url}', Hood='{hood}'")
            try: # Add venue name to event model for assigning foreign key venueid later in process
                performance_el = event_html_el.find_element(By.CLASS_NAME, 'event-title')
                performance = performance_el.text if performance_el else ''
                if blacklist_by_performance_names(performance): return
                key = f"{performance.lower()}-{date_str}"
                scraped_events[key]['Venue'] = venue
            except Exception as e:
                HandleException(
                    logger=logger,
                    error_msg=f"Error extracting event title for assignment of venue to event, {e}",
                    obj_type="event"
                )
            external_venue = {
                'Name': venue,
                'EOUrl': venue_eo_url,
                'Hood': hood
            }
            # Deduplicate venue data
            if venue.lower() in scraped_venues:
                logger.info(f"Skipping duplicate venue: {venue}")
            else:
                try:
                    validated_venue = Venue(**external_venue)
                    scraped_venues[venue.lower()] = validated_venue.dict(by_alias=True)
                except ValidationError as e:
                    logger.error(e.errors())

        def get_num_of_pages(driver, date) -> int:
            url = f"https://everout.com/seattle/events/?page=1&category=live-music&start-date={date}"
            logger.info(f"Requesting page count URL: {url}")
            driver.get(url)
            try:
                pagination_txt = driver.find_element(By.CLASS_NAME, 'pagination-description').text
                nums_from_txt = re.split(r'\D+', pagination_txt)
                total_pages = int(nums_from_txt[-1])
                logger.info(f"Found {total_pages} pages for date {date}")
                return total_pages
            except Exception as e:
                logger.warning(f"Unable to retrieve pagination info: {e}")
                return 1

        num_of_pages_to_scrape = get_num_of_pages(browser, date_str)
        logger.info(f"Total pages to scrape for {date_str}: {num_of_pages_to_scrape}")

        for page_num in range(1, num_of_pages_to_scrape + 1):
            logger.info(f"Scraping page {page_num}/{num_of_pages_to_scrape} for date {date_str}")
            try:
                url = f"https://everout.com/seattle/events/?page={page_num}&category=live-music&start-date={date_str}"
                logger.info(f"Requesting URL: {url}")
                browser.get(url)
                events = browser.find_elements(By.CLASS_NAME, 'event')
                for event in events:
                    extract_event_data(event)
                    extract_venue_data(event)
                    logger.info(f"Total events scraped so far: {len(scraped_events)}")
            except Exception as e:
                logger.error(f"ERROR: Failed to retrieve events from page {page_num}: {e}")
                continue

        return scraped_venues, scraped_events

    @timer_decorator(logger)
    def save_venues(venues_to_save):
        logger.info("Saving venues to database")
        insert_query = """
            INSERT INTO Venues (Name, EOUrl, Hood)
            VALUES %s
            ON CONFLICT (EOUrl) DO NOTHING
        """
        update_query = """
            INSERT INTO Venues (EOUrl, ID)
            VALUES (%s, %s)
            ON CONFLICT (ID) 
            DO UPDATE SET EOUrl = EXCLUDED.EOUrl
        """
        select_query = "SELECT Name, ID, EOUrl FROM Venues"
        try:
            with PostgresClient(logger=logger) as db:
                result = db.query(query=select_query, fetchall=True)
                existing_db_venues = {row[0].lower(): (row[1], row[2]) for row in result}
                new_venues = [(v['Name'], v['EOUrl'], v['Hood']) for v in venues_to_save if v['Name'].lower() not in existing_db_venues]
                logger.info(f"New venues to insert: {new_venues}")
                if new_venues:
                    try:
                        db.query(query=insert_query, data=new_venues)
                    except Exception as e:
                        HandleException(
                            logger=logger,
                            error_msg=f"Error inserting new venues: {e}",
                            obj_type="venue",
                            obj_json=Json({ 'attempt_row_insert': new_venues })
                        )
                # Update existing venues with missing eourls
                update_venues = [
                    (v['EOUrl'], existing_db_venues[v['Name'].lower()][0])
                    for v in venues_to_save
                    if v['Name'].lower() in existing_db_venues and existing_db_venues[v['Name'].lower()][1] is None
                ]
                logger.info(f"Venues to update: {update_venues}")
                if update_venues:
                    for venue in update_venues:
                        try:
                            db.query(query=update_query, params=venue)
                        except Exception as e:
                            HandleException(
                                logger=logger,
                                error_msg=f"Error updating venue: {e}",
                                obj_type="venue",
                                obj_json=Json({ 'attempt_row_insert': venue })
                            )
                rows = db.query(query=select_query, fetchall=True)
                venue_names_ids = {row[0].lower(): row[1] for row in rows}
                return venue_names_ids
        except Exception as e:
            logger.error(f"Error saving venues to db: {e}")
            return None

    @timer_decorator(logger)
    def save_events(events_to_save_data):
        logger.info("Saving events to database")
        insert_query = """
            INSERT INTO Events (Name, Url, Price, EventDate, EventTime, EOImg, VenueID)
            VALUES %s
            ON CONFLICT (Name, EventDate)
            DO UPDATE SET
                Url = EXCLUDED.Url,
                Price = EXCLUDED.Price,
                EventTime = EXCLUDED.EventTime,
                VenueID = EXCLUDED.VenueID,
                EOImg = EXCLUDED.EOImg
            RETURNING name, id
        """
        try:
            with PostgresClient(logger=logger) as db:
                event_tuples = [(e['Name'], e['Url'], e['Price'], e['EventDate'], e['EventTime'], e['EOImg'], e['VenueID']) for e in events_to_save_data]
                rows = db.query(query=insert_query, data=event_tuples, fetchall=True)
                logger.info(f"Events saved to DB: {rows}")
        except Exception as e:
            HandleException(
                logger=logger,
                error_msg=f"Error saving events to db: {e}",
                obj_type="event",
                obj_json=events_to_save_data
            )

    logger.info("Starting scrape_eo_events")
    options = Options()
    options.add_argument("--headless")
    browser = webdriver.Firefox(options=options)

    try:
        todays_date = datetime.today()
        total_days = 240
        logger.info(f"Starting aggregator for {total_days} days beginning {todays_date.strftime('%Y-%m-%d')}")
        for day_count in range(total_days):
            current_date_str = todays_date.strftime('%Y-%m-%d')
            logger.info(f"Processing date: {current_date_str} ({day_count+1}/{total_days})")
            venues, events = scrape_event_page(browser, current_date_str)
            db_venues = save_venues(venues.values())
            logger.info(f"Database venues mapping: {db_venues}")
            # Add venueids to events
            if db_venues is None:
                logger.warning(f'No venue ids returned from save_venues(), skipping saving events for {current_date_str}')
                continue
            events_with_venueid = []
            for e in events.values():
                event_venue = e['Venue']
                if event_venue is None:
                    logger.warning("No venue found for event:")
                    logger.warning(f"{e}")
                    continue
                venue_lower = e['Venue'].lower()
                if venue_lower in db_venues:
                    e['VenueID'] = db_venues[venue_lower]
                    events_with_venueid.append(e)
                else:
                    logger.error(f"Venue not found in DB for event: {e}")
            logger.info(f"Total events to save for {current_date_str}: {len(events_with_venueid)}")
            save_events(events_with_venueid)

            remaining_days = total_days - day_count - 1
            logger.info(f"Progress update: Completed {day_count+1} days, {remaining_days} days remaining")
            todays_date += timedelta(days=1)
    except Exception as e:
        logger.error(f"ERROR aggregating eo events: {e}")
    finally:
        browser.quit()
        logger.info("Browser closed")
    logger.info("Completed scraping all events")

async def main():
    scrape_eo_events()
    logger.info("Successfully aggregated events!")
    print(f"Completed event aggregator, logs available at: {log_filename}")

if __name__ == '__main__':
    asyncio.run(main())
