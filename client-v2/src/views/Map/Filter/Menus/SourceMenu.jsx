import React from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { Toggle } from './MenuUtils';


const SourceMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const handleChangeReqSpotify = () => {
        const newTotal = tempFilters.req.source.spotify ? tempFilters.total - 1 : tempFilters.total + 1;
        updateTempFilters({
            ...tempFilters,
            total: newTotal,
            req: {
                ...tempFilters.req,
                source: {
                    ...tempFilters.req.source,
                    spotify: !tempFilters.req.source.spotify
                }
            }
        });
    }
    const handleChangeExSpotify = () => {
        const newTotal = tempFilters.ex.source.spotify ? tempFilters.total - 1 : tempFilters.total + 1;
        updateTempFilters({
            ...tempFilters,
            total: newTotal,
            ex: {
                ...tempFilters.ex,
                source: {
                    ...tempFilters.ex.source,
                    spotify: !tempFilters.ex.source.spotify
                }
            }
        });
    }

    return (
        <div className='filter-menu'>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <Toggle
                            id={'toggle-req-spotify'}
                            label={'Require Spotify Songs'}
                            toggled={tempFilters.req.source.spotify}
                            onClick={handleChangeReqSpotify}
                        />
                    </div>
                </div>
                <div className='menu-input'>
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
        </div>
    );
}

export default SourceMenu;