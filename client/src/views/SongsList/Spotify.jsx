import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useSave2Client } from './SongsListView';
import { useBgColor } from './SongsListView';
import { useSongsFilter } from '../Filter/FilterContext';
/*
    when clicked if not already selected
    if not logged in
        - calls server /login
        - assigns state
    after logged in
        - changes save playlist btn to spotify
        - displays user profile pic and name
        - displays logout btn
            - delete state
            - remove spotify only filters
            - select csv
        - adds filters for only spotify songs
*/

const SpotifyContext = createContext();
export const useSpotifyData = () => useContext(SpotifyContext);
export const SpotifyContextProvider = ({children}) => {
  const emptySpotifyData = {
      username: '',
      id: '',
      spUrl: '',
      profileImg: {
          url: '',
          height: '',
          width: '',
      },
      accessToken: '',
      refreshToken: '',
      expiration: null
  };
  const [spotifyData, setSpotifyData] = useState(emptySpotifyData);
  const logout = () => setSpotifyData(emptySpotifyData);
  const updateSpotifyData = (spotifyDataObj) => setSpotifyData(spotifyDataObj)

  return (
      <SpotifyContext.Provider value={{spotifyData, updateSpotifyData, logout}}>
          { children }
      </SpotifyContext.Provider>
  );
}

export const SpotifyBtn = () => {
    const { spotifyData, updateSpotifyData } = useSpotifyData();
    const { save2Client, setSave2Client } = useSave2Client();
    const { SPOTIFY_COLOR, setBgColor } = useBgColor();
    const { filters, updateFilters } = useSongsFilter();
    const location = useLocation();
    const btn_id = 'spotify-btn';

    // TODO: Handle using jwt instead
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const userData = {
            username: queryParams.get('username'),
            id: queryParams.get('id'),
            spUrl: queryParams.get('spUrl'),
            profileImg: queryParams.get('profileImg'),
            accessToken: queryParams.get('accessToken'),
            refreshToken: queryParams.get('refreshToken'),
            expiration: queryParams.get('expiration')
        };
        updateSpotifyData(userData)
    }, [location.hash]);


    const handleOnClick = async () => {
        if(save2Client) return;
        if(!spotifyData.id){ // login
            try{
                window.location.href = '/spotify/login';
            } catch(err) {
                console.log(err)
            }
        }
        // if logged in
        if(spotifyData.id) {
            const htmlBtn = document.getElementById(btn_id);
            if(htmlBtn) {
                htmlBtn.style.backgroundColor = SPOTIFY_COLOR;
                htmlBtn.style.color = 'black'
            }
            setBgColor(SPOTIFY_COLOR);
            setSave2Client(1);
            updateFilters({
                ...filters,
                req: {
                    ...filters.req,
                    source: {
                        ...filters.req.source,
                        spotify: true
                    }
                }
            });
        }
        else {
            // TODO: display failed to login toast
        }
    }

    return (
        <button id={btn_id} className='save-2-client' onClick={handleOnClick}>Spotify</button>
    );

}



