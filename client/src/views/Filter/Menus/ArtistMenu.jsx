import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const ArtistMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const [artistInput, setArtistInput] = useState('');
    // input funcs
    const handleArtistChange = (event) => setArtistInput(event.target.value);
    // reqex btn funcs
    const reqArtist = () => {
        if(!artistInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            req: {
                ...tempFilters.req,
                artist: {
                    ...tempFilters.req.artist,
                    names: [...tempFilters.req.artist.names, artistInput]
                }
            }
        });
        setArtistInput('')
    }
    const exArtist = () => {
        if(!artistInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            ex: {
                ...tempFilters.ex,
                artist: {
                    ...tempFilters.ex.artist,
                    names: [...tempFilters.ex.artist.names, artistInput]
                }
            }
        });
        setArtistInput('')
    }
    // reqex filter tab funcs
    const removeReqArtist = (artist) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        req: {
            ...tempFilters.req,
            artist: {
                ...tempFilters.req.artist,
                names: tempFilters.req.artist.names.filter(v => v != artist)
            }
        }
    });
    const removeExArtist = (artist) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1, 
        ex: {
            ...tempFilters.ex,
            artist: {
                ...tempFilters.ex.artist,
                names: tempFilters.ex.artist.names.filter(v => v != artist)
            }
        }
    });
    const reqArtists = tempFilters.req.artist.names.map((artist, index) =>
        <ReqExFilterTab 
            key={`reqfilter-artist${index}`}
            label={'Artist: '} value={artist}
            onClickFunc={() => removeReqArtist(artist)}
        />
    );
    const exArtists = tempFilters.ex.artist.names.map((artist, index) =>
        <ReqExFilterTab 
            key={`exfilter-artist${index}`}
            label={'Artist: '} value={artist}
            onClickFunc={() => removeExArtist(artist)}
        />
    );

    const reqChildren = [...reqArtists];
    const exChildren = [...exArtists];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <label htmlFor='artistInput'>Artist: </label>
                    <input
                        className='reqex-input-container'
                        type='text'
                        id='artistInput'
                        value={artistInput}
                        onChange={handleArtistChange}
                    />
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqArtist}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exArtist}>Exclude</button>
                    </div>
                </div>
            </div>

            <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
        </div>
    );
}

export default ArtistMenu;