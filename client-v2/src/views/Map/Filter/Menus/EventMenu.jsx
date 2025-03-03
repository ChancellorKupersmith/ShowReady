import React, { useState } from 'react';
import { useSongsFilter, useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const EventMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const { filtersTotal, updateFiltersTotal } = useSongsFilter();
    const [eventInput, setEventInput] = useState('');
    const [gPriceInput, setGPriceInput] = useState('');
    const [lPriceInput, setLPriceInput] = useState('');

    // input funcs
    const handleEventChange = (event) => setEventInput(event.target.value);
    const handleGPriceChange = (event) => {
        const formattedPrice = event.target.value.replace(/[^0-9.]/g, '');
        setGPriceInput(formattedPrice);
    }
    const handleLPriceChange = (event) => {
        const formattedPrice = event.target.value.replace(/[^0-9.]/g, '');
        setLPriceInput(formattedPrice);
    }
    // reqex btn funcs
    const reqEvent = () => {
        if(!eventInput) return;
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                event: {
                    ...tempFilters.req.event,
                    names: [...tempFilters.req.event.names, eventInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setEventInput('')
    }
    const exEvent = () => {
        if(!eventInput) return;
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                event: {
                    ...tempFilters.ex.event,
                    names: [...tempFilters.ex.event.names, eventInput]
                }
            }
        });
        updateFiltersTotal(filtersTotal + 1);
        setEventInput('')
    }
    const reqGPrice = () => {
        if(!gPriceInput) return;
        updateTempFilters({
            ...tempFilters,
            priceGThan: gPriceInput
        });
        const newTotal = tempFilters.priceGThan ? filtersTotal : filtersTotal + 1;
        updateFiltersTotal(newTotal);
        setGPriceInput('')
    }
    const reqLPrice = () => {
        if(!lPriceInput) return;
        updateTempFilters({
            ...tempFilters,
            priceLThan: lPriceInput
        });
        const newTotal = tempFilters.priceLThan ? filtersTotal : filtersTotal + 1;
        updateFiltersTotal(newTotal);
        setLPriceInput('')
    }
    // reqex filter tab funcs
    const removeReqEvent = (event) => {
        updateTempFilters({
            ...tempFilters,
            req: {
                ...tempFilters.req,
                event: {
                    ...tempFilters.req.event,
                    names: tempFilters.req.event.names.filter(v => v != event)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeExEvent = (event) => {
        updateTempFilters({
            ...tempFilters,
            ex: {
                ...tempFilters.ex,
                event: {
                    ...tempFilters.ex.event,
                    names: tempFilters.ex.event.names.filter(v => v != event)
                }
            }
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeReqGPrice = () => {
        updateTempFilters({
            ...tempFilters,
            priceGThan: ''
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const removeReqLPrice = () => {
        updateTempFilters({
            ...tempFilters,
            priceLThan: ''
        });
        updateFiltersTotal(filtersTotal - 1);
    };
    const reqEvents = tempFilters.req.event.names.map((event, index) =>
        <ReqExFilterTab 
            key={`reqfilter-event${index}`}
            reqex={'req'}
            label={'Event: '} value={event}
            onClickFunc={() => removeReqEvent(event)}
        />
    );
    const exEvents = tempFilters.ex.event.names.map((event, index) =>
        <ReqExFilterTab 
            key={`exfilter-event${index}`}
            reqex={'ex'}
            label={'Event: '} value={event}
            onClickFunc={() => removeExEvent(event)}
        />
    );

    const reqChildren = [
        (tempFilters.priceGThan && <ReqExFilterTab key={'reqfilter-gprice'} reqex={'req'} label={'Price >'} value={`$${tempFilters.priceGThan}`} onClickFunc={removeReqGPrice}/>),
        (tempFilters.priceLThan && <ReqExFilterTab key={'reqfilter-lprice'} reqex={'req'} label={'Price <'} value={`$${tempFilters.priceLThan}`} onClickFunc={removeReqLPrice}/>),
        ...reqEvents
    ];
    const exChildren = [...exEvents];

    return (
        <div className='filter-menu-x'>
            <div className='menu-inputs'>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='eventInput'>Event: </label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='eventInput'
                            value={eventInput}
                            onChange={handleEventChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' onClick={reqEvent}>Require</button>
                        <button className='reqex-btn ex-btn' onClick={exEvent}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='gThanDateInput'>{`Tickets >`}</label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='gPriceInput'
                            value={gPriceInput ? `$${gPriceInput}` : ''}
                            placeholder="$0.00"
                            onChange={handleGPriceChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn only' onClick={reqGPrice}>Require</button>
                    </div>
                </div>
                <div className='menu-input-container'>
                    <div className='menu-input'>
                        <label htmlFor='lThanDateInput'>{`Tickets <`}</label>
                        <input
                            className='reqex-input-container'
                            type='text'
                            id='lPriceInput'
                            value={lPriceInput ? `$${lPriceInput}` : ''}
                            placeholder="$0.00"
                            onChange={handleLPriceChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn only' onClick={reqLPrice}>Require</button>
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

export default EventMenu;