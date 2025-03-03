import React, { useState } from 'react';
import { useSongsFilter, useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const AlbumMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const { filtersTotal, updateFiltersTotal } = useSongsFilter();
    const [albumInput, setAlbumInput] = useState('');
    const [fromEachAlbum, setFromEachAlbum] = useState(tempFilters.req.album.fromEach);
    // input funcs
    const handleAlbumChange = (event) => setAlbumInput(event.target.value);
    const handleFromEachAlbumChange = (event) => setFromEachAlbum(Math.max(0, Math.min(event.target.value, tempFilters.req.artist.fromEach ? tempFilters.req.artist.fromEach : Number.MAX_SAFE_INTEGER)));
    // reqex btn funcs
    const reqAlbum = () => {
        if(!albumInput) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                album: {
                    ...tempFilters.req.album,
                    names: [...tempFilters.req.album.names, albumInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setAlbumInput('')
    };
    const exAlbum = () => {
        if(!albumInput) return;
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                album: {
                    ...tempFilters.ex.album,
                    names: [...tempFilters.ex.album.names, albumInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setAlbumInput('')
    };
    const reqFromEach = () => {
        if(fromEachAlbum == null) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                album: {
                    ...tempFilters.req.album,
                    fromEach: fromEachAlbum
                }
            }
        });
        const newTotal = tempFilters.req.album.fromEach ? filtersTotal : filtersTotal + 1;
        updateFiltersTotal(newTotal);
    };
    // reqex filter tab funcs
    const removeReqAlbum = (album) => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                album: {
                    ...tempFilters.req.album,
                    names: tempFilters.req.album.names.filter(v => v != album)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeExAlbum = (album) => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                album: {
                    ...tempFilters.ex.album,
                    names: tempFilters.ex.album.names.filter(v => v != album)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeReqFromEach = () => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                album: {
                    ...tempFilters.req.album,
                    fromEach: null
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const reqAlbums = tempFilters.req.album.names.map((album, index) =>
        <ReqExFilterTab 
            key={`reqfilter-album${index}`}
            reqex={'req'}
            label={'Album: '} value={album}
            onClickFunc={() => removeReqAlbum(album)}
        />
    );
    const exAlbums = tempFilters.ex.album.names.map((album, index) =>
        <ReqExFilterTab 
            key={`exfilter-album${index}`}
            reqex={'ex'}
            label={'Album: '} value={album}
            onClickFunc={() => removeExAlbum(album)}
        />
    );

    const reqChildren = [
        (tempFilters.req.album.fromEach && <ReqExFilterTab key={'reqfilter-album-fromEach'} reqex={'req'} label={'From Each:'} value={`${tempFilters.req.album.fromEach}`} onClickFunc={removeReqFromEach}/>),
        ...reqAlbums
    ];
    const exChildren = [...exAlbums];

    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='albumInput'>Album: </label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='albumInput'
                            value={albumInput}
                            onChange={handleAlbumChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqAlbum}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exAlbum}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='fromEachAlbumInput'>#Songs From Each: </label>
                        <input
                            className='reqex-input-container'
                            type='number'
                            id='fromEachAlbumInput'
                            onChange={handleFromEachAlbumChange}
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

export default AlbumMenu;