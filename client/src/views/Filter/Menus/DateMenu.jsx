import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';

const DateMenu = () => {
    const { filters, updateFilters } = useSongsFilter();
    const [dateInput, setDateInput] = useState('');
    const [gThanDateInput, setGThanDateInput] = useState('');
    const [lThanDateInput, setLThanDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('');
    // input funcs
    const handleDateChange = (event) => setDateInput(event.target.value);
    const handleGThanDateChange = (event) => setGThanDateInput(event.target.value);
    const handleLThanDateChange = (event) => setLThanDateInput(event.target.value);
    const handleTimeChange = (event) => setTimeInput(event.target.value);
    // reqex btn funcs
    const reqDate = () => {
        if(!dateInput) return
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                date: {
                    ...filters.req.date,
                    dates: [...filters.req.date.dates, dateInput]
                }
            }
        });
        setDateInput('')
    }
    const exDate = () => {
        if(!dateInput) return
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                date: {
                    ...filters.ex.date,
                    dates: [...filters.ex.date.dates, dateInput]
                }
            }
        });
        setDateInput('')
    }
    const reqGThanDate = () => {
        if(!gThanDateInput) return
        updateFilters({
            ...filters,
            dateGThan: gThanDateInput
        });
        setGThanDateInput('')    
    }
    const reqLThanDate = () => {
        if(!lThanDateInput) return
        updateFilters({
            ...filters,
            dateLThan: lThanDateInput
        });
        setLThanDateInput('')
    }
    const reqTime = () => {
        if(!timeInput) return
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                date: {
                    ...filters.req.date,
                    eventTimes: [...filters.req.date.eventTimes, timeInput]
                }
            }
        });
        setTimeInput('')
    }
    const exTime = () => {
        if(!timeInput) return
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                date: {
                    ...filters.ex.date,
                    eventTimes: [...filters.ex.date.eventTimes, timeInput]
                }
            }
        });
        setTimeInput('')
    }
    // reqex filter tab funcs
    const removeGThanDate = () => {
        updateFilters({
            ...filters,
            dateGThan: ''
        });
    }
    const removeLThanDate = () => {
        updateFilters({
            ...filters,
            dateLThan: ''
        });
    }
    const removeReqDate = date => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            date: {
                ...filters.req.date,
                dates: filters.req.date.dates.filter(d => d != date)
            }
        }
    });
    const removeExDate = date => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            date: {
                ...filters.ex.date,
                dates: filters.ex.date.dates.filter(d => d != date)
            }
        }
    });
    const removeReqTime = time => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            date: {
                ...filters.req.date,
                eventTimes: filters.req.date.eventTimes.filter(t => t != time)
            }
        }
    });
    const removeExTime = time => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            date: {
                ...filters.ex.date,
                eventTimes: filters.ex.date.eventTimes.filter(t => t != time)
            }
        }
    });
    const reqDates = filters.req.date.dates.map((date, index) => 
        <ReqExFilterTab 
            keyVal={`reqfilter-date${index}`}
            label={'Date: '} value={date}
            onClickFunc={() => removeReqDate(date)}
        />
    );
    const exDates = filters.ex.date.dates.map((date, index) => 
        <ReqExFilterTab 
            keyVal={`exfilter-date${index}`}
            label={'Date: '} value={date}
            onClickFunc={() => removeExDate(date)}
        />
    );
    const reqTimes = filters.req.date.eventTimes.map((time, index) =>
        <ReqExFilterTab
            keyVal={`reqfilter-time${index}`}
            label={'Time: '} value={time}
            onClickFunc={() => removeReqTime(time)}
        />
    );
    const exTimes = filters.ex.date.eventTimes.map((time, index) =>
        <ReqExFilterTab
            keyVal={`reqfilter-time${index}`}
            label={'Time: '} value={time}
            onClickFunc={() => removeExTime(time)}
        />
    );

    const reqChildren = [
        (filters.dateGThan && <ReqExFilterTab keyVal={'reqfilter-gThan'} label={'After: '} value={filters.dateGThan} onClickFunc={removeGThanDate}/>),
        (filters.dateLThan && <ReqExFilterTab keyVal={'reqfilter-lThan'}  label={'Before: '} value={filters.dateLThan} onClickFunc={removeLThanDate}/>),
        ...reqDates,
        ...reqTimes
    ];
    const exChildren = [...exDates, ...exTimes];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='datesInput'>Event Date: </label>
                        <input
                            type='date'
                            id='datesInput'
                            value={dateInput}
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqDate}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exDate}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='gThanDateInput'>Events After: </label>
                        <input
                            type='date'
                            id='gThanDateInput'
                            value={gThanDateInput}
                            onChange={handleGThanDateChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '100%'}} onClick={reqGThanDate}>Require</button>
                    </div>
                </div>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='lThanDateInput'>Events Before: </label>
                        <input
                            type='date'
                            id='lThanDateInput'
                            value={lThanDateInput}
                            onChange={handleLThanDateChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '100%'}} onClick={reqLThanDate}>Require</button>
                    </div>
                </div>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='timesInput'>Event Times: </label>
                        <input
                            type='time'
                            id='timesInput'
                            value={timeInput}
                            onChange={handleTimeChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqTime}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exTime}>Exclude</button>
                    </div>
                </div>
            </div>

            <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
        </div>
    );
}

export default DateMenu;