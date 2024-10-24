import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const OrderBys = Object.freeze({
    SONG_NAME: 1,
    EVENT_DATE: 2,
    VENUE_NAME: 3,
    RANDOM: 4,
    ARTIST: 5,
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
            },
            date: {
                dates: [],
                eventTimes: [],
            },
            location: {
                venues: [],
                hoods: [],
                addresses: [],
                fromEach: null,
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
    useEffect(() => {
        sessionStorage.setItem('filters', JSON.stringify(filters));
    }, [filters]);
    const updateFilters = (newFiltersObj) => {
        if(!newFiltersObj) return;
        setFilters(newFiltersObj);
    }

    return (
        <SongsFilterContext.Provider value={{ filters, updateFilters }}>
            { children }
        </SongsFilterContext.Provider>
    );
};

const TempSongsFilterContext = createContext();
export const useTempSongsFilter = () => useContext(TempSongsFilterContext);
export const TempFilterContextProvider = ({ children }) => {
    const { filters, updateFilters } = useSongsFilter();
    const [tempFilters, setTempFilters] = useState(filters);

    const revertTempFilters = () => setTempFilters(filters);
    const saveTempFilters = () => updateFilters(tempFilters);
    const updateTempFilters = (newFiltersObj) => {
        setTempFilters(newFiltersObj);
    }

    return (
        <TempSongsFilterContext.Provider value={{ tempFilters, updateTempFilters, revertTempFilters, saveTempFilters }}>
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
            case OrderBys.EVENT_DATE:
                setOrder('Event Date');
                break;
            case OrderBys.VENUE_NAME:
                setOrder('Venue');
                break;
            case OrderBys.ARTIST:
                setOrder('Artist');
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
                        <p>Venue</p>
                        <div>
                            <label>
                                <input
                                    type='radio'
                                    value='A-Z'
                                    checked={filters.orderBy == OrderBys.VENUE_NAME && !filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.VENUE_NAME, false)}
                                />
                                A-Z
                            </label>
                            <label>
                                <input
                                    type='radio'
                                    value='Z-A'
                                    checked={filters.orderBy == OrderBys.VENUE_NAME && filters.descending}
                                    onChange={() => changeOrderBy(OrderBys.VENUE_NAME, true)}
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
