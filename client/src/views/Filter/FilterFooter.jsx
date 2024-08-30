import React from 'react';
import { useTempSongsFilter } from "./FilterContext";

const FilterFooter = ({closeModal}) => {
    const { tempFilters, revertTempFilters, saveTempFilters } = useTempSongsFilter();

    const handleCancel = () => {
        revertTempFilters();
        closeModal();
    }
    const handleSave = () => {
        saveTempFilters();
        closeModal();
    }
    return (
        <div className='filter-footer'>
            <div>
                <label>Results: </label>
                {tempFilters.total}
            </div>
            <div>
                <button onClick={handleCancel}>Cancel</button>
                <button onClick={handleSave}>Apply</button>
            </div>
        </div>
    )
}



export default FilterFooter;