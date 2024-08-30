import React, { useState } from 'react';
import { useTempSongsFilter } from '../FilterContext';
import { ReqExFilterTab, ReqExList } from './MenuUtils';


const EventMenu = () => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
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
        setEventInput('')
    }
    const reqGPrice = () => {
        if(!gPriceInput) return;
        updateTempFilters({
            ...tempFilters,
            priceGThan: gPriceInput
        });
        setGPriceInput('')
    }
    const reqLPrice = () => {
        if(!lPriceInput) return;
        updateTempFilters({
            ...tempFilters,
            priceLThan: lPriceInput
        });
        setLPriceInput('')
    }
    // reqex filter tab funcs
    const removeReqEvent = (event) => updateTempFilters({
        ...tempFilters, 
        req: {
            ...tempFilters.req,
            event: {
                ...tempFilters.req.event,
                names: tempFilters.req.event.names.filter(v => v != event)
            }
        }
    });
    const removeExEvent = (event) => updateTempFilters({
        ...tempFilters, 
        ex: {
            ...tempFilters.ex,
            event: {
                ...tempFilters.ex.event,
                names: tempFilters.ex.event.names.filter(v => v != event)
            }
        }
    });
    const removeReqGPrice = () => {
        updateTempFilters({
            ...tempFilters,
            priceGThan: ''
        });
    }
    const removeReqLPrice = () => {
        updateTempFilters({
            ...tempFilters,
            priceLThan: ''
        });
    }
    const reqEvents = tempFilters.req.event.names.map((event, index) =>
        <ReqExFilterTab 
            key={`reqfilter-event${index}`}
            label={'Event: '} value={event}
            onClickFunc={() => removeReqEvent(event)}
        />
    );
    const exEvents = tempFilters.ex.event.names.map((event, index) =>
        <ReqExFilterTab 
            key={`exfilter-event${index}`}
            label={'Event: '} value={event}
            onClickFunc={() => removeExEvent(event)}
        />
    );

    const reqChildren = [
        (tempFilters.priceGThan && <ReqExFilterTab key={'reqfilter-gprice'} label={'Price >'} value={`$${tempFilters.priceGThan}`} onClickFunc={removeReqGPrice}/>),
        (tempFilters.priceLThan && <ReqExFilterTab key={'reqfilter-lprice'} label={'Price <'} value={`$${tempFilters.priceLThan}`} onClickFunc={removeReqLPrice}/>),
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