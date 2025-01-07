import React, { useState } from 'react';
import '../../../styles/module/Map/filter.css';
import GenreMenu from './Menus/GenreMenu';
import DateMenu from './Menus/DateMenu';
import EventMenu from './Menus/EventMenu';
import ArtistMenu from './Menus/ArtistMenu';
import AlbumMenu from './Menus/AlbumMenu';
import SongMenu from './Menus/SongMenu';
import SourceMenu from './Menus/SourceMenu';
import LocationMenu from './Menus/LocationMenu';

const FilterMenu = () => {
    const [expandedMenuIndex, setExpandedMenuIndex] = useState(null);
    const expandMenuToggle = (index) => setExpandedMenuIndex(expandedMenuIndex === index ? null : index);
    
    const filterMenus = [
        ["Genre", <GenreMenu />],
        ["Date", <DateMenu />],
        ["Location", <LocationMenu />],
        ["Event", <EventMenu />],
        ["Artist", <ArtistMenu />],
        ["Album", <AlbumMenu />],
        ["Song", <SongMenu />],
        ["Source", <SourceMenu />],
    ];
    /* Wants 
        - vertical list of labels that when clicked expand to show associated menu
        - expand at most label and container width to always allow to close menu
        SubMenu:
            - show inputs
                - scroll overflow
            - show applied filters
                - scroll overflow
    */

    return (
        <div className='filter-menu'>
            {
                filterMenus.map((menu, index) => (
                    <div key={index} className='filter-menu-label-container'>
                        {/* Label */}
                        <p className='filter-menu-label' onClick={() => expandMenuToggle(index)}>
                            {menu[0]}
                        </p>
                        {/* Menu */}
                        {expandedMenuIndex === index ? menu[1] : null}
                    </div>
                ))
            }
        </div>
    );
};

export default FilterMenu;

