import React, { createContext, useContext, useState } from 'react';

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
        ex: {
            minDate: '',
            maxDate:'',
            dates: [],
            artists: [],
            venues: [],
            songs: [],
            hoods: [],
        },
        req: {
            minDate: formatDate(today),
            maxDate: formatDate(monthFromToday),
            dates: [],
            artists: [],
            venues: [],
            songs: [],
            hoods: [],
        },
    };
    const [filters, setFilters] = useState(defaultFilters);
    console.log(filters)
    const updateFilters = (newFiltersObj) => {
        setFilters(newFiltersObj);
        console.log(filters)
    }

    return (
        <SongsFilterContext.Provider value={{ filters, updateFilters }}>
            { children }
        </SongsFilterContext.Provider>
    );
};
