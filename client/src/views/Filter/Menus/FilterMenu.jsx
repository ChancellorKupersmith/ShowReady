import React from 'react';
import DateMenu from './DateMenu'


const FilterMenu = ({filterMenu}) => {
    
    let menu;
    switch(filterMenu){
        case 'date':
            menu = <DateMenu />
            break;
        default:
            <div>Error Loading Menu.</div>
    }


    return (
        <div className='filter-menu'>
            {menu}
        </div>
    )
}


export default FilterMenu;