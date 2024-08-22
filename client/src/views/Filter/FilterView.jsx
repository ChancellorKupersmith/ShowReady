import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './FilterView.css';
import FilterInput from './FilterInput';
import FilterLists from './FilterLists';

const FilterBtn = ({onClick}) => <button id='filter-btn' onClick={onClick}>Filter</button>

const FilterView = () => {
    const [isOpen, setIsOpen] = useState(false);
    const openCloseModal = () => {
        console.log(isOpen)
        setIsOpen(!isOpen)
    };

    return (
        <div>
            <FilterBtn onClick={() => openCloseModal()}/>
            {isOpen && createPortal(
                <div className='modal-container'>
                    <button onClick={() => openCloseModal()}>close</button>
                    <FilterInput 
                    
                    />
                    <FilterLists />
                </div>,
                document.body
            )}
            
        </div>
    );

};


export default FilterView;