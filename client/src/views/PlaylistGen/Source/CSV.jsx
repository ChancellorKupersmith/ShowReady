import React from 'react';
import { useSongsFilter } from '../../Filter/FilterContext';
import { useSourceData } from './SourceContext';

/*
    when clicked if not already selected
        - removes require spotify
        - removes require yt
        - change bg

*/
const CSVBtn = () => {
    const { filters, updateFilters } = useSongsFilter();
    const { source, changeSource, CSV_SOURCE } = useSourceData();
    
    const handleOnClick = async () => {
        if(source == CSV_SOURCE) return;

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
        changeSource(CSV_SOURCE);
    }

    return (
        <button id='csv-btn' className='source-btn' onClick={()=>handleOnClick()}>CSV</button>
    );
}

export default CSVBtn;


