import { useSongsFilter } from "./FilterContext";
import { useState } from "react";

const ExcludeRequireBtn = ({clssName, filterFunc}) => {
    return (
        <span className={`neuomorphic-btn ${clssName}`} onClick={filterFunc}>
            { clssName == 'ex-btn' ? 'Exclude' : 'Require' }
        </span>
    );
};

const ExcludeRequireInput = ({ children, filterFunc }) => {
    return (
        <div className="neuomorphic-input">
            { children }
            <div style={{
                    // border: '5px solid green',
                    display: 'flex',
                    width: '100%',
            }}>
                <ExcludeRequireBtn clssName={'require-btn'} filterFunc={() => filterFunc('require-btn')}/>
                <ExcludeRequireBtn clssName={'ex-btn'} filterFunc={() => filterFunc('ex-btn')}/>
            </div>
        </div>
    );
};
// TODO: Make Date-range and single date interchangable 

const ExReqDate = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [dayOrRange, toggleDayOrRange] = useState(true);
    const handleDayOrRangeChange = () => toggleDayOrRange(!dayOrRange);
    const [minDate, setMinDate] = useState(filters.minDate);
    const handleMinDateChange = (e) => setMinDate(e.target.value);
    const [maxDate, setMaxDate] = useState(filters.maxDate);
    const handleMaxDateChange = (e) => setMaxDate(e.target.value);
    const [date, setDate] = useState('');
    const handleDateChange = (e) => setDate(e.target.value);

    const filterFunc = (clssName) => {
        if(dayOrRange){
            if(clssName == 'ex-btn' && date != '') {
                updateFilters({
                    ...filters, 
                    ex: {
                        ...filters.ex,
                        minDate: minDate,
                        maxDate: maxDate,
                    }
                });
            }
            if(clssName == 'require-btn' && date != '') {
                updateFilters({
                    ...filters, 
                    req: {
                        ...filters.req,
                        minDate: minDate,
                        maxDate: maxDate,
                    }
                });
            }
            setMinDate('');
            setMaxDate('');
        }
        else {
            if(clssName == 'ex-btn' && date != '') {
                updateFilters({
                    ...filters, 
                    ex: {
                        ...filters.ex,
                        dates: [...filters.ex.dates, date]
                    }
                });
            }
            if(clssName == 'require-btn' && date != '') {
                updateFilters({
                    ...filters, 
                    req: {
                        ...filters.req,
                        dates: [...filters.req.dates, date]
                    }
                });
            }
        }
        setDate('');
    };

    return (
        <ExcludeRequireInput filterFunc={filterFunc}>
            <div className="exreq-date-container" style={{display: 'flex'}}>
                <div className="exreq-date-label">
                    <label className="input-label" htmlFor="ExReqDateInput">{ dayOrRange ? "Date" : "Date Range" }</label>
                    <button className="exreq-date-switch" onClick={handleDayOrRangeChange}>switch</button>
                </div>
            </div>
            { dayOrRange ?
                ( // Day
                    <div style={{width: '100%', display: 'flex'}}>
                        <input style={{width: "100%"}} id="ExReqDateInput" type="date" value={date} onChange={handleDateChange} />
                    </div>
                ) :
                ( // Date Range
                    <div style={{display: 'flex', width: '100%'}}>
                        <div style={{ display:'flex', flex: '1'}}>
                            <label style={{padding: '10px', color: 'white',}} htmlFor="minDateInput">Min:</label>
                            <input id="minDateInput" type="date" value={minDate} onChange={handleMinDateChange} />
                        </div>
                        <div style={{display:'flex', flex: '1'}}>
                            <label style={{padding: '10px', color: 'white',}} htmlFor="maxDateInput">Max:</label>
                            <input id="maxDateInput" type="date" value={maxDate} onChange={handleMaxDateChange} />
                        </div>
                    </div>
                ) 
            }
        </ExcludeRequireInput>
    );
};

