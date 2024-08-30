import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';

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
        updateTempFilters({
            ...tempFilters,
            dateGThan: gThanDateInput
        });
        setGThanDateInput('')    
    }
    const reqLThanDate = () => {
        if(!lThanDateInput) return
        updateTempFilters({
            ...tempFilters,
            dateLThan: lThanDateInput
        });
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
        setTimeInput('')
    }
    // reqex filter tab funcs
    const removeGThanDate = () => {
        updateTempFilters({
            ...tempFilters,
            dateGThan: ''
        });
    }
    const removeLThanDate = () => {
        updateTempFilters({
            ...tempFilters,
            dateLThan: ''
        });
    }
    const removeReqDate = date => updateTempFilters({
        ...tempFilters, 
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
            label={'Date: '} value={date}
            onClickFunc={() => removeReqDate(date)}
        />
    );
    const exDates = tempFilters.ex.date.dates.map((date, index) => 
        <ReqExFilterTab 
            key={`exfilter-date${index}`}
            label={'Date: '} value={date}
            onClickFunc={() => removeExDate(date)}
        />
    );
    const reqTimes = tempFilters.req.date.eventTimes.map((time, index) =>
        <ReqExFilterTab
            key={`reqfilter-time${index}`}
            label={'Time: '} value={time}
            onClickFunc={() => removeReqTime(time)}
        />
    );
    const exTimes = tempFilters.ex.date.eventTimes.map((time, index) =>
        <ReqExFilterTab
            key={`reqfilter-time${index}`}
            label={'Time: '} value={time}
            onClickFunc={() => removeExTime(time)}
        />
    );

    const reqChildren = [
        (tempFilters.dateGThan && <ReqExFilterTab key={'reqfilter-gThan'} label={'After: '} value={tempFilters.dateGThan} onClickFunc={removeGThanDate}/>),
        (tempFilters.dateLThan && <ReqExFilterTab key={'reqfilter-lThan'}  label={'Before: '} value={tempFilters.dateLThan} onClickFunc={removeLThanDate}/>),
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