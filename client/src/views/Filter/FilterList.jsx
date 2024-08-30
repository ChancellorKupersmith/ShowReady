import React from 'react';
import { useTempSongsFilter } from "./FilterContext";
import RightArrow from '../../assets/right-arrow.svg'

const FilterLabel = ({label, handleFilterMenu}) => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    return (
        <div className='filter-label' onClick={() => handleFilterMenu(label)}>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <h3>{label}</h3>
                {/* select view btn */}
                <button onClick={() => handleFilterMenu(label)}>
                    <img
                        loading="lazy"
                        src={RightArrow}
                        alt={'open ' + label}
                    />
                </button>
            </div>
            {/* truncated list of applied tempFilters */}
        </div>
    )
}


const FilterList = ({handleFilterMenu}) => {
    const { tempFilters, updateTempFilters } = useTempSongsFilter();
    /*
        - Title, list of filter labels, total tempFilters/clear btn
    */

    return (
        <div className='filter-list'>
            <div style={{display: 'flex', justifyContent: 'space-around'}}>
                <h2>Filters</h2>
                {/* total tempFilters / clear */}
            </div>
            <FilterLabel label={'Date'} handleFilterMenu={handleFilterMenu}/>
            <FilterLabel label={'Location'} handleFilterMenu={handleFilterMenu}/>
            <FilterLabel label={'Event'} handleFilterMenu={handleFilterMenu}/>
            <FilterLabel label={'Artist'} handleFilterMenu={handleFilterMenu}/>
            <FilterLabel label={'Album'} handleFilterMenu={handleFilterMenu}/>
            <FilterLabel label={'Song'} handleFilterMenu={handleFilterMenu}/>
            <FilterLabel label={'Source'} handleFilterMenu={handleFilterMenu}/>
        </div>
    )
}


export default FilterList;