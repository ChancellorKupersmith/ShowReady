import React from 'react';

const FilterTitle = ({closeModal}) => {
    return (
        <div className="filter-title">
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h1>Song Filters</h1>
                <button onClick={() => closeModal()}>x</button>
            </div>
            <p>Customize playlist based on the filters you select here.</p>
        </div>
    )
}


export default FilterTitle;