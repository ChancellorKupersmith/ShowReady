import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const GenreMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const [genreInput, setGenreInput] = useState('');
    // input funcs
    const handleGenreChange = (event) => setGenreInput(event.target.value);
    // TODO: can have a max from each genre 
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
    const reqGenres = tempFilters.req.genre.names.map((genre, index) =>
        <ReqExFilterTab 
            key={`reqfilter-genre${index}`}
            label={'Genre: '} value={genre}
            onClickFunc={() => removeReqGenre(genre)}
        />
    );
    const exGenres = tempFilters.ex.genre.names.map((genre, index) =>
        <ReqExFilterTab 
            key={`exfilter-genre${index}`}
            label={'Genre: '} value={genre}
            onClickFunc={() => removeExGenre(genre)}
        />
    );

    const reqChildren = [...reqGenres];
    const exChildren = [...exGenres];

    return (
        <div className='filter-menu'>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <label htmlFor='genreInput'>Genre: </label>
                    <input
                        className='reqex-input-container'
                        type='text'
                        id='genreInput'
                        value={genreInput}
                        onChange={handleGenreChange}
                    />
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqGenre}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exGenre}>Exclude</button>
                    </div>
                </div>
            </div>

            <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
        </div>
    );
}

export default GenreMenu;