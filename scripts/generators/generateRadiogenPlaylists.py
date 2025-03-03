import os
import re
import json
import asyncio
import spotipy
import datetime
from spotipy import SpotifyOAuth
from generatorUtils import *
from dotenv import load_dotenv

load_dotenv()
""" create playlists based on:
        for each genre and this is seattle (all genres) randomly select for:
            - Week
                - this week
                - next week
            - Month
                - this month
                - next month
            - Year
                - this year
                - next year
        Custom playlists
        - Hipster
            - genres: (indie*, alt*, any genre that fits)
            - least popular
        - Degen
            - genres: (*dubstep*, *punk*, any genre that fits)
            - most popular
    - get img source
    - save playlist
"""
current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('generateRadiogenPlaylists_%Y%m%d_%H%M%S.log')
log_filename = str(current_path) + '/scrapingLogs/' + log_filename
logger = Logger('generateRadiogenPlaylists', log_file=log_filename)

@timer_decorator
def get_date_ranges():
    def format_date(date):
        return date.strftime("%Y-%m-%d")
    today = datetime.date.today()
    start_of_week = today - datetime.timedelta(days=today.weekday())
    start_of_next_week = start_of_week + datetime.timedelta(days=7)
    start_of_month = today.replace(day=1)
    start_of_year = today.replace(month=1, day=1)
    start_of_next_month = start_of_month.replace(month=start_of_month.month + 1) if start_of_month.month < 12 else start_of_year.replace(year=start_of_year.year + 1)
    end_of_next_month = start_of_next_month.replace(month=start_of_next_month.month + 1) if start_of_next_month.month < 12 else start_of_year.replace(year=start_of_year.year + 1)
    date_ranges = {
        # 'Today': (format_date(today), format_date(today)),
        'This Week': (format_date(start_of_week), format_date(start_of_next_week)),
        'Next Week': (format_date(start_of_next_week), format_date(start_of_next_week + datetime.timedelta(days=7))),
        'This Month': (format_date(start_of_month), format_date(start_of_next_month)),
        'Next Month': (format_date(start_of_next_month), format_date(end_of_next_month)),
        'This Year': (format_date(start_of_year), format_date(start_of_year.replace(year=start_of_year.year + 1))),
        'Next Year': (format_date(start_of_year.replace(year=start_of_year.year + 1)), format_date(start_of_year.replace(year=start_of_year.year + 2)))
    }
    return date_ranges

@timer_decorator
async def get_existing_playlists_fromDB(period):
    select_query_playlists = f"""
        SELECT ID, Name, SpotifyExternalID
        FROM SpotifyPlaylists
        WHERE Name Like '%{period}'
        ;
    """
    playlists = {}
    try:
        with PostgresClient(log=logger) as db:
            rows = db.query(query=select_query_playlists, fetchall=True)
            playlists = { row[1]: SpotifyPlaylist(id=row[0], name=row[1], spotifyexternalid=row[2]) for row in rows }
    except Exception as e:
        logger.error(f"Error fetching existing playlists from db returning empty array, {e}")
    finally:
        return playlists

@timer_decorator
async def get_mode_genres_fromDB(min_date, max_date):
    select_query_genres = f"""
        SELECT DISTINCT g.name FROM Genres g
        JOIN ArtistsGenres AS ag ON g.ID = ag.GenreID
        JOIN EventsArtists AS ea ON ag.ArtistID = ea.ArtistID
        WHERE ea.EventDate BETWEEN '{min_date}' AND '{max_date}'
    """
    genres = []
    try:
        with PostgresClient(log=logger) as db:
            rows = db.query(query=select_query_genres, fetchall=True)
            genres = [ Genre(name=row[0]) for row in rows ]
            logger.info(f'Genres: {genres}')
    except Exception as e:
        logger.error(f"Error fetching genres for events between {min_date} and {max_date} from db returning empty array, {e}")
    finally:
        return genres

