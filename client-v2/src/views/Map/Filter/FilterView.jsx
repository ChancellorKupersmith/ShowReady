import React, { useState } from 'react';
import { createPortal } from 'react-dom';
// import './FilterView.css';
import FilterLightSvg from '../../../assets/filter-light.svg';
import FilterDarkSvg from '../../../assets/filter-dark.svg';
import FilterTitle from './FilterTitle';
import FilterFooter from "./FilterFooter";
import FilterMenu from './FilterMenu';

import { TempFilterContextProvider } from './FilterContext';
import { useThemeData } from '../../Home/Theme';

const FilterModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const closeModal = () => setIsOpen(!isOpen);
    const {theme} = useThemeData();
    const FilterBtn = () => {
        const FilterImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={FilterDarkSvg}
                    alt='Filter'
                />
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