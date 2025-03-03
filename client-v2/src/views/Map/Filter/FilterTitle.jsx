import React from 'react';

const FilterTitle = ({closeModal}) => {
    return (
        <div className="filter-title">
            <div className='header'>
                <h1>Song Filters</h1>
                <button className='close-filter-modal' onClick={() => closeModal()}>x</button>
            </div>
            <p>Customize playlist based on the filters you select here.</p>
        </div>
    )
}


export default FilterTitle;