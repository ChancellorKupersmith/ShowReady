import React, { useState } from 'react';
import { useSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const EventMenu = () => {
    const { filters, updateFilters } = useSongsFilter();
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
        updateFilters({
            ...filters, 
            req: {
                ...filters.req,
                event: {
                    ...filters.req.event,
                    names: [...filters.req.event.names, eventInput]
                }
            }
        });
        setEventInput('')
    }
    const exEvent = () => {
        if(!eventInput) return;
        updateFilters({
            ...filters, 
            ex: {
                ...filters.ex,
                event: {
                    ...filters.ex.event,
                    names: [...filters.ex.event.names, eventInput]
                }
            }
        });
        setEventInput('')
    }
    const reqGPrice = () => {
        if(!gPriceInput) return;
        updateFilters({
            ...filters,
            priceGThan: gPriceInput
        });
        setGPriceInput('')
    }
    const reqLPrice = () => {
        if(!lPriceInput) return;
        updateFilters({
            ...filters,
            priceLThan: lPriceInput
        });
        setLPriceInput('')
    }
    // reqex filter tab funcs
    const removeReqEvent = (event) => updateFilters({
        ...filters, 
        req: {
            ...filters.req,
            event: {
                ...filters.req.event,
                names: filters.req.event.names.filter(v => v != event)
            }
        }
    });
    const removeExEvent = (event) => updateFilters({
        ...filters, 
        ex: {
            ...filters.ex,
            event: {
                ...filters.ex.event,
                names: filters.ex.event.names.filter(v => v != event)
            }
        }
    });
    const removeReqGPrice = () => {
        updateFilters({
            ...filters,
            priceGThan: ''
        });
    }
    const removeReqLPrice = () => {
        updateFilters({
            ...filters,
            priceLThan: ''
        });
    }
    const reqEvents = filters.req.event.names.map((event, index) =>
        <ReqExFilterTab 
            key={`reqfilter-event${index}`}
            label={'Event: '} value={event}
            onClickFunc={() => removeReqEvent(event)}
        />
    );
    const exEvents = filters.ex.event.names.map((event, index) =>
        <ReqExFilterTab 
            key={`exfilter-event${index}`}
            label={'Event: '} value={event}
            onClickFunc={() => removeExEvent(event)}
        />
    );

    const reqChildren = [
        (filters.priceGThan && <ReqExFilterTab key={'reqfilter-gprice'} label={'Price >'} value={`$${filters.priceGThan}`} onClickFunc={removeReqGPrice}/>),
        (filters.priceLThan && <ReqExFilterTab key={'reqfilter-lprice'} label={'Price <'} value={`$${filters.priceLThan}`} onClickFunc={removeReqLPrice}/>),
        ...reqEvents
    ];
    const exChildren = [...exEvents];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%'}}>
            <div className='menu-inputs'>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='eventInput'>Event: </label>
                        <input
                            type='text'
                            id='eventInput'
                            value={eventInput}
                            onChange={handleEventChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '50%'}} onClick={reqEvent}>Require</button>
                        <button className='reqex-btn ex-btn' style={{width: '50%'}} onClick={exEvent}>Exclude</button>
                    </div>
                </div>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='gThanDateInput'>{`Tickets > `}</label>
                        <input
                            type='text'
                            id='gPriceInput'
                            value={gPriceInput ? `$${gPriceInput}` : ''}
                            placeholder="$0.00"
                            onChange={handleGPriceChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '100%'}} onClick={reqGPrice}>Require</button>
                    </div>
                </div>
                <div className='menu-input'>
                    <div className='reqex-input-container'>
                        <label htmlFor='lThanDateInput'>{`Tickets < `}</label>
                        <input
                            type='text'
                            id='lPriceInput'
                            value={lPriceInput ? `$${lPriceInput}` : ''}
                            placeholder="$0.00"
                            onChange={handleLPriceChange}
                        />
                    </div>
                    <div className='reqex-btn-container'>
                        <button className='reqex-btn req-btn' style={{width: '100%'}} onClick={reqLPrice}>Require</button>
                    </div>
                </div>
            </div>

            <ReqExList reqChildren={reqChildren} exChildren={exChildren}/>
        </div>
    );
}

export default EventMenu;