import React, { useState, createContext, useContext } from 'react';

const SourceContext = createContext();
export const useSourceData = () => useContext(SourceContext);
export const SourceContextProvider = ({children}) => {
    const ALL_SOURCE = 0;
    const ALL_COLOR = 'all-bg-color';
    const SPOTIFY_SOURCE = 1;
    const SPOTIFY_COLOR = 'spotify-bg-color';
    const YOUTUBE_SOURCE = 2;
    const YOUTUBE_COLOR = 'youtube-bg-color'; 
    const [bgColor, setBgColor] = useState(ALL_COLOR);
    const [source, setSource] = useState(0);

    const changeSource = (src) => {
        if(src === source) return;
        switch(src){
            case SPOTIFY_SOURCE:
                setBgColor(SPOTIFY_COLOR);
                setSource(1);
                break;
            case YOUTUBE_SOURCE:
                setBgColor(YOUTUBE_COLOR);
                setSource(2);
                break;
            default:
                setBgColor(ALL_COLOR);
                setSource(0);
        }
    }
    
    return (
        <SourceContext.Provider value={{
            source, changeSource, bgColor,
            ALL_SOURCE, SPOTIFY_SOURCE, YOUTUBE_SOURCE,
            ALL_COLOR, SPOTIFY_COLOR, YOUTUBE_COLOR
        }}>
            { children }
        </SourceContext.Provider>
    );
}