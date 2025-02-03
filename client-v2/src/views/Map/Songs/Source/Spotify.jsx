import React, { useState, createContext, useContext } from 'react';
import { useSourceData } from './SourceContext';
import { useSongsFilter } from '../../Filter/FilterContext';
import SpotifyLogo from '../../../../assets/spotify-logo.svg';

const SpotifyContext = createContext();
export const useSpotifyData = () => useContext(SpotifyContext);
export const SpotifyContextProvider = ({children}) => {
    /* spotifyData
        {
            accessToken: string,
            refreshToken: string,
            username: string,
            spotifyID: string,
            profileImgURL: string,
        }
    */
    const [spotifyData, setSpotifyData] = useState(null);
    const logout = () => setSpotifyData(null);
    const updateSpotifyData = (spotifyDataObj) => {
    if(spotifyData != null) return;
    if(spotifyDataObj == null) return;
    setSpotifyData(spotifyDataObj)
    }

    return (
        <SpotifyContext.Provider value={{spotifyData, updateSpotifyData, logout}}>
            { children }
        </SpotifyContext.Provider>
    );
}

export const SpotifyIcon = ({url}) => {
    const goToSpotify = () => window.open(url, '_blank');
    return (
        <div className="svg-container" onClick={goToSpotify}>
            <img
                loading="lazy"
                src={SpotifyLogo}
                alt='spotify-link'
            />
        </div>
    );
}

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
            - select all
        - adds filters for only spotify songs
*/
export const SpotifyBtn = () => {
    const { spotifyData, updateSpotifyData } = useSpotifyData();
    const { source, changeSource, SPOTIFY_SOURCE, SPOTIFY_COLOR } = useSourceData();
    const { filters, updateFilters } = useSongsFilter();
    const btn_id = 'spotify-btn';

    const handleOnClick = () => {
        if(source == SPOTIFY_SOURCE) return;
        if(spotifyData === null){ // logged out
            window.location.href = '/spotify/login';
            return;
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

    return (
        <button id={btn_id} className={`source-btn ${source == SPOTIFY_SOURCE ? 'selected' : ''} ${spotifyData?.id ? SPOTIFY_COLOR : ''}`} onClick={()=>handleOnClick()}>Spotify</button>
    );
}