import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './FilterView.css';
import FilterSvg from '../../assets/filter.svg'
import FilterTitle from './FilterTitle';
import FilterList from './FilterList';
import FilterFooter from "./FilterFooter";
import FilterMenu from './Menus/FilterMenu';
import { TempFilterContextProvider } from './FilterContext';

const FilterView = () => {
    const [isOpen, setIsOpen] = useState(false);
    const closeModal = () => setIsOpen(!isOpen)

    const FilterBtn = () => {
        const FilterImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={FilterSvg}
                    alt='Filter'
                />
            </div>
        );
        return (
            <button id='filter-btn' className={isOpen? 'selected' : ''} onClick={closeModal}><FilterImg /></button>
        );
    } 


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

    return (
        <div>
            <FilterBtn onClick={() => closeModal()}/>
            {isOpen && createPortal(
                <TempFilterContextProvider>
                    <div className='filter-modal-container'>
                        <FilterTitle closeModal={closeModal} />
                        <div className='contents'>
                            <FilterList selectedMenu={filterMenu} handleFilterMenu={handleFilterMenu}/>
                            <FilterMenu filterMenu={filterMenu}/>
                        </div>
                        <FilterFooter closeModal={closeModal} />
                    </div>
                </TempFilterContextProvider>,
                document.body
            )}
        </div>
    );

};


export default FilterView;