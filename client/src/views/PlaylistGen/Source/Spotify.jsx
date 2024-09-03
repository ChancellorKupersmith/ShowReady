import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { useSourceData } from './SourceContext';
import { useSongsFilter } from '../../Filter/FilterContext';

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
    const { source, changeSource, SPOTIFY_SOURCE, SPOTIFY_COLOR } = useSourceData();
    const { filters, updateFilters } = useSongsFilter();
    const location = useLocation();
    const btn_id = 'spotify-btn';

    useEffect(() => {
        // only execute if logged in
        if(spotifyData.id === ''){
            try {
                // TODO: look into handling in a more elegant way than just dumping the user data into the url
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
                if(userData.id != null){
                    updateSpotifyData(userData)
                    const htmlBtn = document.getElementById(btn_id);
                    if(htmlBtn) {
                        htmlBtn.style.backgroundColor = SPOTIFY_COLOR;
                        htmlBtn.style.color = 'black';
                    }
                    let newTotal = filters.total;
                    if(!filters.req.source.spotify)
                        newTotal += 1;
                    if(filters.req.source.youtube)
                        newTotal -= 1;
                    changeSource(SPOTIFY_SOURCE);
                    updateFilters({
                        ...filters,
                        total: newTotal,
                        req: {
                            ...filters.req,
                            source: {
                                ...filters.req.source,
                                spotify: true,
                                youtube: false
                            }
                        }
                    });
                    
                }
            } catch (err) {
                console.error(err)
                // TODO: display failed to login toast
            }
        }
    }, [location.hash]);


    const handleOnClick = () => {
        if(source == SPOTIFY_SOURCE) return;
        if(spotifyData.id){ // logged in
            let newTotal = filters.total;
            if(!filters.req.source.spotify)
                newTotal += 1;
            if(filters.req.source.youtube)
                newTotal -= 1;
            changeSource(SPOTIFY_SOURCE);
            updateFilters({
                ...filters,
                total: newTotal,
                req: {
                    ...filters.req,
                    source: {
                        ...filters.req.source,
                        spotify: true,
                        youtube: false
                    }
                }
            });
            
        }
        else{
            window.location.href = '/spotify/login';
        }
    }

    return (
        <button id={btn_id} className='source-btn' onClick={()=>handleOnClick()}>Spotify</button>
    );

}



