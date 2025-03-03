import React from 'react';
import { useSongsFilter, useTempSongsFilter } from '../FilterContext';
import { Toggle } from './MenuUtils';


const SourceMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const { filtersTotal, updateFiltersTotal } = useSongsFilter();
    const handleChangeReqSpotify = () => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                source: {
                    ...tempFilters.req.source,
                    spotify: !tempFilters.req.source.spotify
                }
            }
        });
        const newTotal = tempFilters.req.source.spotify ? filtersTotal - 1 : filtersTotal + 1;
        updateFiltersTotal(newTotal);
    };
    const handleChangeExSpotify = () => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                source: {
                    ...tempFilters.ex.source,
                    spotify: !tempFilters.ex.source.spotify
                }
            }
        });
        const newTotal = tempFilters.ex.source.spotify ? filtersTotal - 1 : filtersTotal + 1;
        updateFiltersTotal(newTotal);
    };
    const handleChangeReqYoutube = () => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                source: {
                    ...tempFilters.req.source,
                    youtube: !tempFilters.req.source.youtube
                }
            }
        });
        const newTotal = tempFilters.req.source.youtube ? filtersTotal - 1 : filtersTotal + 1;
        updateFiltersTotal(newTotal);
    };
    const handleChangeExYoutube = () => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                source: {
                    ...tempFilters.ex.source,
                    youtube: !tempFilters.ex.source.youtube
                }
            }
        });
        const newTotal = tempFilters.ex.source.youtube ? filtersTotal - 1 : filtersTotal + 1;
        updateFiltersTotal(newTotal);
    };

    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='reqex-input-container'>
                        <Toggle
                            id={'toggle-req-spotify'}
                            label={'Require Spotify Songs'}
                            toggled={tempFilters.req.source.spotify}
                            onClick={handleChangeReqSpotify}
                        />
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='reqex-input-container'>
                        <Toggle
                            id={'toggle-ex-spotify'}
                            label={'Exclude Spotify Songs'}
                            toggled={tempFilters.ex.source.spotify}
                            onClick={handleChangeExSpotify}
                        />
                    </div>
                </div>
            </div>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='reqex-input-container'>
                        <Toggle
                            id={'toggle-req-youtube'}
                            label={'Require Youtube Songs'}
                            toggled={tempFilters.req.source.youtube}
                            onClick={handleChangeReqYoutube}
                        />
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='reqex-input-container'>
                        <Toggle
                            id={'toggle-ex-youtube'}
                            label={'Exclude Youtube Songs'}
                            toggled={tempFilters.ex.source.youtube}
                            onClick={handleChangeExYoutube}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SourceMenu;