import React from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { Toggle } from './MenuUtils';


const SourceMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    // input funcs
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
    }
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
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
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