import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const AlbumMenu = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [albumInput, setAlbumInput] = useState('');
    // input funcs
    const handleAlbumChange = (event) => setAlbumInput(event.target.value);
    // reqex btn funcs
    const reqAlbum = () => {
        if(!albumInput) return;
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                album: {
                    ...filters.req.album,
                    names: [...filters.req.album.names, albumInput]
                }
            }
        });
        setAlbumInput('')
    }
    const exAlbum = () => {
        if(!albumInput) return;
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                album: {
                    ...filters.ex.album,
                    names: [...filters.ex.album.names, albumInput]
                }
            }
        });
        setAlbumInput('')
    }
    // reqex filter tab funcs
    const removeReqAlbum = (album) => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            album: {
                ...filters.req.album,
                names: filters.req.album.names.filter(v => v != album)
            }
        }
    });
    const removeExAlbum = (album) => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            album: {
                ...filters.ex.album,
                names: filters.ex.album.names.filter(v => v != album)
            }
        }
    });
    const reqAlbums = filters.req.album.names.map((album, index) =>
        <ReqExFilterTab 
            key={`reqfilter-album${index}`}
            label={'Album: '} value={album}
            onClickFunc={() => removeReqAlbum(album)}
        />
    );
    const exAlbums = filters.ex.album.names.map((album, index) =>
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
                    <div className='reqex-input-container'>
                        <label htmlFor='albumInput'>Album: </label>
                        <input
                            type='text'
                            id='albumInput'
                            value={albumInput}
                            onChange={handleAlbumChange}
                        />
                    </div>
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