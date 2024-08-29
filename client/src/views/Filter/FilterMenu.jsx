import React, { useState } from 'react';
import { useSongsFilter } from "./FilterContext";

const FilterMenu = ({filterMenu}) => {
    return (
        <div className='filter-menu'>
            {filterMenu}
        </div>
    )
}


export default FilterMenu;