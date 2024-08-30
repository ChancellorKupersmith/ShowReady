import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const LocationMenu = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [venueInput, setVenueInput] = useState('');
    const [hoodInput, setHoodInput] = useState('');
    // input funcs
    const handleVenueChange = (event) => setVenueInput(event.target.value);
    const handleHoodChange = (event) => setHoodInput(event.target.value);
    // reqex btn funcs
    const reqVenue = () => {
        if(!venueInput) return;
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                location: {
                    ...filters.req.location,
                    venues: [...filters.req.location.venues, venueInput]
                }
            }
        });
        setVenueInput('')
    }
    const exVenue = () => {
        if(!venueInput) return;
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                location: {
                    ...filters.ex.location,
                    venues: [...filters.ex.location.venues, venueInput]
                }
            }
        });
        setVenueInput('')
    }
    const reqHood = () => {
        if(!hoodInput) return;
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                location: {
                    ...filters.req.location,
                    hoods: [...filters.req.location.hoods, hoodInput]
                }
            }
        });
        setHoodInput('')
    }
    const exHood = () => {
        if(!hoodInput) return;
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                location: {
                    ...filters.ex.location,
                    hoods: [...filters.ex.location.hoods, hoodInput]
                }
            }
        });
        setHoodInput('')
    }
    // reqex filter tab funcs
    const removeReqVenue = (venue) => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            location: {
                ...filters.req.location,
                venues: filters.req.location.venues.filter(v => v != venue)
            }
        }
    });
    const removeExVenue = (venue) => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            location: {
                ...filters.ex.location,
                venues: filters.ex.location.venues.filter(v => v != venue)
            }
        }
    });
    const removeReqHood = (hood) => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            location: {
                ...filters.req.location,
                hoods: filters.req.location.hoods.filter(h => h != hood)
            }
        }
    });
    const removeExHood = (hood) => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            location: {
                ...filters.ex.location,
                hoods: filters.ex.location.hoods.filter(h => h != hood)
            }
        }
    });
    const reqVenues = filters.req.location.venues.map((venue, index) =>
        <ReqExFilterTab 
            key={`reqfilter-venue${index}`}
            label={'Venue: '} value={venue}
            onClickFunc={() => removeReqVenue(venue)}
        />
    );
    const exVenues = filters.ex.location.venues.map((venue, index) =>
        <ReqExFilterTab 
            key={`exfilter-venue${index}`}
            label={'Venue: '} value={venue}
            onClickFunc={() => removeExVenue(venue)}
        />
    );
    const reqHoods = filters.req.location.hoods.map((hood, index) =>
        <ReqExFilterTab 
            key={`reqfilter-hood${index}`}
            label={'Hood: '} value={hood}
            onClickFunc={() => removeReqHood(hood)}
        />
    );
    const exHoods = filters.ex.location.hoods.map((hood, index) =>
        <ReqExFilterTab 
            key={`exfilter-hood${index}`}
            label={'Hood: '} value={hood}
            onClickFunc={() => removeExHood(hood)}
        />
    );

    const reqChildren = [...reqVenues, ...reqHoods];
    const exChildren = [...exVenues, ...exHoods];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='venueInput'>Venue: </label>
                        <input
                            type='text'
                            id='venueInput'
                            value={venueInput}
                            onChange={handleVenueChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqVenue}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exVenue}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='hoodInput'>Hood: </label>
                        <input
                            type='text'
                            id='hoodInput'
                            value={hoodInput}
                            onChange={handleHoodChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqHood}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exHood}>Exclude</button>
                    </div>
                </div>
            </div>

            <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
        </div>
    );
}

export default LocationMenu;