const ExReqArtist = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [artistName, setArtistName] = useState('');
    const handleArtistChange = (e) => setArtistName(e.target.value);
    const filterFunc = (clssName) => {
        if(clssName == 'ex-btn' && artistName != '') {
            updateFilters({
                ...filters, 
                ex: {
                    ...filters.ex,
                    artists: [...filters.ex.artists, artistName]
                }
            });
        }
        if(clssName == 'require-btn' && artistName != '') {
            updateFilters({
                ...filters, 
                req: {
                    ...filters.req,
                    artists: [...filters.req.artists, artistName]
                }
            });
        }
        setArtistName('');
    };
    return (
        <ExcludeRequireInput filterFunc={filterFunc}>
            <label className="input-label" htmlFor="ExReqArtistInput">Artist</label>
            <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                <input className="exreq-input" id="ExReqArtistInput" type="text" value={artistName} onChange={handleArtistChange} />
            </div>
        </ExcludeRequireInput>
    ); 
};

const ExReqVenue = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [venueName, setVenueName] = useState('');
    const handleVenueChange = (e) => setVenueName(e.target.value);
    const filterFunc = (clssName) => {
        if(clssName == 'ex-btn' && venueName != '') {
            updateFilters({
                ...filters, 
                ex: {
                    ...filters.ex,
                    venues: [...filters.ex.venues, venueName]
                }
            });
        }
        if(clssName == 'require-btn' && venueName != '') {
            updateFilters({
                ...filters, 
                req: {
                    ...filters.req,
                    venues: [...filters.req.venues, venueName]
                }
            });
        }
        setVenueName('');
    };
    return (
        <ExcludeRequireInput filterFunc={filterFunc}>
            <label className="input-label" htmlFor="ExReqVenueInput">Venue</label>
            <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                <input className="exreq-input" id="ExReqVenueInput" type="text" value={venueName} onChange={handleVenueChange} />
            </div>
        </ExcludeRequireInput>
    ); 
};

const ExReqSong = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [songName, setSongName] = useState('');
    const handleSongChange = (e) => setSongName(e.target.value);
    const filterFunc = (clssName) => {
        if(clssName == 'ex-btn' && songName != '') {
            updateFilters({
                ...filters, 
                ex: {
                    ...filters.ex,
                    songs: [...filters.ex.songs, songName]
                }
            });
        }
        if(clssName == 'require-btn' && songName != '') {
            updateFilters({
                ...filters, 
                req: {
                    ...filters.req,
                    songs: [...filters.req.songs, songName]
                }
            });
        }
        setSongName('');
    };
    return (
        <ExcludeRequireInput filterFunc={filterFunc}>
            <label className="input-label" htmlFor="ExReqSongInput">Song</label>
            <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                <input className="exreq-input" id="ExReqSongInput" type="text" value={songName} onChange={handleSongChange} />
            </div>
        </ExcludeRequireInput>
    ); 
};

const ExReqHood = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [hoodName, setHoodName] = useState('');
    const handleHoodChange = (e) => setHoodName(e.target.value);
    const filterFunc = (clssName) => {
        if(clssName == 'ex-btn' && hoodName != '') {
            updateFilters({
                ...filters, 
                ex: {
                    ...filters.ex,
                    hoods: [...filters.ex.hoods, hoodName]
                }
            });
        }
        if(clssName == 'require-btn' && hoodName != '') {
            updateFilters({
                ...filters, 
                req: {
                    ...filters.req,
                    hoods: [...filters.req.hoods, hoodName]
                }
            });
        }
        setHoodName('');
    };
    return (
        <ExcludeRequireInput filterFunc={filterFunc}>
            <label className="input-label" htmlFor="ExReqHoodInput">Neighborhood</label>
            <div style={{width: '100%', display: 'flex', justifyContent: 'center'}}>
                <input className="exreq-input" id="ExReqHoodInput" type="text" value={hoodName} onChange={handleHoodChange} />
            </div>
        </ExcludeRequireInput>
    ); 
};

const FilterInput = () => {
    // // Filter State   
    // // Number of songs per artist
    // // number of songs per venue
    return (
        <div className="filter-inputs modal-content">
            <h2 className="filter-title">Filters</h2>
            <ExReqDate />
            <ExReqArtist />
            <ExReqVenue />
            <ExReqHood />
            <ExReqSong />
        </div>
    );
};


export default FilterInput;