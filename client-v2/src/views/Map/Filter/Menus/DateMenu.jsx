import React, { useState } from 'react';
import { useSongsFilter, useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';

export const displayDate = (date) => {
    if(date.length == 24){
        const [ ymd, time ] = date.split('T');
        date = ymd;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new Error('Invalid date format. Please use YYYY-MM-DD format.');
    }
    const [year, month, day] = date.split('-');
    return `${month}/${day}/${year.slice(-2)}`;
}

const DateMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const { filtersTotal, updateFiltersTotal } = useSongsFilter();
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
        if(!dateInput) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                date: {
                    ...tempFilters.req.date,
                    dates: [...tempFilters.req.date.dates, dateInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setDateInput('')
    }
    const exDate = () => {
        if(!dateInput) return
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                date: {
                    ...tempFilters.ex.date,
                    dates: [...tempFilters.ex.date.dates, dateInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setDateInput('')
    }
    const reqGThanDate = () => {
        if(!gThanDateInput) return
        updateTempFilters({
            ...tempFilters,
            dateGThan: gThanDateInput
        });
        const newTotal = tempFilters.dateGThan ? filtersTotal : filtersTotal + 1;
        updateFiltersTotal(newTotal);
        setGThanDateInput('')
    }
    const reqLThanDate = () => {
        if(!lThanDateInput) return
        updateTempFilters({
            ...tempFilters,
            dateLThan: lThanDateInput
        });
        const newTotal = tempFilters.dateLThan ? filtersTotal : filtersTotal + 1;
        updateFiltersTotal(newTotal);
        setLThanDateInput('')
    }
    const reqTime = () => {
        if(!timeInput) return
        updateTempFilters({
            ...tempFilters, 
            req: {
                ...tempFilters.req,
                date: {
                    ...tempFilters.req.date,
                    eventTimes: [...tempFilters.req.date.eventTimes, timeInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setTimeInput('')
    }
    const exTime = () => {
        if(!timeInput) return
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                date: {
                    ...tempFilters.ex.date,
                    eventTimes: [...tempFilters.ex.date.eventTimes, timeInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setTimeInput('')
    }
    // reqex filter tab funcs
    const removeGThanDate = () => {
        updateTempFilters({
            ...tempFilters,
            dateGThan: ''
        });
        updateFiltersTotal(filtersTotal - 1);
    }
    const removeLThanDate = () => {
        updateTempFilters({
            ...tempFilters,
            dateLThan: ''
        });
        updateFiltersTotal(filtersTotal - 1);

    }
    const removeReqDate = date => {
        updateTempFilters({
            ...tempFilters, 
            req: {
                ...tempFilters.req,
                date: {
                    ...tempFilters.req.date,
                    dates: tempFilters.req.date.dates.filter(d => d != date)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeExDate = date => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                date: {
                    ...tempFilters.ex.date,
                    dates: tempFilters.ex.date.dates.filter(d => d != date)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeReqTime = time => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                date: {
                    ...tempFilters.req.date,
                    eventTimes: tempFilters.req.date.eventTimes.filter(t => t != time)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeExTime = time => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                date: {
                    ...tempFilters.ex.date,
                    eventTimes: tempFilters.ex.date.eventTimes.filter(t => t != time)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const reqDates = tempFilters.req.date.dates.map((date, index) => 
        <ReqExFilterTab 
            key={`reqfilter-date${index}`}
            reqex={'req'}
            label={'Date: '} value={displayDate(date)}
            onClickFunc={() => removeReqDate(date)}
        />
    );
    const exDates = tempFilters.ex.date.dates.map((date, index) => 
        <ReqExFilterTab 
            key={`exfilter-date${index}`}
            reqex={'ex'}
            label={'Date: '} value={displayDate(date)}
            onClickFunc={() => removeExDate(date)}
        />
    );
    const reqTimes = tempFilters.req.date.eventTimes.map((time, index) =>
        <ReqExFilterTab
            key={`reqfilter-time${index}`}
            reqex={'req'}
            label={'Time: '} value={time}
            onClickFunc={() => removeReqTime(time)}
        />
    );
    const exTimes = tempFilters.ex.date.eventTimes.map((time, index) =>
        <ReqExFilterTab
            key={`reqfilter-time${index}`}
            reqex={'ex'}
            label={'Time: '} value={time}
            onClickFunc={() => removeExTime(time)}
        />
    );

    const reqChildren = [
        (tempFilters.dateGThan && <ReqExFilterTab key={'reqfilter-gThan'} reqex={'req'} label={'After: '} value={displayDate(tempFilters.dateGThan)} onClickFunc={removeGThanDate}/>),
        (tempFilters.dateLThan && <ReqExFilterTab key={'reqfilter-lThan'} reqex={'req'} label={'Before: '} value={displayDate(tempFilters.dateLThan)} onClickFunc={removeLThanDate}/>),
        ...reqDates,
        ...reqTimes
    ];
    const exChildren = [...exDates, ...exTimes];
    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='datesInput'>Event Date: </label>
                        <input
                            className='reqex-input-container'
                            type='date'
                            id='datesInput'
                            value={dateInput}
                            onChange={handleDateChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqDate}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exDate}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='gThanDateInput'>Events After: </label>
                        <input
                            className='reqex-input-container'
                            type='date'
                            id='gThanDateInput'
                            value={gThanDateInput}
                            onChange={handleGThanDateChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn only' onClick={reqGThanDate}>Require</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='lThanDateInput'>Events Before: </label>
                        <input
                            className='reqex-input-container'
                            type='date'
                            id='lThanDateInput'
                            value={lThanDateInput}
                            onChange={handleLThanDateChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn only' onClick={reqLThanDate}>Require</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='timesInput'>Event Times: </label>
                        <input
                            className='reqex-input-container'
                            type='time'
                            id='timesInput'
                            value={timeInput}
                            onChange={handleTimeChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqTime}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exTime}>Exclude</button>
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

export default DateMenu;