import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const OrderBys = Object.freeze({
    SONG_NAME: 1,
    ARTIST: 2,
    EVENT_DATE: 3,
    RANDOM: 4,
 });

const SongsFilterContext = createContext();
export const useSongsFilter = () => useContext(SongsFilterContext);
export const FilterContextProvider = ({ children }) => {
    const today = new Date();
    let monthFromToday = new Date();
    monthFromToday.setDate(today.getDate() + 30)
    const defaultFilters = {
        orderBy: OrderBys.RANDOM,
        descending: false,
        total: 3,
        dateGThan: formatDate(today),
        dateLThan: formatDate(monthFromToday),
        priceGThan: '',
        priceLThan: '',
        randomSeed: (Date.now() / 1000) % 1,
        ex: {
            genre: {
                names: [],
            },
            date: {
                dates: [],
                eventTimes: [],
            },
            location: {
                venues: [],
                hoods: [],
            },
            event: {
                names: [],
            },
            artist: {
                names: [],

            },
            album: {
                names: [],
            },
            song: {
                names: [],
                ids: [],
            },
            source: {
                spotify: false,
                youtube: false,
            },
        },
        req: {
            genre: {
                names: [],
                fromEach: null,
            },
            date: {
                dates: [],
                eventTimes: [],
            },
            location: {
                venues: [],
                hoods: [],
                addresses: [],
            },
            event: {
                names: [],
            },
            artist: {
                names: [],
                fromEach: 10,
            },
            album: {
                names: [],
                fromEach: null,
            },
            song: {
                names: [],
            },
            source: {
                spotify: false,
                youtube: false,
            },
        },
    };
    const [filters, setFilters] = useState(() => {
        const savedFilters = sessionStorage.getItem('filters');
        return savedFilters ? JSON.parse(savedFilters) : defaultFilters;
    });
    useEffect(() => sessionStorage.setItem('filters', JSON.stringify(filters)), [filters]);
    const updateFilters = (newFiltersObj) => {
        if(!newFiltersObj) return;
        setFilters(newFiltersObj);
    }

    const [filtersTotal, setFiltersTotal] = useState(() => {
        const savedFiltersTotal = parseInt(sessionStorage.getItem('filtersTotal'));
        return savedFiltersTotal ? savedFiltersTotal : 3; // 3 filters in default filters
    });
    useEffect(() => sessionStorage.setItem('filtersTotal', filtersTotal), [filtersTotal]);
    const updateFiltersTotal = (newFiltersTotal) => {
        setFiltersTotal(newFiltersTotal);
    };

    return (
        <SongsFilterContext.Provider value={{ filters, updateFilters, filtersTotal, updateFiltersTotal }}>
            { children }
        </SongsFilterContext.Provider>
    );
};

const TempSongsFilterContext = createContext();
export const useTempSongsFilter = () => useContext(TempSongsFilterContext);
export const TempFilterContextProvider = ({ children }) => {
    const { filters, updateFilters } = useSongsFilter();
    const [tempFilters, setTempFilters] = useState(filters);
    const clearedFilters = {
        orderBy: filters.orderBy,
        descending: filters.descending,
        total: 0,
        dateGThan: '',
        dateLThan: '',
        priceGThan: '',
        priceLThan: '',
        randomSeed: filters.randomSeed,
        ex: {
            genre: {
                names: [],
            },
            date: {
                dates: [],
                eventTimes: [],
            },
            location: {
                venues: [],
                hoods: [],
            },
            event: {
                names: [],
            },
            artist: {
                names: [],

            },
            album: {
                names: [],
            },
            song: {
                names: [],
                ids: [],
            },
            source: {
                spotify: false,
                youtube: false,
            },
        },
        req: {
            genre: {
                names: [],
                fromEach: null,
            },
            date: {
                dates: [],
                eventTimes: [],
            },
            location: {
                venues: [],
                hoods: [],
                addresses: [],
            },
            event: {
                names: [],
            },
            artist: {
                names: [],
                fromEach: null,
            },
            album: {
                names: [],
                fromEach: null,
            },
            song: {
                names: [],
            },
            source: {
                spotify: false,
                youtube: false,
            },
        },
    };


    const revertTempFilters = () => setTempFilters(filters);
    const clearFilters = () => setTempFilters(clearedFilters);
    const saveTempFilters = () => updateFilters(tempFilters);
    const updateTempFilters = (newFiltersObj) => {
        console.log(newFiltersObj)
        setTempFilters(newFiltersObj);
    }

    return (
        <TempSongsFilterContext.Provider value={{ tempFilters, updateTempFilters, clearFilters, saveTempFilters, revertTempFilters, }}>
            { children }
        </TempSongsFilterContext.Provider>
    );
}

export const OrderByBtn = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [ order, setOrder ] = useState(filters.orderBy)
    const [isOpen, setIsOpen] = useState(false);
    const openCloseModal = () => setIsOpen(!isOpen)

    useEffect(() => {
        switch(filters.orderBy){
            case OrderBys.SONG_NAME:
                setOrder('Song');
                break;
            case OrderBys.ARTIST:
                setOrder('Artist');
                break;
            case OrderBys.EVENT_DATE:
                setOrder('Event Date');
                break;
            default:
                setOrder('Random')
        }
    }, [filters.orderBy])

    const changeOrderBy = (option, desc) => updateFilters({
        ...filters,
        orderBy: option,
        descending: desc,
        randomSeed: option == OrderBys.RANDOM ? (Date.now() / 1000) % 1 : filters.seed
    });

    return (
        <div className='order-bys'>
            <button id='order-by-btn' onClick={openCloseModal}>Sort By: {order}</button>
            {isOpen && createPortal(
                <div className='order-by-modal-container'>
                    <div className='title'>
                        <h3>Sort By</h3>
                        <button onClick={openCloseModal}>x</button>
                    </div>
                    <div className='order-option'>
                        <p>Song</p>
                        <div>
                            <label>
                                <input
                                    type='radio'
                                    value='A-Z'
                                    checked={filters.orderBy == OrderBys.SONG_NAME && !filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.SONG_NAME, false)}
                                />
                                A-Z
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    value='Z-A'
                                    checked={filters.orderBy == OrderBys.SONG_NAME && filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.SONG_NAME, true)}
                                />
                                Z-A
                            </label>
                        </div>
                    </div>
                    <div className='order-option'>
                        <p>Artist</p>
                        <div>
                            <label>
                                <input
                                    type='radio'
                                    value='A-Z'
                                    checked={filters.orderBy == OrderBys.ARTIST && !filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.ARTIST, false)}
                                />
                                A-Z
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    value='Z-A'
                                    checked={filters.orderBy == OrderBys.ARTIST && filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.ARTIST, true)}
                                />
                                Z-A
                            </label>
                        </div>
                    </div>
                    <div className='order-option'>
                        <p>Event Date</p>
                        <div>
                            <label>
                                <input
                                    type='radio'
                                    value='Ascending'
                                    checked={filters.orderBy == OrderBys.EVENT_DATE && !filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.EVENT_DATE, false)}
                                />
                                Asc
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    value='Descending'
                                    checked={filters.orderBy == OrderBys.EVENT_DATE && filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.EVENT_DATE, true)}
                                />
                                Desc
                            </label>
                        </div>
                    </div>
                    <button className='order-random' onClick={() => changeOrderBy(OrderBys.RANDOM, false)}>Random</button>
                </div>,
                document.body
            )}
        </div>
    )
}
