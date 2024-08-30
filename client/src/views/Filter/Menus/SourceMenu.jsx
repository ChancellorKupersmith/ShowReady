import React from 'react';
import { useSongsFilter } from '../FilterContext';
import { Toggle } from './MenuUtils';


const SourceMenu = () => {
    const { filters, updateFilters } = useSongsFilter();
    // input funcs
    const handleChangeReqSpotify = () => {
        updateFilters({
            ...filters,
            req: {
                ...filters.req,
                source: {
                    ...filters.req.source,
                    spotify: !filters.req.source.spotify
                }
            }
        });
    }
    const handleChangeExSpotify = () => {
        updateFilters({
            ...filters,
            ex: {
                ...filters.ex,
                source: {
                    ...filters.ex.source,
                    spotify: !filters.ex.source.spotify
                }
            }
        });
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <Toggle
                            id={'toggle-req-spotify'}
                            label={'Require Spotify Songs'}
                            toggled={filters.req.source.spotify}
                            onClick={handleChangeReqSpotify}
                        />
                    </div>
                </div>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <Toggle
                            id={'toggle-ex-spotify'}
                            label={'Exclude Spotify Songs'}
                            toggled={filters.ex.source.spotify}
                            onClick={handleChangeExSpotify}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SourceMenu;