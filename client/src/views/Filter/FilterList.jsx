import React from 'react';
import { useTempSongsFilter } from "./FilterContext";
import RightArrow from '../../assets/right-arrow.svg'
import { ReqExFilterTab } from './Menus/MenuUtils';

const FilterLabel = ({label, handleFilterMenu, selectedMenu, tabs}) => {
    return (
        <div 
            className={`filter-label ${label.toLowerCase() == selectedMenu ? 'selected' : ''}`}
            onClick={() => handleFilterMenu(label)}
        >
            <div className='header'>
                <h3>{label}</h3>
                <button onClick={() => handleFilterMenu(label)}>
                    <img
                        loading="lazy"
                        src={RightArrow}
                        alt={'open ' + label}
                    />
                </button>
            </div>
            <div className='tabs-container'>
                {tabs}
            </div>
        </div>
    );
}


const FilterList = ({handleFilterMenu, selectedMenu}) => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    const clearAllFilters = () => {
        const emptyFilters = {
            total: 0,
            dateGThan: '',
            dateLThan: '',
            priceGThan: '',
            priceLThan: '',
            // spotifyPopularityGThan: '',
            // spotifyPopularityLThan: '',
            ex: {
                date: {
                    dates: [],
                    eventTimes: [],
                },
                location: {
                    venues: [],
                    hoods: [],
                    // addresses: [],
                },
                event: {
                    names: [],
                    // ageRestrictions: [],
                },
                artist: {
                    names: [],
                    // fromEach: '',
                    // musicbrainz meta
                },
                album: {
                    names: [],
                    // fromEach: '',
                },
                song: {
                    names: [],
                },
                source: {
                    spotify: false,
                    // youtube: false,
                },
            },
            req: {
                date: {
                    dates: [],
                    eventTimes: [],
                },
                location: {
                    venues: [],
                    hoods: [],
                    addresses: [],
                },
                event: {
                    names: [],
                    // ageRestrictions: [],
                },
                artist: {
                    names: [],
                    fromEach: '',
                    // musicbrainz meta
                },
                album: {
                    names: [],
                    fromEach: '',
                },
                song: {
                    names: [],
                },
                source: {
                    spotify: false,
                    // youtube: false,
                },
            },
        };
        updateTempFilters(emptyFilters)
    }
    // maybe TODO: (depending on rendering speeds) wrap indivual funcs in useEffects so data is only re-copied whe needed
    // only display 2 tabs, display truncate tab if more
    // EFFICIENT: The reason for the complex logic (instead of just copying a bunch of unused data) is to avoid creating a bunch of unused html elements
    const MAX_TABS = 3;
    const getDateFilterTabs = () => {
        let tabs = [];
        const populateTabs = (list, label, key) => {
            for(let i=0; i < list.length && tabs.length <= MAX_TABS; i++){
                tabs.push(
                    <ReqExFilterTab 
                        key={`${key}${i}`}
                        label={label}
                        value={list[i]}
                    />
                )
            }
        }
        populateTabs(tempFilters.req.date.dates, 'Date:', 'label-reqfilter-date')
        populateTabs(tempFilters.ex.date.dates, 'Date:', 'label-exfilter-date')
        populateTabs(tempFilters.req.date.eventTimes, 'Time:', 'label-reqfilter-time')
        populateTabs(tempFilters.ex.date.eventTimes, 'Time:', 'label-exfilter-time')
        if(tempFilters.dateGThan && tabs.length <= MAX_TABS){
            tabs.push(
                <ReqExFilterTab
                    key={'label-reqfilter-gThan'}
                    label={'After:'}
                    value={tempFilters.dateGThan} 
                />
            )
        }
        if(tempFilters.dateLThan && tabs.length <= MAX_TABS){
            tabs.push(
                <ReqExFilterTab
                    key={'label-reqfilter-lThan'}
                    label={'Before:'}
                    value={tempFilters.dateLThan} 
                />
            )
        }
        // set ellipsis tab
        if(tabs.length >= MAX_TABS){
            tabs[MAX_TABS - 1] = <ReqExFilterTab key={'date-ellipsis'} value={'...'}/>
        }
        return tabs;
    }
    const getLocationFilterTabs = () => {
        let tabs = [];
        const populateTabs = (list, label, key) => {
            for(let i=0; i < list.length && tabs.length <= MAX_TABS; i++){
                tabs.push(
                    <ReqExFilterTab 
                        key={`${key}${i}`}
                        label={label}
                        value={list[i]}
                    />
                )
            }
        }
        populateTabs(tempFilters.req.location.venues, 'Venue:', 'label-reqfilter-venue')
        populateTabs(tempFilters.ex.location.venues, 'Venue:', 'label-exfilter-venue')
        populateTabs(tempFilters.req.location.hoods, 'Hood:', 'label-reqfilter-hood')
        populateTabs(tempFilters.ex.location.hoods, 'Hood:', 'label-exfilter-hood')
        // set ellipsis tab
        if(tabs.length >= MAX_TABS){
            tabs[MAX_TABS - 1] = <ReqExFilterTab key={'date-ellipsis'} value={'...'}/>
        }
        return tabs;
    }
    const getEventFilterTabs = () => {
        let tabs = [];
        const populateTabs = (list, label, key) => {
            for(let i=0; i < list.length && tabs.length <= MAX_TABS; i++){
                tabs.push(
                    <ReqExFilterTab 
                        key={`${key}${i}`}
                        label={label}
                        value={list[i]}
                    />
                )
            }
        }
        populateTabs(tempFilters.req.event.names, 'Event:', 'label-reqfilter-event')
        populateTabs(tempFilters.ex.event.names, 'Event:', 'label-exfilter-event')
        if(tempFilters.priceGThan && tabs.length <= MAX_TABS){
            tabs.push(
                <ReqExFilterTab
                    key={'label-reqfilter-priceGThan'}
                    label={'Price >'}
                    value={`$${tempFilters.priceGThan}`} 
                />
            )
        }
        if(tempFilters.priceLThan && tabs.length <= MAX_TABS){
            tabs.push(
                <ReqExFilterTab
                    key={'label-reqfilter-lThan'}
                    label={'Price <'}
                    value={`$${tempFilters.priceLThan}`} 
                />
            )
        }
        // set ellipsis tab
        if(tabs.length >= MAX_TABS){
            tabs[MAX_TABS - 1] = <ReqExFilterTab key={'date-ellipsis'} value={'...'}/>
        }
        return tabs;
    }
    const getArtistFilterTabs = () => {
        let tabs = [];
        const populateTabs = (list, label, key) => {
            for(let i=0; i < list.length && tabs.length <= MAX_TABS; i++){
                tabs.push(
                    <ReqExFilterTab 
                        key={`${key}${i}`}
                        label={label}
                        value={list[i]}
                    />
                )
            }
        }
        populateTabs(tempFilters.req.artist.names, 'Artist:', 'label-reqfilter-artist')
        populateTabs(tempFilters.ex.artist.names, 'Artist:', 'label-exfilter-artist')
        // set ellipsis tab
        if(tabs.length >= MAX_TABS){
            tabs[MAX_TABS - 1] = <ReqExFilterTab key={'date-ellipsis'} value={'...'}/>
        }
        return tabs;
    }
    const getAlbumFilterTabs = () => {
        let tabs = [];
        const populateTabs = (list, label, key) => {
            for(let i=0; i < list.length && tabs.length <= MAX_TABS; i++){
                tabs.push(
                    <ReqExFilterTab 
                        key={`${key}${i}`}
                        label={label}
                        value={list[i]}
                    />
                )
            }
        }
        populateTabs(tempFilters.req.album.names, 'Album:', 'label-reqfilter-album')
        populateTabs(tempFilters.ex.album.names, 'Album:', 'label-exfilter-album')
        // set ellipsis tab
        if(tabs.length >= MAX_TABS){
            tabs[MAX_TABS - 1] = <ReqExFilterTab key={'date-ellipsis'} value={'...'}/>
        }
        return tabs;
    }
    const getSongFilterTabs = () => {
        let tabs = [];
        const populateTabs = (list, label, key) => {
            for(let i=0; i < list.length && tabs.length <= MAX_TABS; i++){
                tabs.push(
                    <ReqExFilterTab 
                        key={`${key}${i}`}
                        label={label}
                        value={list[i]}
                    />
                )
            }
        }
        populateTabs(tempFilters.req.song.names, 'Song:', 'label-reqfilter-song')
        populateTabs(tempFilters.ex.song.names, 'Song:', 'label-exfilter-song')
        // set ellipsis tab
        if(tabs.length >= MAX_TABS){
            tabs[MAX_TABS - 1] = <ReqExFilterTab key={'date-ellipsis'} value={'...'}/>
        }
        return tabs;
    }
    const getSourceFilterTabs = () => {
        let tabs = [];
        const populateTabs = (list, label, key) => {
            for(let i=0; i < list.length && tabs.length <= MAX_TABS; i++){
                tabs.push(
                    <ReqExFilterTab 
                        key={`${key}${i}`}
                        label={label}
                        value={list[i]}
                    />
                )
            }
        }
        if(tempFilters.req.source.spotify && tabs.length <= MAX_TABS){
            tabs.push(
                <ReqExFilterTab
                    key={'label-reqfilter-spotify'}
                    value={'Require Spotify'} 
                />
            )
        }
        if(tempFilters.ex.source.spotify && tabs.length <= MAX_TABS){
            tabs.push(
                <ReqExFilterTab
                    key={'label-reqfilter-spotify'}
                    value={'Exclude Spotify'} 
                />
            )
        }
        // set ellipsis tab
        if(tabs.length >= MAX_TABS){
            tabs[MAX_TABS - 1] = <ReqExFilterTab key={'date-ellipsis'} value={'...'}/>
        }
        return tabs;
    }
    const dateTabs = getDateFilterTabs();
    const locationTabs = getLocationFilterTabs();
    const eventTabs = getEventFilterTabs();
    const artistTabs = getArtistFilterTabs();
    const albumTabs = getAlbumFilterTabs();
    const songTabs = getSongFilterTabs();
    const sourceTabs = getSourceFilterTabs();


    return (
        <div className='filter-list'>
            <div className='header'>
                <h2>Filters</h2>
                {(tempFilters.total && <ReqExFilterTab label={'total:'} value={tempFilters.total} onClickFunc={clearAllFilters}/>)}
            </div>
            <FilterLabel label={'Date'} handleFilterMenu={handleFilterMenu} selectedMenu={selectedMenu} tabs={dateTabs}/>
            <FilterLabel label={'Location'} handleFilterMenu={handleFilterMenu} selectedMenu={selectedMenu} tabs={locationTabs}/>
            <FilterLabel label={'Event'} handleFilterMenu={handleFilterMenu} selectedMenu={selectedMenu} tabs={eventTabs}/>
            <FilterLabel label={'Artist'} handleFilterMenu={handleFilterMenu} selectedMenu={selectedMenu} tabs={artistTabs}/>
            <FilterLabel label={'Album'} handleFilterMenu={handleFilterMenu} selectedMenu={selectedMenu} tabs={albumTabs}/>
            <FilterLabel label={'Song'} handleFilterMenu={handleFilterMenu} selectedMenu={selectedMenu} tabs={songTabs}/>
            <FilterLabel label={'Source'} handleFilterMenu={handleFilterMenu} selectedMenu={selectedMenu} tabs={sourceTabs}/>
        </div>
    );
}


export default FilterList;