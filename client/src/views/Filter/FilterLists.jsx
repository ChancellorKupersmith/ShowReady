import { useSongsFilter } from "./FilterContext";
import { useState } from "react";

// const defaultFilters = {
//     ex: {
//         minDate: '',
//         maxDate:'',
//         dates: [],
//         artists: [],
//         venues: [],
//         songs: [],
//         hoods: [],
//     },
//     req: {
//         minDate: formatDate(today),
//         maxDate: formatDate(monthFromToday),
//         dates: [],
//         artists: [],
//         venues: [],
//         songs: [],
//         hoods: [],
//     },
// };

const ReqList = () => {
    const { filters, updateFilters } = useSongsFilter();
    const removeDate = date => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            dates: filters.req.dates.filter(d => d != date)
        }
    })
    const dates = filters.req.dates.map((date, index) => (
        <div key={`reqfilter-date${index}`}>
                <span>Date:</span>
                <span>{date}</span>
                <button onClick={() => removeDate(date)}>X</button>
            </div>
        )
    );
    const removeArtist= artist => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            artists: filters.req.artists.filter(a => a != artist)
        }
    })
    const artists = filters.req.artists.map((artist, index) => (
            <div key={`reqfilter-artist${index}`}>
                <span>Artist:</span>
                <span>{artist}</span>
                <button onClick={() => removeArtist(artist)}>X</button>
            </div>
        )
    );
    const removeVenue= venue => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            venues: filters.req.venues.filter(v => v != venue)
        }
    })
    const venues = filters.req.venues.map((venue, index) => (
            <div key={`reqfilter-venue${index}`}>
                <span>Venue:</span>
                <span>{venue}</span>
                <button onClick={() => removeVenue(venue)}>X</button>
            </div>
        )
    );
    const removeSong= song => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            songs: filters.req.songs.filter(v => v != song)
        }
    })
    const songs = filters.req.songs.map((song, index) => (
            <div key={`reqfilter-song${index}`}>
                <span>Song:</span>
                <span>{song}</span>
                <button onClick={() => removeSong(song)}>X</button>
            </div>
        )
    );
    const removeHood= hood => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            hoods: filters.req.hoods.filter(v => v != hood)
        }
    })
    const hoods = filters.req.hoods.map((hood, index) => (
            <div key={`reqfilter-hood${index}`}>
                <span>Hood:</span>
                <span>{hood}</span>
                <button onClick={() => removeHood(hood)}>X</button>
            </div>
        )
    );
    
    return (
        <div className="reqex-list-container"
            style={{
                backgroundColor: '#3b694e'
            }}
        >
            <p>Requiring</p>
            <div className="reqfilters-list">
                {dates}
                {artists}
                {venues}
                {songs}
                {hoods}
            </div>
        </div>
    );
};


const ExList = () => {
    const { filters, updateFilters } = useSongsFilter();
    const removeDate = date => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            dates: filters.ex.dates.filter(d => d != date)
        }
    })
    const dates = filters.ex.dates.map((date, index) => (
        <div key={`exfilter-date${index}`}>
                <span>Date:</span>
                <span>{date}</span>
                <button onClick={() => removeDate(date)}>X</button>
            </div>
        )
    );
    const removeArtist= artist => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            artists: filters.ex.artists.filter(a => a != artist)
        }
    })
    const artists = filters.ex.artists.map((artist, index) => (
            <div key={`exfilter-artist${index}`}>
                <span>Artist:</span>
                <span>{artist}</span>
                <button onClick={() => removeArtist(artist)}>X</button>
            </div>
        )
    );
    const removeVenue= venue => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            venues: filters.ex.venues.filter(v => v != venue)
        }
    })
    const venues = filters.ex.venues.map((venue, index) => (
            <div key={`exfilter-venue${index}`}>
                <span>Venue:</span>
                <span>{venue}</span>
                <button onClick={() => removeVenue(venue)}>X</button>
            </div>
        )
    );
    const removeSong= song => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            songs: filters.ex.songs.filter(v => v != song)
        }
    })
    const songs = filters.ex.songs.map((song, index) => (
            <div key={`exfilter-song${index}`}>
                <span>Song:</span>
                <span>{song}</span>
                <button onClick={() => removeSong(song)}>X</button>
            </div>
        )
    );
    const removeHood= hood => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            hoods: filters.ex.hoods.filter(v => v != hood)
        }
    })
    const hoods = filters.ex.hoods.map((hood, index) => (
            <div key={`exfilter-hood${index}`}>
                <span>Hood:</span>
                <span>{hood}</span>
                <button onClick={() => removeHood(hood)}>X</button>
            </div>
        )
    );
    
    return (
        <div className="reqex-list-container" 
            style={{
                backgroundColor: '#da3a34'
            }}
        >
            <p>Excluding</p>
            <div className="exfilters-list">
                {dates}
                {artists}
                {venues}
                {songs}
                {hoods}
            </div>
        </div>
    );
};

const FilterLists = () => {
    return (
        <div className="modal-content" style={{
                borderTop: '1px solid black',
                flex: '1',
                display: 'flex',
            }}>
            <h2 className="filter-title">Current Filters</h2>
            <div className="filter-lists">
                <ReqList />
                <ExList />
            </div>
        </div>
    );
};


export default FilterLists;