import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const SongMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const [songInput, setSongInput] = useState('');
    // input funcs
    const handleSongChange = (event) => setSongInput(event.target.value);
    // reqex btn funcs
    const reqSong = () => {
        if(!songInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1, 
            req: {
                ...tempFilters.req,
                song: {
                    ...tempFilters.req.song,
                    names: [...tempFilters.req.song.names, songInput]
                }
            }
        });
        setSongInput('')
    }
    const exSong = () => {
        if(!songInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            ex: {
                ...tempFilters.ex,
                song: {
                    ...tempFilters.ex.song,
                    names: [...tempFilters.ex.song.names, songInput]
                }
            }
        });
        setSongInput('')
    }
    // reqex filter tab funcs
    const removeReqSong = (song) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        req: {
            ...tempFilters.req,
            song: {
                ...tempFilters.req.song,
                names: tempFilters.req.song.names.filter(v => v != song)
            }
        }
    });
    const removeExSong = (song) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        ex: {
            ...tempFilters.ex,
            song: {
                ...tempFilters.ex.song,
                names: tempFilters.ex.song.names.filter(v => v != song)
            }
        }
    });
    const reqSongs = tempFilters.req.song.names.map((song, index) =>
        <ReqExFilterTab 
            key={`reqfilter-song${index}`}
            reqex={'req'}
            label={'Song: '} value={song}
            onClickFunc={() => removeReqSong(song)}
        />
    );
    const exSongs = tempFilters.ex.song.names.map((song, index) =>
        <ReqExFilterTab 
            key={`exfilter-song${index}`}
            reqex={'ex'}
            label={'Song: '} value={song}
            onClickFunc={() => removeExSong(song)}
        />
    );

    const reqChildren = [...reqSongs];
    const exChildren = [...exSongs];

    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='songInput'>Song: </label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='songInput'
                            value={songInput}
                            onChange={handleSongChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqSong}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exSong}>Exclude</button>
                    </div>
                </div>
            </div>
            {
                (reqChildren.length > 0 || exChildren.length > 0) &&
                <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
            }
        </div>
    );
}

export default SongMenu;