@timer_decorator
async def get_genre_playlist_tracklist(min_date, max_date, genre_name, songs_per_artist):
    logger.info(f'SELECTING SONGS FOR GENRE: {genre_name}')
    SPOTIFY_PLAYLIST_SIZE_LIMIT = 10000
    select_query_songs = f"""
        WITH FromEachRankedSongs AS (
            SELECT 
                DISTINCT (s.SpotifyExternalId),
                -- random order to change tracklist on each update
                ROW_NUMBER() OVER (PARTITION BY s.ArtistID ORDER BY RANDOM()) AS rn_artist
            FROM Genres g
            JOIN ArtistsGenres AS ag ON g.ID = ag.GenreID
            -- joining on EventsArtists to ensure artists have been found
            JOIN EventsArtists AS ea ON ag.ArtistID = ea.ArtistID
            JOIN Songs AS s ON ag.ArtistID = s.ArtistID
            WHERE 
                ea.EventDate BETWEEN '{min_date}' AND '{max_date}'
                AND g.name = '{genre_name}'
                AND s.SpotifyExternalId IS NOT NULL
            LIMIT {SPOTIFY_PLAYLIST_SIZE_LIMIT}
        )
        SELECT SpotifyExternalId FROM FromEachRankedSongs WHERE rn_artist <= {songs_per_artist}
    """
    logger.info(f'TRACKLIST QUERY: {select_query_songs}')
    tracklist = []
    try:
        with PostgresClient(log=logger) as db:
            rows = db.query(query=select_query_songs, fetchall=True)
            tracklist = [ row[0] for row in rows ]
    except Exception as e:
        logger.error(f'Error fetching tracklist uris for playlist {genre_name} between {min_date} and {max_date}, {e}')
    finally:
        return tracklist

@timer_decorator
async def get_tis_playlist_tracklist(min_date, max_date):
    select_query_songs = f"""
        SELECT DISTINCT s.SpotifyExternalId FROM Artists a
        -- joining on EventsArtists to ensure artists have been found
        JOIN EventsArtists AS ea ON a.ID = ea.ArtistID
        JOIN Songs AS s ON a.ID = s.ArtistID
        WHERE 
            ea.EventDate BETWEEN '{min_date}' AND '{max_date}'
        -- random order to change tracklist on each update
        LIMIT 10000
    """
    tracklist = []
    try:
        with PostgresClient(log=logger) as db:
            rows = db.query(query=select_query_genres, fetchall=True)
            tracklist = [ row[0] for row in rows ]
    except Exception as e:
        logger.error(f'Error fetching tracklist uris for playlist \'This is Seattle\' between {min_date} and {max_date}, {e}')
    finally:
        return tracklist

@timer_decorator
async def get_playlist_image(client, playlist):
    try:
        resp = await client.get(f"/playlists/{playlist.spotify_id}/images")
        if resp.status_code == 200:
            all_imgs = resp.json()
            logger.info(f'Imgs: {all_imgs}')
            if len(all_imgs) > 0:
                img_data = all_imgs[0]
                playlist.img = img_data.get('url')
                playlist.img_height = img_data.get('height')
                playlist.img_width = img_data.get('width')
            return playlist
        logger.warning(f"Failed to fetch spotify playlist: {playlist.name}'s image. Status code: {resp.status_code}, Response: {resp.text}")
        return None
    except Exception as e:
        logger.error(f"Error fetching spotify playlist image, {e}")

@timer_decorator
def save_spotify_playlists_inDB(playlists_to_save):
    insert_query = """
        INSERT INTO SpotifyPlaylists (Name, SpotifyExternalId, Img, ImgHeight, ImgWidth)
        VALUES %s
        ON CONFLICT (SpotifyExternalId)
        DO UPDATE SET
            name = EXCLUDED.name,
            Img = EXCLUDED.Img,
            ImgHeight = EXCLUDED.ImgHeight,
            ImgWidth = EXCLUDED.ImgWidth
    """
    try:
        playlist_tuples = [ (p.name, p.spotify_id, p.img, p.img_height, p.img_width) for p in playlists_to_save ]
        with PostgresClient(log=logger) as db:
            db.query(query=insert_query, data=playlist_tuples)
            logger.info(f'Saved playlist { playlists_to_save[0].name }')
    except Exception as e:
        logger.error(f"Error saving spotify playlists in db: {e}")

def extract_genre(playlist_name):
    match = re.search(r'Seattle\s+(.*?)\s+(This|Next)', playlist_name)
    if match:
        return match.group(1)
    return None

