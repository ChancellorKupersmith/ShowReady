import React, { useState, createContext, useContext } from 'react';
import { useSongsFilter } from '../../Filter/FilterContext';
import { useSourceData } from './SourceContext';
import YouTubeLogo from '../../../../assets/youtube-logo.svg';

const YouTubeContext = createContext();
export const useYouTubeData = () => useContext(YouTubeContext);
export const YouTubeContextProvider = ({children}) => {
    /* ytData
        {
            accessToken: string,
            refreshToken: string,
            username: string,
            channelID: string,
            profileImgURL: string,
        }
    */
    const [ytData, setYTData] = useState(null);
    const logout = () => setYTData(null);
    const updateYTData = (ytDataObj) => {
    if(ytData != null) return;
    if(ytDataObj == null) return;
    setYTData(ytDataObj)
    }

    return (
        <YouTubeContext.Provider value={{ytData, updateYTData, logout}}>
            { children }
        </YouTubeContext.Provider>
    );
};
// <a href="https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ" target="_blank
export const YouTubeIcon = ({url}) => {
    const goToYouTube = () => window.open(url, '_blank');
    return (
        <div className="svg-container" onClick={goToYouTube}>
            <img
                loading="lazy"
                src={YouTubeLogo}
                alt='youtube-link'
            />
        </div>
    );
}

export const YouTubeBtn = () => {
    const { ytData, updateYTData } = useYouTubeData();
    const { source, changeSource, YOUTUBE_SOURCE, YOUTUBE_COLOR } = useSourceData();
    const { filters, updateFilters, filtersTotal, updateFiltersTotal } = useSongsFilter();
    
    
    const handleOnClick = async () => {
        if(source == YOUTUBE_SOURCE) return;
        
        if(ytData === null){ // logged out
            window.location.href = '/google_api/login';
            return;
        }

        changeSource(YOUTUBE_SOURCE);
        updateFilters({
            ...filters,
            req: {
                ...filters.req,
                source: {
                    ...filters.req.source,
                    youtube: true,
                    spotify: false
                }
            }
        });
        let newTotal = filters.total;
        if(!filters.req.source.youtube)
            newTotal += 1;
        if(filters.req.source.spotify)
            newTotal -= 1;
        updateFiltersTotal(newTotal);
    }

    return (
        <button id='youtube-btn' className={`source-btn ${source == YOUTUBE_SOURCE ? 'selected' : ''}`} onClick={() => handleOnClick()}>YouTube</button>
    );

}
