import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const ArtistMenu = () => {
    const { tempFilters, updateTempFilters, tempFiltersTotal, updateTempFiltersTotal } = useSongsFilter();
    const [artistInput, setArtistInput] = useState('');
    const [fromEachArtist, setFromEachArtist] = useState(tempFilters.req.artist.fromEach);
    // input funcs
    const handleArtistChange = (event) => setArtistInput(event.target.value);
    const handleFromEachArtistChange = (event) => setFromEachArtist(Math.max(0, event.target.value));
    // reqex btn funcs
    const reqArtist = () => {
        if(!artistInput) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                artist: {
                    ...tempFilters.req.artist,
                    names: [...tempFilters.req.artist.names, artistInput]
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal + 1);
        setArtistInput('')
    };
    const exArtist = () => {
        if(!artistInput) return;
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                artist: {
                    ...tempFilters.ex.artist,
                    names: [...tempFilters.ex.artist.names, artistInput]
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal + 1);
        setArtistInput('')
    };
    const reqFromEach = () => {
        console.log(fromEachArtist)
        if(fromEachArtist == null) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                artist: {
                    ...tempFilters.req.artist,
                    fromEach: fromEachArtist
                }
            }
        });
        const newTotal = tempFilters.req.artist.fromEach ? tempFiltersTotal : tempFiltersTotal + 1;
        updateTempFiltersTotal(newTotal);
    };
    // reqex filter tab funcs
    const removeReqArtist = (artist) => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                artist: {
                    ...tempFilters.req.artist,
                    names: tempFilters.req.artist.names.filter(v => v != artist)
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal - 1);
    };
    const removeExArtist = (artist) => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                artist: {
                    ...tempFilters.ex.artist,
                    names: tempFilters.ex.artist.names.filter(v => v != artist)
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal - 1);
    };
    const removeReqFromEach = () => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                artist: {
                    ...tempFilters.req.artist,
                    fromEach: null
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal - 1);
    };
    const reqArtists = tempFilters.req.artist.names.map((artist, index) =>
        <ReqExFilterTab 
            key={`reqfilter-artist${index}`}
            reqex={'req'}
            label={'Artist: '} value={artist}
            onClickFunc={() => removeReqArtist(artist)}
        />
    );
    const exArtists = tempFilters.ex.artist.names.map((artist, index) =>
        <ReqExFilterTab 
            key={`exfilter-artist${index}`}
            reqex={'ex'}
            label={'Artist: '} value={artist}
            onClickFunc={() => removeExArtist(artist)}
        />
    );

    const reqChildren = [
        (tempFilters.req.artist.fromEach && <ReqExFilterTab key={'reqfilter-artist-fromEach'} reqex={'req'} label={'From Each:'} value={`${tempFilters.req.artist.fromEach}`} onClickFunc={removeReqFromEach}/>),
        ...reqArtists
    ];
    const exChildren = [...exArtists];

    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='artistInput'>Artist: </label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='artistInput'
                            value={artistInput}
                            onChange={handleArtistChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqArtist}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exArtist}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='fromEachArtistInput'>#Songs From Each: </label>
                        <input
                            className='reqex-input-container'
                            type='number'
                            id='fromEachArtistInput'
                            onChange={handleFromEachArtistChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn only' onClick={reqFromEach}>Require</button>
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

export default ArtistMenu;