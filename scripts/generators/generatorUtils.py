import os
import json
import time
import httpx
import base64
import asyncio
import logging
import psycopg2
import functools
import psycopg2.pool
from pprint import pformat
from dotenv import load_dotenv
from psycopg2.extras import execute_values
from logging.handlers import RotatingFileHandler

load_dotenv()

def timer_decorator(func):
    if asyncio.iscoroutinefunction(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            end_time = time.time()
            print(f"{func.__name__} took {end_time - start_time:.4f} seconds")
            return result
    else:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            result = func(*args, **kwargs)
            end_time = time.time()
            print(f"{func.__name__} took {end_time - start_time:.4f} seconds")
            return result
    return wrapper

class Logger:
    def __init__(self, name=None, log_file=None, lvl=logging.DEBUG):
        self.log_file = log_file
        self.logger = logging.getLogger(name)
        self.logger.setLevel(lvl)

        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        for handler in self.logger.handlers:
            handler.setFormatter(formatter)
        
        console_handler = logging.StreamHandler()
        console_handler.setLevel(lvl)
        self.logger.addHandler(console_handler)

        if log_file:
            file_handler = RotatingFileHandler(log_file, maxBytes=1000000, backupCount=1)
            file_handler.setLevel(lvl)
            self.logger.addHandler(file_handler)

    def debug(self, message):
        self.logger.debug(message)

    def info(self, message):
        self.logger.info(message)

    def warning(self, message):
        self.logger.warning(message)

    def error(self, message):
        self.logger.error(message)

    def critical(self, message):
        self.logger.critical(message)

    def log(lvl, msg):
        if lvl == 0: logging.info(msg=msg)
        elif lvl == 1: logging.error(msg=msg)
        else: logging.warning(msg=msg)

db_config = {
    'dbname': os.getenv("PG_DB_NAME"),
    'host': os.getenv("PG_HOST"),
    'user': os.getenv("PG_USER"),
    'password': os.getenv("PG_PASSWORD")
}
pg_pool = psycopg2.pool.SimpleConnectionPool(minconn=1, maxconn=10, **db_config)
def closeConnectionPool():
    pg_pool.closeall()

class PostgresClient:
    def __init__(self, log=None):
        self.connection = None
        self.cursor = None
        self.log=log
    
    def __enter__(self):
        self.connection = pg_pool.getconn()
        self.cursor = self.connection.cursor()
        return self
    
    def __exit__(self, exc_type, exc_value, traceback):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            pg_pool.putconn(self.connection)
    
    def query(self, query, executemany=None, data=None, params=None, fetchall=False, fetchone=False):
        try:
            if executemany:
                self.cursor.executemany(query, data)
                self.connection.commit()
            elif data:
                execute_values(self.cursor, query, data)
                self.connection.commit()
            elif params:
                self.cursor.execute(query, (params,))
                self.connection.commit()
            else:
                self.cursor.execute(query)
                self.connection.commit()
            if fetchall:
                return self.cursor.fetchall()
            if fetchone:
                return self.cursor.fetchone()
        except Exception as e:
            if self.connection:
                self.connection.rollback()
            self.logger.error(f"Database error: {e}")
            raise


class GoogleClient:
    def __init__(self, log=None, rate_limit=0.006):
        self.last_req_time = None
        self.base_url = "https://maps.googleapis.com/maps/api"
        self.apikey = os.getenv("GOOGLE_MAPS_API_KEY")
        self.logger = log
        self.rate_limit = rate_limit
    
    async def get(self, endpoint, params, max_retries=3):
        url_req = self.base_url + endpoint
        for p in params:
            url_req += f"{p}&"
        url = url_req + f"key={self.apikey}"
        for attempt in range(max_retries):
            try:
                if self.last_req_time is not None:
                    elapsed = time.time() - self.last_req_time
                    if elapsed < self.rate_limit:
                        time.sleep(self.rate_limit - elapsed)
                async with httpx.AsyncClient() as client:
                    self.logger.info(f"Google API Request: {url}")
                    response = await client.get(url)
                    self.last_req_time = time.time()
                    if response.status_code == 200:
                        return response
            except Exception as e:
                self.logger.error(f"ERROR: Failed to send google api request: {e}")
                # wifi will randomly drop, tcp connection timeout issues, wait for reconnection
                time.sleep(300)
        raise Exception(f"RETRIES EXCEEDED > {max_retries}")

class TicketMasterClient:
    def __init__(self, log=None, rate_limit=0.3):
        self.last_req_time = None
        self.base_url = "https://app.ticketmaster.com/discovery/v2"
        self.apikey = os.getenv("TICKET_MASTER_API_KEY")
        self.logger = log
        self.rate_limit = rate_limit
    
    async def get(self, endpoint, params, max_retries=3):
        url_req = self.base_url + endpoint
        for p in params:
            url_req += f"{p}&"
        url = url_req + f"apikey={self.apikey}"
        for attempt in range(max_retries):
            try:
                if self.last_req_time is not None:
                    elapsed = time.time() - self.last_req_time
                    if elapsed < self.rate_limit:
                        time.sleep(self.rate_limit - elapsed)
                async with httpx.AsyncClient() as client:
                    self.logger.info(f"TicketMaster Request: {url}")
                    response = await client.get(url)
                    self.last_req_time = time.time()
                    if response.status_code == 200:
                        return response
                    # Handle rate limiting
                    if response.status_code == 429:
                        retry_after = response.headers.get("Rate-Limit-Reset")
                        if retry_after:
                            self.logger.error(f"Rate limit exceeded. Retry after {retry_after}")
                            raise Exception("RATE LIMIT EXCEEDED")
            except Exception as e:
                self.logger.error(f"ERROR: Failed to send ticketmaster request: {e}")
                # wifi will randomly drop, tcp connection timeout issues, wait for reconnection
                time.sleep(120)
        raise Exception(f"RETRIES EXCEEDED > {max_retries}")

class LastFmClient:
    def __init__(self, log=None):
        self.last_req_time = None
        self.base_url = "http://ws.audioscrobbler.com/2.0/"
        self.api_resp_format = "&format=json"
        self.apikey = os.getenv("LASTFM_API_KEY")
        self.logger = log

    async def get(self, endpoint, params, max_retries=3):
        url_req = self.base_url + "?method=" + endpoint
        for p in params:
            url_req += f"&{p}"
        url_req += f"&{self.api_resp_format}&api_key={self.apikey}"
        self.logger.info(f"LastFM Request: {url_req}")
        for attempt in range(max_retries):
            try:
                if self.last_req_time is not None:
                    elapsed = time.time() - self.last_req_time
                    if elapsed < 1:
                        time.sleep(1 - elapsed)
                async with httpx.AsyncClient() as client:
                    response = await client.get(url_req)
                    self.last_req_time = time.time()
                    if response.status_code == 200:
                        return response
                    # Handle rate limiter
                    if response.status_code == 429:
                        self.logger.warning(f"Rate limit exceeded, headers: {pformat(dict(response.headers))}")
                        retry_after = response.headers.get("retry-after")
                        if retry_after:
                            wait_time = int(retry_after) / 1000
                            self.logger.warning(f"Rate limit exceeded. Retrying after {wait_time} secs...")
                            await asyncio.sleep(wait_time)
                        else:
                            self.logger.error(f"Rate limit exceeded. but retry-after header not found.")
                            raise Exception("RATE LIMIT EXCEEDED")
            except Exception as e:
                self.logger.error(f"ERROR: Failed to send lastfm request: {e}")
                # wifi will randomly drop, tcp connection timeout issues, wait for reconnection
                time.sleep(120)
        raise Exception(f"RETRIES EXCEEDED > {max_retries}")

class SpotifyClient:
    def __init__(self, log=None):
        self.last_req_time = None
        self.access_token = None
        self.base_url = "https://api.spotify.com/v1"
        self.logger = log

    async def init_access_token(self):
        spotify_client_id = os.getenv("SPOTIFY_CLIENT_ID")
        spotify_client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
        url_req = 'https://accounts.spotify.com/api/token'
        payload = { 'grant_type': 'client_credentials' }
        credentials = f'{spotify_client_id}:{spotify_client_secret}'
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {encoded_credentials}'
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(url_req, data=payload, headers=headers)
        if response.status_code == 200:
            self.access_token = response.json()['access_token']
        else:
            self.logger.error(f'Error fetching access token, Status code {response.status_code}: {response.text}')

    async def get(self, endpoint, params=None, max_retries=3):
        url = self.base_url + endpoint
        if params is not None:
            for p in params:
                url += f"{p}&"
            url = url.rstrip("&")
        for attempt in range(max_retries):
            try:
                # reassign access token each time inorder to keep update with each retry
                headers = { 'Authorization': f'Bearer {self.access_token}' }
                if self.last_req_time is not None:
                    elapsed = time.time() - self.last_req_time
                    if elapsed < 3:
                        time.sleep(3 - elapsed)
                async with httpx.AsyncClient() as client:
                    self.logger.info(f"Spotify Request: {url}")
                    response = await client.get(url, headers=headers)
                    self.last_req_time = time.time()
                    if response.status_code == 200:
                        return response
                    # Handle rate limiting
                    if response.status_code == 429:
                        retry_after = response.headers.get("retry-after")
                        if retry_after:
                            wait_time = int(retry_after)
                            self.logger.warning(f"Rate limit exceeded. Retrying after {wait_time} secs...")
                            await asyncio.sleep(wait_time)
                        else:
                            self.logger.error(f"Rate limit exceeded. but retry-after header not found.")
                            raise Exception("RATE LIMIT EXCEEDED")
                    # Handle expired access token
                    elif response.status_code == 401:
                        await self.init_access_token()
            except Exception as e:
                self.logger.error(f"ERROR: Failed to send spotify request: {e}")
                # wifi will randomly drop, tcp connection timeout issues, wait for reconnection
                time.sleep(120)
        raise Exception(f"RETRIES EXCEEDED > {max_retries}")

class Artist:
    def __init__(self, id=None, name=None, lastfm_url=None, spotify_id=None, spotify_popular=None, dictionary=None, tmid=None, website=None, mbid=None):
        if dictionary is None:
            self.id = id
            self.name = name
            self.lastfm_url = lastfm_url
            self.spotify_id = spotify_id
            self.spotify_popular = spotify_popular
            self.tmid = tmid
            self.website = website
            self.mbid = mbid
        else:
            for key, value in dictionary.items():
                setattr(self, key, value)
    
    def asdict(self):
        return {
            'name': self.name,
            'lastfm_url': self.lastfm_url,
            'spotify_id': self.spotify_id,
            'spotify_popular': self.spotify_popular,
        }

    # !!! ORDER OF VALUES IN TUPLE MUST MATCH PSQL QUERY ORDER IN aggregatorArtist.save_artists_to_db() !!!
    def to_tuple(self):
        return (self.name, self.spotify_id, self.spotify_popular, self.lastfm_url)

class Album:
    def __init__(self, id=None, title=None, spotifyexternalid=None, spotifypopularity=None, lastfmurl=None, artistid=None, genres=None):
        self.id = id
        self.title = title
        self.spotify_id = spotifyexternalid
        self.spotify_popular = spotifypopularity
        self.lastfm_url = lastfmurl
        self.artist_id = artistid
        self.genres = genres

    # !!! ORDER OF VALUES IN TUPLE MUST MATCH PSQL QUERY ORDER IN aggregatorAlbum.save_albums_to_db() !!!
    def to_tuple(self):
        return (self.title, self.spotify_id, self.lastfm_url, self.artist_id)

class Song:
    def __init__(self, title=None, artistid=None, albumid=None, albumtracknum=None, spotifyexternalid=None, spotifypopularity=None, spotifypreviewurl=None, lastfmurl=None, yturl=None, mbid=None, id=None):
        self.title = title
        self.artist_id = artistid
        self.album_id = albumid
        self.track_num = albumtracknum
        self.spotify_id = spotifyexternalid
        self.spotify_popular = spotifypopularity
        self.spotify_preview_url = spotifypreviewurl
        self.lastfm_url = lastfmurl
        self.yt_url = yturl
        self.mbid = mbid
        self.id = id

    def __hash__(self):
        return hash((self.title, self.artist_id))
        
    def __eq__(self, other):
        return (self.title, self.artist_id) == (other.title, other.artist_id)

    def to_tuple(self):
        # !!! ORDER OF VALUES IN TUPLE MUST MATCH PSQL QUERY ORDER IN aggregatorSong.save_songs_to_db() !!!
        return (self.title, self.artist_id, self.album_id, self.track_num, self.spotify_id, self.spotify_preview_url)

class Event:
    def __init__(self, id=None, name=None, url=None, eventdate=None, eventtime=None, summary=None, agerestrictions=None, venueid=None, tmid=None, price=None):
        self.id = id
        self.name = name
        self.url = url
        self.date = eventdate
        self.time = eventtime
        self.summary = summary
        self.age_restrictions = agerestrictions
        self.venue_id = venueid
        self.tmid = tmid
        self.price = price

class Venue:
    def __init__(self, id=None, name=None, venueurl=None, venueaddress=None, hood=None, summary=None, eourl=None, phone=None, lat=None, lng=None, tmid=None):
        self.id = id
        self.name = name
        self.venue_url = venueurl
        self.venue_address = venueaddress
        self.hood= hood
        self.summary = summary
        self.eourl = eourl
        self.phone = phone
        self.lat = lat
        self.lng = lng
        self.tmid = tmid

class Genre:
    def __init__(self, id=None, name=None, artistid=None, albumid=None, eventid=None, eventdate=None, venueid=None):
        self.id = id
        self.name = name
        self.artist_id = artistid
        self.album_id = albumid
        self.event_id = eventid
        self.event_date = eventdate
        self.venue_id = venueid

class SpotifyPlaylist:
    def __init__(self, id=None, name=None, spotifyexternalid=None, spotifypopularity=None, img=None, imgheight=None, imgwidth=None):
        self.id = id
        self.name = name
        self.spotify_id = spotifyexternalid
        self.spotify_popular = spotifypopularity
        self.img = img
        self.img_height = imgheight
        self.img_width = imgwidth