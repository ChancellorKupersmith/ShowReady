import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './FilterView.css';
import FilterTitle from './FilterTitle';
import FilterList from './FilterList';
import FilterFooter from "./FilterFooter";
import FilterMenu from './Menus/FilterMenu';

const FilterBtn = ({onClick}) => <button id='filter-btn' onClick={onClick}>Filter</button>

const FilterView = () => {
    const [isOpen, setIsOpen] = useState(false);
    const closeModal = () => {
        console.log(isOpen)
        setIsOpen(!isOpen)
    };

    const [filterMenu, setFilterMenu] = useState('date')
    const handleFilterMenu = (label) => {
        switch(label.toLowerCase()){
            case 'location':
                setFilterMenu('location');
                break;
            case 'event':
                setFilterMenu('event');
                break;
            case 'artist':
                setFilterMenu('artist');
                break;
            case 'album':
                setFilterMenu('album');
                break;
            case 'song':
                setFilterMenu('song');
                break;
            case 'source':
                setFilterMenu('source');
                break;
            default:
                setFilterMenu('date');
        }
    }

    // Hide scrollbar in Chrome, Safari, and newer versions of Edge
    const webkitStyles = `
        ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
        }
    `;
    const scrollableStyle = {
        display: 'flex',
        flex: '10',
        overflowY: 'scroll',
        scrollbarWidth: 'none', /* Hide scrollbar in Firefox */
        msOverflowStyle: 'none' /* Hide scrollbar in Internet Explorer and Edge */
    }

    return (
        <div>
            <FilterBtn onClick={() => closeModal()}/>
            {isOpen && createPortal(
                <div className='modal-container'>
                    <FilterTitle closeModal={closeModal} />
                    <style>{webkitStyles}</style>
                    <div style={scrollableStyle}>
                        <FilterList handleFilterMenu={handleFilterMenu}/>
                        <FilterMenu filterMenu={filterMenu}/>
                    </div>
                    <FilterFooter />
                </div>,
                document.body
            )}
        </div>
    );

};


export default FilterView;