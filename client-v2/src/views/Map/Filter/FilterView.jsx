import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './FilterView.css';
import FilterDarkSvg from '../../../assets/filter-dark.svg';
import FilterTitle from './FilterTitle';
import FilterFooter from "./FilterFooter";
import FilterMenu from './FilterMenu';

import { TempFilterContextProvider, useSongsFilter } from './FilterContext';

const FilterModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const closeModal = () => setIsOpen(!isOpen);

    const { filtersTotal } = useSongsFilter();
    const FilterBtn = () => {
        const FilterImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={FilterDarkSvg}
                    alt='Filter'
                />
                { 
                    filtersTotal > 0 &&
                    <span className='total-badge' >{filtersTotal}</span>
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
                <TempFilterContextProvider>
                    <div className='filter-modal-container'>
                        <FilterTitle closeModal={closeModal} />
                        <FilterMenu />
                        <FilterFooter closeModal={closeModal} />
                    </div>
                </TempFilterContextProvider>,
                document.body
            )}
        </div>
    );

};


export default FilterModal;