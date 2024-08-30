import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const SongMenu = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [songInput, setSongInput] = useState('');
    // input funcs
    const handleSongChange = (event) => setSongInput(event.target.value);
    // reqex btn funcs
    const reqSong = () => {
        if(!songInput) return;
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                song: {
                    ...filters.req.song,
                    names: [...filters.req.song.names, songInput]
                }
            }
        });
        setSongInput('')
    }
    const exSong = () => {
        if(!songInput) return;
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                song: {
                    ...filters.ex.song,
                    names: [...filters.ex.song.names, songInput]
                }
            }
        });
        setSongInput('')
    }
    // reqex filter tab funcs
    const removeReqSong = (song) => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            song: {
                ...filters.req.song,
                names: filters.req.song.names.filter(v => v != song)
            }
        }
    });
    const removeExSong = (song) => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            song: {
                ...filters.ex.song,
                names: filters.ex.song.names.filter(v => v != song)
            }
        }
    });
    const reqSongs = filters.req.song.names.map((song, index) =>
        <ReqExFilterTab 
            key={`reqfilter-song${index}`}
            label={'Song: '} value={song}
            onClickFunc={() => removeReqSong(song)}
        />
    );
    const exSongs = filters.ex.song.names.map((song, index) =>
        <ReqExFilterTab 
            key={`exfilter-song${index}`}
            label={'Song: '} value={song}
            onClickFunc={() => removeExSong(song)}
        />
    );

    const reqChildren = [...reqSongs];
    const exChildren = [...exSongs];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='songInput'>Song: </label>
                        <input
                            type='text'
                            id='songInput'
                            value={songInput}
                            onChange={handleSongChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqSong}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exSong}>Exclude</button>
                    </div>
                </div>
            </div>

            <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
        </div>
    );
}

export default SongMenu;