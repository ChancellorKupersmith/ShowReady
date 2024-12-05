import React from 'react';
import { useSongsFilter } from '../../Filter/FilterContext';
import { useSourceData } from './SourceContext';

/*
    when clicked if not already selected
        - removes require spotify
        - removes require yt
        - change bg

*/
const AllBtn = () => {
    const { filters, updateFilters } = useSongsFilter();
    const { source, changeSource, ALL_SOURCE } = useSourceData();
    
    const handleOnClick = async () => {
        if(source == ALL_SOURCE) return;

        let newTotal = filters.total;
        if(filters.req.source.spotify)
            newTotal -= 1;
        if(filters.req.source.youtube)
            newTotal -= 1;
        updateFilters({
            ...filters,
            total: newTotal,
            req: {
                ...filters.req,
                source: {
                    ...filters.req.source,
                    spotify: false,
                    youtube: false
                }
            }
        });
        changeSource(ALL_SOURCE);
    }

    return (
        <button id='all-btn' className={`source-btn ${source == ALL_SOURCE ? 'selected' : ''}`} onClick={()=>handleOnClick()}>All</button>
    );
}

export default AllBtn;


