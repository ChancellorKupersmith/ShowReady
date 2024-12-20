import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
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
            total: tempFilters.total + 1,
            req: {
                ...tempFilters.req,
                date: {
                    ...tempFilters.req.date,
                    dates: [...tempFilters.req.date.dates, dateInput]
                }
            }
        });
        setDateInput('')
    }
    const exDate = () => {
        if(!dateInput) return
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1, 
            ex: {
                ...tempFilters.ex,
                date: {
                    ...tempFilters.ex.date,
                    dates: [...tempFilters.ex.date.dates, dateInput]
                }
            }
        });
        setDateInput('')
    }
    const reqGThanDate = () => {
        if(!gThanDateInput) return
        const newTotal = tempFilters.dateGThan ? tempFilters.total : tempFilters.total + 1;
        updateTempFilters({
            ...tempFilters,
            total: newTotal,
            dateGThan: gThanDateInput
        });
        setGThanDateInput('')
    }
    const reqLThanDate = () => {
        if(!lThanDateInput) return
        const newTotal = tempFilters.dateLThan ? tempFilters.total : tempFilters.total + 1;
        updateTempFilters({
            ...tempFilters,
            total: newTotal,
            dateLThan: lThanDateInput
        });
        setLThanDateInput('')
    }
    const reqTime = () => {
        if(!timeInput) return
        updateTempFilters({
            ...tempFilters, 
            total: tempFilters.total + 1,
            req: {
                ...tempFilters.req,
                date: {
                    ...tempFilters.req.date,
                    eventTimes: [...tempFilters.req.date.eventTimes, timeInput]
                }
            }
        });
        setTimeInput('')
    }
    const exTime = () => {
        if(!timeInput) return
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total + 1,
            ex: {
                ...tempFilters.ex,
                date: {
                    ...tempFilters.ex.date,
                    eventTimes: [...tempFilters.ex.date.eventTimes, timeInput]
                }
            }
        });
        setTimeInput('')
    }
    // reqex filter tab funcs
    const removeGThanDate = () => {
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total - 1,
            dateGThan: ''
        });
    }
    const removeLThanDate = () => {
        updateTempFilters({
            ...tempFilters,
            total: tempFilters.total - 1,
            dateLThan: ''
        });
    }
    const removeReqDate = date => updateTempFilters({
        ...tempFilters, 
        total: tempFilters.total - 1,
        req: {
            ...tempFilters.req,
            date: {
                ...tempFilters.req.date,
                dates: tempFilters.req.date.dates.filter(d => d != date)
            }
        }
    });
    const removeExDate = date => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1, 
        ex: {
            ...tempFilters.ex,
            date: {
                ...tempFilters.ex.date,
                dates: tempFilters.ex.date.dates.filter(d => d != date)
            }
        }
    });
    const removeReqTime = time => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        req: {
            ...tempFilters.req,
            date: {
                ...tempFilters.req.date,
                eventTimes: tempFilters.req.date.eventTimes.filter(t => t != time)
            }
        }
    });
    const removeExTime = time => updateTempFilters({
        ...tempFilters,
        total: tempFilters.total - 1,
        ex: {
            ...tempFilters.ex,
            date: {
                ...tempFilters.ex.date,
                eventTimes: tempFilters.ex.date.eventTimes.filter(t => t != time)
            }
        }
    });
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