async def main():
    print('Started radiogen playlists')
    client = SpotifyClient(log=logger)
    client.init_access_token()
    spotipy_client = spotipy.Spotify(auth_manager=SpotifyOAuth(
        client_id=os.getenv('SPOTIFY_CLIENT_ID'),
        client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
        redirect_uri=os.getenv('SPOTIFY_REDIRECT_URI'),
        scope='playlist-modify-public playlist-modify-private'
    ))

    # Get most frequent genres for given timelines
    date_ranges = get_date_ranges()
    for period in date_ranges.keys():
        logger.info(f'Creating playlists for {period}')
        min_date, max_date = date_ranges[period]
        existing_playlists = await get_existing_playlists_fromDB(period)
        # update genre playlists
        genres = await get_mode_genres_fromDB(min_date, max_date)
        new_playlist_genres = list(filter(lambda g: f'Seattle {g.name} {period}' not in existing_playlists, genres))
        radiogen_spotify_id = os.getenv('RADIOGEN_ID')
        # create new playlists
        for g in new_playlist_genres:
            playlist_name = f'Seattle {g.name} {period}'
            try:
                response = spotipy_client.user_playlist_create(
                    user=radiogen_spotify_id,
                    name=playlist_name,
                    description=f'Upcoming {g.name} artists performing in Seattle {period}'
                )
                # Add created playlist to existing list for adding tracklist later
                existing_playlists[playlist_name] = SpotifyPlaylist(
                    name=playlist_name,
                    spotifyexternalid=response['id'],
                )
            except Exception as e:
                logger.error(f'Error creating {playlist_name} playlist, {e}')
        # for each playlist update tracklist
        for playlist in existing_playlists.values():
            try:
                genre_name = extract_genre(playlist.name)
                if genre_name is None:
                    continue # skip playlist that isn't genre specific or if
                # TODO: dynamically set songs per artist based on Spotify playlist size limit and number of artists included in genre to maximize tracklist size and ensure every relevant artist is included.
                songs_per_artist = 20
                tracklist = await get_genre_playlist_tracklist(min_date, max_date, genre_name, songs_per_artist)
                #  clear current playlist
                spotipy_client.playlist_replace_items(playlist.spotify_id, [])
                if len(tracklist) > 0:
                    # add tracklist to playlist in max 100 song batches (https://developer.spotify.com/documentation/web-api/reference/add-tracks-to-playlist)
                    for i in range(0, len(tracklist), 100):
                        chunk = tracklist[i:i + 100]
                        spotipy_client.playlist_add_items(playlist.spotify_id, chunk)
                        logger.info(f'Adding to {playlist.name}: {chunk}')
                else:
                    logger.warning(f'FAILED TO FIND TRACKLIST FOR {playlist.name}')
                """
                    update playlist cover images
                    save playlist
                """
                playlist_to_save = await get_playlist_image(client, playlist)

                save_spotify_playlists_inDB([ playlist_to_save ])
            except Exception as e:
                logger.error(f'Failed to update and save tracklist for {playlist.name}, {e}')
        # update this is seattle playlist
    #     playlist_name = f'This is Seattle {period}'
    #     playlist = existing_playlists.get(playlist_name)
    #     if playlist is None:
    #         try:
    #             response = spotipy_client.user_playlist_create(
    #                 user=radiogen_spotify_id,
    #                 name=playlist_name,
    #                 description=f'Upcoming artists performing in Seattle {period}'
    #             )
    #             # Add created playlist to existing list for adding tracklist later
    #             playlist = SpotifyPlaylist(
    #                 name=playlist_name,
    #                 spotifyexternalid=response['id'],
    #             )
    #         except Exception as e:
    #             logger.error(f'Error creating {playlist_name} playlist, {e}')
    #     tracklist = await get_tis_playlist_tracklist(min_date, max_date)
    #     spotipy_client.playlist_replace_items(playlist.spotify_id, tracklist)
        
        

    # created_playlists = [ SpotifyPlaylist(name=p['name'], spotifyexternalid=p['spotifyexternalid']) for p in mockPs ]
    # playlists_to_save = []
    # for p in created_playlists:
    #     # clear existing tracklists
    #     # add tracks to playlist
    #     # get playlist img after tracks uploaded (inorder to get auto gen img from spotify)
    #     playlists_to_save.append(await get_playlist_image(client, p))
    # save_spotify_playlists_inDB(playlists_to_save)
    logger.info('SUCCESSFULLY CREATED RADIOGEN PLAYLISTS!')
    print(f'Completed radiogen playlists, logs: {log_filename}')
asyncio.run(main())