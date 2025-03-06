import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import FilterMenu from './FilterMenu';
import FilterTitle from './FilterTitle';
import FilterFooter from "./FilterFooter";
import { useSongsFilter } from './FilterContext';
import FilterDarkSvg from '../../../assets/filter-dark.svg';
import './FilterView.css';

const FilterModal = ({ isFilterModalOpen, setIsFilterModalOpen, isSongsModalOpen, setIsSongsModalOpen }) => {
    const { filtersTotal, tempFiltersTotal, revertTempFilters } = useSongsFilter();
    const closeModal = () => {
        if(isSongsModalOpen) setIsSongsModalOpen(false);
        setIsFilterModalOpen(!isFilterModalOpen);
        revertTempFilters();
    };
    const [filtersTotalDisplay, setFiltersTotalDisplay ] = useState(filtersTotal);
    useEffect(() => {
        setFiltersTotalDisplay(isFilterModalOpen ? tempFiltersTotal : filtersTotal);
    }, [isFilterModalOpen, filtersTotal, tempFiltersTotal])
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
            <button id='filter-btn' className={isFilterModalOpen? 'selected' : ''} onClick={closeModal}><FilterImg /></button>
        );
    };

    return (
        <div>
            <FilterBtn onClick={() => closeModal()}/>
            {isFilterModalOpen && createPortal(
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