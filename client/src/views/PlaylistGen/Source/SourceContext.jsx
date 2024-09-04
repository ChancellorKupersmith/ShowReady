import React, { useState, createContext, useContext } from 'react';

const SourceContext = createContext();
export const useSourceData = () => useContext(SourceContext);
export const SourceContextProvider = ({children}) => {
    const CSV_SOURCE = 0;
    const CSV_COLOR = '#8fdaed';
    const SPOTIFY_SOURCE = 1;
    const SPOTIFY_COLOR = '#18c49e';
    const YOUTUBE_SOURCE = 2;
    const YOUTUBE_COLOR = '#ff4d4d'; 
    const [bgColor, setBgColor] = useState(CSV_COLOR);
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
                setBgColor(CSV_COLOR);
                setSource(0);
        }
    }
    
    return (
        <SourceContext.Provider value={{
            source, changeSource, bgColor,
            CSV_SOURCE, SPOTIFY_SOURCE, YOUTUBE_SOURCE,
            CSV_COLOR, SPOTIFY_COLOR, YOUTUBE_COLOR
        }}>
            { children }
        </SourceContext.Provider>
    );
}