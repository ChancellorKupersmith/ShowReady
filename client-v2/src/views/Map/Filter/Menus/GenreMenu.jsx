import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const GenreMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const [genreInput, setGenreInput] = useState('');
    const [fromEachGenre, setFromEachGenre] = useState(tempFilters.req.genre.fromEach);
    // input funcs
    const handleGenreChange = (event) => setGenreInput(event.target.value);
    const handleFromEachGenreChange = (event) => setFromEachGenre(Math.max(0, event.target.value));
    // reqex btn funcs
    const reqGenre = () => {
        if(!genreInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            req: {
                ...tempFilters.req,
                genre: {
                    ...tempFilters.req.genre,
                    names: [...tempFilters.req.genre.names, genreInput]
                }
            }
        });
        setGenreInput('')
    };
    const exGenre = () => {
        if(!genreInput) return;
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            ex: {
                ...tempFilters.ex,
                genre: {
                    ...tempFilters.ex.genre,
                    names: [...tempFilters.ex.genre.names, genreInput]
                }
            }
        });
        setGenreInput('')
    };
    const reqFromEach = () => {
        console.log(fromEachGenre)
        if(fromEachGenre == null) return;
        const newTotal = tempFilters.req.genre.fromEach ? tempFilters.total : tempFilters.total + 1;
        updateTempFilters({
            ...tempFilters,
            total: newTotal,
            req: {
                ...tempFilters.req,
                genre: {
                    ...tempFilters.req.genre,
                    fromEach: fromEachGenre
                }
            }
        });
    };
    // reqex filter tab funcs
    const removeReqGenre = (genre) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        req: {
            ...tempFilters.req,
            genre: {
                ...tempFilters.req.genre,
                names: tempFilters.req.genre.names.filter(v => v != genre)
            }
        }
    });
    const removeExGenre = (genre) => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total + 1,
        ex: {
            ...tempFilters.ex,
            genre: {
                ...tempFilters.ex.genre,
                names: tempFilters.ex.genre.names.filter(v => v != genre)
            }
        }
    });
    const removeReqFromEach = () => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        req: {
            ...tempFilters.req,
            genre: {
                ...tempFilters.req.genre,
                fromEach: null
            }
        }
    });
    const reqGenres = tempFilters.req.genre.names.map((genre, index) =>
        <ReqExFilterTab 
            key={`reqfilter-genre${index}`}
            reqex={'req'}
            label={'Genre: '} value={genre}
            onClickFunc={() => removeReqGenre(genre)}
        />
    );
    const exGenres = tempFilters.ex.genre.names.map((genre, index) =>
        <ReqExFilterTab 
            key={`exfilter-genre${index}`}
            reqex={'ex'}
            label={'Genre: '} value={genre}
            onClickFunc={() => removeExGenre(genre)}
        />
    );

    const reqChildren = [
        (tempFilters.req.genre.fromEach && <ReqExFilterTab key={'reqfilter-genre-fromEach'} reqex={'req'} label={'From Each:'} value={`${tempFilters.req.genre.fromEach}`} onClickFunc={removeReqFromEach}/>),
        ...reqGenres
    ];
    const exChildren = [...exGenres];

    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='genreInput'>Genre:</label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='genreInput'
                            value={genreInput}
                            onChange={handleGenreChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqGenre}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exGenre}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='fromEachGenreInput'>#Songs From Each: </label>
                        <input
                            className='reqex-input-container'
                            type='number'
                            id='fromEachGenreInput'
                            onChange={handleFromEachGenreChange}
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

export default GenreMenu;