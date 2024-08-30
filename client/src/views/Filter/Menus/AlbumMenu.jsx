import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const AlbumMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const [albumInput, setAlbumInput] = useState('');
    // input funcs
    const handleAlbumChange = (event) => setAlbumInput(event.target.value);
    // reqex btn funcs
    const reqAlbum = () => {
        if(!albumInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            req: {
                ...tempFilters.req,
                album: {
                    ...tempFilters.req.album,
                    names: [...tempFilters.req.album.names, albumInput]
                }
            }
        });
        setAlbumInput('')
    }
    const exAlbum = () => {
        if(!albumInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            ex: {
                ...tempFilters.ex,
                album: {
                    ...tempFilters.ex.album,
                    names: [...tempFilters.ex.album.names, albumInput]
                }
            }
        });
        setAlbumInput('')
    }
    // reqex filter tab funcs
    const removeReqAlbum = (album) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        req: {
            ...tempFilters.req,
            album: {
                ...tempFilters.req.album,
                names: tempFilters.req.album.names.filter(v => v != album)
            }
        }
    });
    const removeExAlbum = (album) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total + 1,
        ex: {
            ...tempFilters.ex,
            album: {
                ...tempFilters.ex.album,
                names: tempFilters.ex.album.names.filter(v => v != album)
            }
        }
    });
    const reqAlbums = tempFilters.req.album.names.map((album, index) =>
        <ReqExFilterTab 
            key={`reqfilter-album${index}`}
            label={'Album: '} value={album}
            onClickFunc={() => removeReqAlbum(album)}
        />
    );
    const exAlbums = tempFilters.ex.album.names.map((album, index) =>
        <ReqExFilterTab 
            key={`exfilter-album${index}`}
            label={'Album: '} value={album}
            onClickFunc={() => removeExAlbum(album)}
        />
    );

    const reqChildren = [...reqAlbums];
    const exChildren = [...exAlbums];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <label htmlFor='albumInput'>Album: </label>
                    <input
                        className='reqex-input-container'
                        type='text'
                        id='albumInput'
                        value={albumInput}
                        onChange={handleAlbumChange}
                    />
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqAlbum}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exAlbum}>Exclude</button>
                    </div>
                </div>
            </div>

            <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
        </div>
    );
}

export default AlbumMenu;