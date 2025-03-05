import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const LocationMenu = () => {
    const { tempFilters, updateTempFilters, tempFiltersTotal, updateTempFiltersTotal } = useSongsFilter();
    const [venueInput, setVenueInput] = useState('');
    const [hoodInput, setHoodInput] = useState('');
    // input funcs
    const handleVenueChange = (event) => setVenueInput(event.target.value);
    const handleHoodChange = (event) => setHoodInput(event.target.value);
    // reqex btn funcs
    const reqVenue = () => {
        if(!venueInput) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                location: {
                    ...tempFilters.req.location,
                    venues: [...tempFilters.req.location.venues, venueInput]
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal + 1);
        setVenueInput('');
    }
    const exVenue = () => {
        if(!venueInput) return;
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                location: {
                    ...tempFilters.ex.location,
                    venues: [...tempFilters.ex.location.venues, venueInput]
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal + 1);
        setVenueInput('');
    }
    const reqHood = () => {
        if(!hoodInput) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                location: {
                    ...tempFilters.req.location,
                    hoods: [...tempFilters.req.location.hoods, hoodInput]
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal + 1);
        setHoodInput('')
    }
    const exHood = () => {
        if(!hoodInput) return;
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                location: {
                    ...tempFilters.ex.location,
                    hoods: [...tempFilters.ex.location.hoods, hoodInput]
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal + 1);
        setHoodInput('')
    }
    // reqex filter tab funcs
    const removeReqVenue = (venue) => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                location: {
                    ...tempFilters.req.location,
                    venues: tempFilters.req.location.venues.filter(v => v != venue)
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal - 1);
    };
    const removeExVenue = (venue) => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                location: {
                    ...tempFilters.ex.location,
                    venues: tempFilters.ex.location.venues.filter(v => v != venue)
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal - 1);
    };
    const removeReqHood = (hood) => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                location: {
                    ...tempFilters.req.location,
                    hoods: tempFilters.req.location.hoods.filter(h => h != hood)
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal - 1);
    };
    const removeExHood = (hood) => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                location: {
                    ...tempFilters.ex.location,
                    hoods: tempFilters.ex.location.hoods.filter(h => h != hood)
                }
            }
        });
        updateTempFiltersTotal(tempFiltersTotal - 1);
    };
    const reqVenues = tempFilters.req.location.venues.map((venue, index) =>
        <ReqExFilterTab 
            key={`reqfilter-venue${index}`}
            reqex={'req'}
            label={'Venue: '} value={venue}
            onClickFunc={() => removeReqVenue(venue)}
        />
    );
    const exVenues = tempFilters.ex.location.venues.map((venue, index) =>
        <ReqExFilterTab 
            key={`exfilter-venue${index}`}
            reqex={'ex'}
            label={'Venue: '} value={venue}
            onClickFunc={() => removeExVenue(venue)}
        />
    );
    const reqHoods = tempFilters.req.location.hoods.map((hood, index) =>
        <ReqExFilterTab 
            key={`reqfilter-hood${index}`}
            reqex={'req'}
            label={'Hood: '} value={hood}
            onClickFunc={() => removeReqHood(hood)}
        />
    );
    const exHoods = tempFilters.ex.location.hoods.map((hood, index) =>
        <ReqExFilterTab 
            key={`exfilter-hood${index}`}
            reqex={'ex'}
            label={'Hood: '} value={hood}
            onClickFunc={() => removeExHood(hood)}
        />
    );

    const reqChildren = [...reqVenues, ...reqHoods];
    const exChildren = [...exVenues, ...exHoods];

    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='venueInput'>Venue: </label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='venueInput'
                            value={venueInput}
                            onChange={handleVenueChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqVenue}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exVenue}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='hoodInput'>Hood: </label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='hoodInput'
                            value={hoodInput}
                            onChange={handleHoodChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqHood}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exHood}>Exclude</button>
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

export default LocationMenu;