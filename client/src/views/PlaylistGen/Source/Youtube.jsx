import React from 'react';
import { useSongsFilter } from '../../Filter/FilterContext';
import { useSourceData } from './SourceContext';

export const YouTubeBtn = () => {
    const { filters, updateFilters } = useSongsFilter();
    const { source, changeSource, YOUTUBE_SOURCE, YOUTUBE_COLOR } = useSourceData();
    
    const handleOnClick = async () => {
        if(source == YOUTUBE_SOURCE) return;

        let newTotal = filters.total;
        if(!filters.req.source.youtube)
            newTotal += 1;
        if(filters.req.source.spotify)
            newTotal -= 1;
        updateFilters({
            ...filters,
            total: newTotal,
            req: {
                ...filters.req,
                source: {
                    ...filters.req.source,
                    youtube: true,
                    spotify: false
                }
            }
        });
        changeSource(YOUTUBE_SOURCE);
    }

    return (
        <button id='youtube-btn' className='source-btn' onClick={() => handleOnClick()}>YouTube</button>
    );

}