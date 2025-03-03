import os
import re
import asyncio
import logging
from aggregatorUtils import *
from datetime import datetime, timedelta
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options

current_path = os.getcwd()
log_filename = datetime.now().strftime('aggregatorShowEO_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logger = Logger('aggregatorShow', log_file=log_filename)

@timer_decorator(logger)
def scrape_eo_events():
    @timer_decorator(logger)
    def scrape_event_page(browser, date_str):
        def get_num_of_pages(driver, date) -> int:
            url = f"https://everout.com/seattle/events/?page=1&category=live-music&start-date={date}"
            driver.get(url)
            try:
                pagination_txt = driver.find_element(By.CLASS_NAME, 'pagination-description').text
                nums_from_txt = re.split(r'\D+', pagination_txt)
                logger.info(f"Number of pages to scrape: {int(nums_from_txt[-1])}")
                return int(nums_from_txt[-1])
            except Exception as e:
                logger.info( 'Unable to find paging element')
                return 1
        
        scraped_events = {}
        scraped_venues = {}

        date = datetime.strptime(date_str, '%Y-%m-%d')
        num_of_pages_to_scrape = get_num_of_pages(browser, date_str)
        for page_num in range(1, num_of_pages_to_scrape + 1):
            events = []
            performance, performance_url, venue, venue_url, venue_eo_url, ticket_price, event_time, hood, eo_img = '', '', '', '', '', '', '', '', ''
            try:
                url = f"https://everout.com/seattle/events/?page={page_num}&category=live-music&start-date={date_str}"
                browser.get(url)
                events = browser.find_elements(By.CLASS_NAME, 'event')
            except Exception as e:
                logger.error( f"ERROR: Failed to scrape events from page: {page_num}, msg: {e}")
                
            for event in events:
                try:
                    performance_el = event.find_element(By.CLASS_NAME, 'event-title')
                    if performance_el is not None:
                        performance = performance_el.text
                        url_el = performance_el.find_element(By.CSS_SELECTOR, 'a')
                        if url_el is not None:
                            performance_url = url_el.get_attribute('href')
                        le = event.find_element(By.CLASS_NAME, 'location-name')
                        if le is not None:
                            venue = le.text
                            eo_url_el = le.find_element(By.CSS_SELECTOR, 'a')
                            if eo_url_el is not None:
                                venue_eo_url = eo_url_el.get_attribute('href')
                    ticket_el = event.find_element(By.CLASS_NAME, 'event-tags')
                    if ticket_el is not None:
                        ticket_price = ticket_el.text
                    time_el = event.find_element(By.CLASS_NAME, 'event-time')
                    if time_el is not None:
                        event_time = time_el.text
                    hood_el = event.find_element(By.CLASS_NAME, 'location-region')
                    if hood_el is not None:
                        hood = hood_el.text
                    img_el = event.find_element(By.CLASS_NAME, 'img-responsive')
                    if img_el is not None:
                        eo_img = img_el.get_attribute('src')
                    logger.info(f'''Event(
                        - performance: {performance}
                        - performance url: {performance_url}
                        - venue: {venue}
                        - venue url {venue_eo_url}
                        - ticket price: {ticket_price}
                        - date: {date}
                        - time: {event_time}
                        - hood: {hood}
                        - eo img: {eo_img}
                    )''')
                except Exception as e:
                    logger.error( f"ERROR: Failed to Scrape Event, {e}")
                finally:
                    if venue in scraped_venues:
                        logger.info( f'Skipping venue already added venue: {venue}')
                    else:
                        scraped_venues[venue.lower()] = Venue(name=venue, eo_url=venue_eo_url, hood=hood)
                    scraped_events[f'{performance.lower()}-{date}'] = (performance, performance_url, ticket_price, date, event_time, venue, eo_img)
                logger.info( f"events to store count: {len(scraped_events)}")
        return (scraped_venues, scraped_events)

    @timer_decorator(logger)
    def save_venues(venues_to_save):
        insert_query = """
            INSERT INTO Venues (Name, EOUrl, Hood)
            VALUES %s
            ON CONFLICT (EOUrl) DO NOTHING
        """
        update_query = """
            INSERT INTO Venues (EOUrl, ID)
            VALUES %s
            ON CONFLICT (ID) 
            DO UPDATE SET 
                EOUrl = EXCLUDED.EOUrl
        """
        select_query = "SELECT Name, ID, EOUrl FROM Venues"
        try:
            with PostgresClient(log=log) as db:
                result = db.query(query=select_query, fetchall=True)
                existing_db_venues = {row[0]: (row[1], row[2]) for row in result}
                logger.info( f"existing_db_venues: {existing_db_venues.values()}")
                new_venues = [(v.name, v.eo_url, v.hood) for v in venues_to_save if existing_db_venues.get(v.name) is None]
                if len(new_venues) > 0:
                    try:
                        db.query(query=insert_query, data=new_venues)
                    except Exception as e:
                        logger.error( f"Error inserting new venues in db returning None, {e}")
                # filter found venues for update query, should exist in db but not have eourl
                update_venues = [(v.eo_url, existing_db_venues.get(v.name)[0]) for v in venues_to_save if existing_db_venues.get(v.name) is not None and existing_db_venues.get(v.name)[1] is None]
                logger.info( f"update_venues: {update_venues}")
                if len(update_query) > 0:
                    for venue in update_venues:
                        try:
                            db.query(query=update_query, params=venue)
                        except Exception as e:
                            logger.error( f"Error updating venues in db returning None, {e}")
                # select all venue ids instead of returning only newly insert
                rows = db.query(query=select_query, fetchall=True)
                venue_names_ids = {row[0].lower(): row[1] for row in rows}
                return venue_names_ids
        except Exception as e:
            logger.error( f"Error saving venues in db returning None, {e}")
            return None

    @timer_decorator(logger)
    def save_events(events_to_save_data):
        insert_query = """
            INSERT INTO Events (name, url, price, eventdate, eventtime, eoimg, venueid)
            VALUES %s
            ON CONFLICT (name, eventdate)
            DO UPDATE SET
                url = EXCLUDED.url,
                price = EXCLUDED.price,
                eventtime = EXCLUDED.eventtime,
                venueid = EXCLUDED.venueid,
                eoimg = EXCLUDED.eoimg
            RETURNING name, id
        """
        try:
            with PostgresClient(log=log) as db:
                # logger.info( f'SAVING EVENTS: {events_with_venue_id}')
                rows = db.query(query=insert_query, data=events_to_save_data, fetchall=True)
                logger.info( f'SAVED EVENTS: {rows}')
        except Exception as e:
            logger.error( f"Error saving events in db, {e}")

    # Execute
    options = Options()
    options.add_argument("--headless")
    browser = webdriver.Firefox(options=options)
    try:
        # TODO: MAKE process dynamic to date changes, default 6 month batch updates
        todays_date = datetime.today()
        for _ in range(240):
            events_to_save = {}
            venues_to_save = {}
            today = todays_date.strftime('%Y-%m-%d')
            venues, events = scrape_event_page(browser, today)
            venues_to_save.update(venues)
            events_to_save.update(events)
            todays_date += timedelta(days=1)
            db_venues = save_venues(venues_to_save.values())
            logger.info( f'db_venues: {db_venues}')
            if db_venues is not None:
                events_with_venue_id = [
                    e[0:6] + (db_venues[e[5].lower()],)
                    for e in events_to_save.values()
                ]
                save_events(events_with_venue_id)
    except Exception as e:
        logger.error( f"ERROR aggregating eo events. {e}")
    finally:
        browser.quit()

async def main():
    scrape_eo_events()
    logger.info( 'SUCCESSFULL EVENTS AGGREGATION!')
    print(f'Completed event aggregator, logs: {log_filename}')
asyncio.run(main())