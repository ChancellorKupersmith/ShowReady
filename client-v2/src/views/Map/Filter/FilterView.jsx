import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './FilterView.css';
import FilterDarkSvg from '../../../assets/filter-dark.svg';
import FilterTitle from './FilterTitle';
import FilterFooter from "./FilterFooter";
import FilterMenu from './FilterMenu';

import { useSongsFilter } from './FilterContext';

const FilterModal = () => {
    const { filters, filtersTotal, tempFilters, tempFiltersTotal, revertTempFilters } = useSongsFilter();
    const [isOpen, setIsOpen] = useState(false);
    const closeModal = () => {
        setIsOpen(!isOpen);
        revertTempFilters();
    };
    const [filtersTotalDisplay, setFiltersTotalDisplay ] = useState(filtersTotal);
    useEffect(() => {
        setFiltersTotalDisplay(isOpen ? tempFiltersTotal : filtersTotal);
    }, [isOpen, filtersTotal, tempFiltersTotal])
    const FilterBtn = () => {
        const FilterImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={FilterDarkSvg}
                    alt='Filter'
                />
                { 
                    filtersTotalDisplay > 0 &&
                    <span className='total-badge' >{filtersTotalDisplay}</span>
                }
            </div>
        );
        return (
            <button id='filter-btn' className={isOpen? 'selected' : ''} onClick={closeModal}><FilterImg /></button>
        );
    };

    return (
        <div>
            <FilterBtn onClick={() => closeModal()}/>
            {isOpen && createPortal(
                <div className='filter-modal-container'>
                    <FilterTitle closeModal={closeModal} />
                    <FilterMenu />
                    <FilterFooter closeModal={closeModal} />
                </div>,
                document.body
            )}
        </div>
    );

};


export default FilterModal;