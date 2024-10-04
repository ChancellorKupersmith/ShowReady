import os
import json
import asyncio
import logging
import datetime
from aggregatorUtils import *

current_path = os.getcwd()
log_filename = datetime.datetime.now().strftime('generateRadiogenPlaylists_%Y%m%d_%H%M%S.log')
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

    """
        - create playlists based on:
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

async def get_playlist_image(client, playlist):
    try:
        resp = await client.get(f"/playlists/{playlist.spotify_id}/images")
        if resp.status_code == 200:
            all_imgs = resp.json()
            log(0, f'Imgs: {all_imgs}')
            img_data = all_imgs[0]
            playlist.img = img_data.get('url')
            playlist.img_height = img_data.get('height')
            playlist.img_width = img_data.get('width')
            return playlist
        log(2, f"Failed to fetch spotify playlist: {playlist.name}'s image. Status code: {resp.status_code}, Response: {resp.text}")
        return None
    except Exception as e:
        log(1, f"Error fetching spotify playlist image, {e}")

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
        with PostgresClient(log=log) as db:
            db.query(query=insert_query, data=playlist_tuples)
    except Exception as e:
        log(1, f"Error saving spotify playlists in db: {e}")

async def main():
    print('Started radiogen playlists')
    client = SpotifyClient(log=log)
    await client.init_access_token()

    mockPs = [
        {
            'name': 'Seattle New Age Oct-2024',
            'spotifyexternalid': '1ny0FJw2KpwU3pVUglbX2H'
        },
        {
            'name': 'Seattle Singer-Songwriter Oct-2024',
            'spotifyexternalid': '2PGfOUWHohaKqo2DGPMxOt'
        },
        {
            'name': 'Seattle Classical/Vocal Oct-2024',
            'spotifyexternalid': '6Ldomo0OUj5J1vE0ieu0LX'
        },
        {
            'name': 'Seattle Americana Oct-2024',
            'spotifyexternalid': '10q6WeA8wzt3V58KIhYkWr'
        },
        {
            'name': 'Seattle Folk Oct-2024',
            'spotifyexternalid': '71j4jixj84ccQg8rawgpQF'
        },
        {
            'name': 'Seattle Punk Oct-2024',
            'spotifyexternalid': '4XkHGPKOueSTs0y4cPbhus'
        },
        {
            'name': 'Seattle Dance/Electronic Oct-2024',
            'spotifyexternalid': '1wEu9tJgrQyslhay5950G3'
        },
        {
            'name': 'Seattle Alternative Rock Oct-2024',
            'spotifyexternalid': '3oZU2ekgiPkUqZf3yVNlZj'
        },
        {
            'name': 'Seattle Indie Rock Oct-2024',
            'spotifyexternalid': '5w32nmTVwp83x9svuNfbS8'
        },
        {
            'name': 'This is Seattle Oct-2024',
            'spotifyexternalid': '5zQkAGDApz1YgmBG065qpe'
        },
        {
            'name': 'Seattle French Rap Oct-2024',
            'spotifyexternalid': '22JZno6BXETFY17NlrXp4a'
        },
        {
            'name': 'Seattle World Oct-2024',
            'spotifyexternalid': '4kwbd5OleUZvKzmiS7tsbP'
        },
        {
            'name': 'Seattle Hip-Hop/Rap Oct-2024',
            'spotifyexternalid': '5awQ6zlRXznfvyeg8lkYJP'
        },
        {
            'name': 'Seattle Other Oct-2024',
            'spotifyexternalid': '3hgGKHHRgsNzuztZpqAVvT'
        },
        {
            'name': 'Seattle Witchstep Oct-2024',
            'spotifyexternalid': '5GcPMi8Ec5miYs2XixUjCK'
        },
        {
            'name': 'Seattle Alternative Folk Oct-2024',
            'spotifyexternalid': '5d48BouZC08EutOZfOCPFj'
        },
        {
            'name': 'Seattle Indie Pop Oct-2024',
            'spotifyexternalid': '10tt4ZIQYwfkX8qs0dYRk9'
        }
    ]
    created_playlists = [ SpotifyPlaylist(name=p['name'], spotifyexternalid=p['spotifyexternalid']) for p in mockPs ]
    playlists_to_save = []
    for p in created_playlists:
        # add tracks to playlist
        # get playlist img after tracks uploaded (inorder to get auto gen img from spotify)
        playlists_to_save.append(await get_playlist_image(client, p))
    save_spotify_playlists_inDB(playlists_to_save)
    log(0, 'SUCCESSFULLY CREATED RADIOGEN PLAYLISTS!')
    print(f'Completed radiogen playlists, logs: {log_filename}')
asyncio.run(main())