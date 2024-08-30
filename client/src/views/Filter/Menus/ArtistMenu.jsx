import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const ArtistMenu = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [artistInput, setArtistInput] = useState('');
    // input funcs
    const handleArtistChange = (event) => setArtistInput(event.target.value);
    // reqex btn funcs
    const reqArtist = () => {
        if(!artistInput) return;
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                artist: {
                    ...filters.req.artist,
                    names: [...filters.req.artist.names, artistInput]
                }
            }
        });
        setArtistInput('')
    }
    const exArtist = () => {
        if(!artistInput) return;
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                artist: {
                    ...filters.ex.artist,
                    names: [...filters.ex.artist.names, artistInput]
                }
            }
        });
        setArtistInput('')
    }
    // reqex filter tab funcs
    const removeReqArtist = (artist) => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            artist: {
                ...filters.req.artist,
                names: filters.req.artist.names.filter(v => v != artist)
            }
        }
    });
    const removeExArtist = (artist) => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            artist: {
                ...filters.ex.artist,
                names: filters.ex.artist.names.filter(v => v != artist)
            }
        }
    });
    const reqArtists = filters.req.artist.names.map((artist, index) =>
        <ReqExFilterTab 
            key={`reqfilter-artist${index}`}
            label={'Artist: '} value={artist}
            onClickFunc={() => removeReqArtist(artist)}
        />
    );
    const exArtists = filters.ex.artist.names.map((artist, index) =>
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
                    <div className='reqex-input-container'>
                        <label htmlFor='artistInput'>Artist: </label>
                        <input
                            type='text'
                            id='artistInput'
                            value={artistInput}
                            onChange={handleArtistChange}
                        />
                    </div>
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