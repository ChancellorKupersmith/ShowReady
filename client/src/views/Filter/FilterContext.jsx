import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const SongsFilterContext = createContext();
export const useSongsFilter = () => useContext(SongsFilterContext);
export const FilterContextProvider = ({ children }) => {
    // TODO: Filter States to implement
    // - set # from each artist
    // - set # from each venue
    // - exclude / only address
    // - map marker area
    // - exclude / only albums
    const today = new Date();
    let monthFromToday = new Date();
    monthFromToday.setDate(today.getDate() + 30)
    const defaultFilters = {
        total: 2,
        dateGThan: formatDate(today),
        dateLThan: formatDate(monthFromToday),
        priceGThan: '',
        priceLThan: '',
        // spotifyPopularityGThan: '',
        // spotifyPopularityLThan: '',
        ex: {
            date: {
                dates: [],
                eventTimes: [],
            },
            location: {
                venues: [],
                hoods: [],
                // addresses: [],
            },
            event: {
                names: [],
                // ageRestrictions: [],
            },
            artist: {
                names: [],
                // fromEach: '',
                // musicbrainz meta
            },
            album: {
                names: [],
                // fromEach: '',
            },
            song: {
                names: [],
                ids: [],
            },
            source: {
                spotify: false,
                // youtube: false,
            },
        },
        req: {
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
                // ageRestrictions: [],
            },
            artist: {
                names: [],
                fromEach: '',
                // musicbrainz meta
            },
            album: {
                names: [],
                fromEach: '',
            },
            song: {
                names: [],
            },
            source: {
                spotify: false,
                // youtube: false,
            },
        },
    };
    const [filters, setFilters] = useState(defaultFilters);
    const updateFilters = (newFiltersObj) => {
        if(newFiltersObj){
            setFilters(newFiltersObj);
        }
    }

    return (
        <SongsFilterContext.Provider value={{ filters, updateFilters }}>
            { children }
        </SongsFilterContext.Provider>
    );
};

// Copy of filter state for filter menu
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