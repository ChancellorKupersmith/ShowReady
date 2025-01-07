import React from 'react';
import DateMenu from './DateMenu'
import LocationMenu from './LocationMenu';
import EventMenu from './EventMenu';
import ArtistMenu from './ArtistMenu';
import AlbumMenu from './AlbumMenu';
import SongMenu from './SongMenu';
import SourceMenu from './SourceMenu';
import GenreMenu from './GenreMenu';

const FilterMenu = ({filterMenu}) => {
    let menu;
    switch(filterMenu){
        case 'genre':
            menu = <GenreMenu />
            break;
        case 'date':
            menu = <DateMenu />
            break;
        case 'location':
            menu = <LocationMenu />
            break;
        case 'event':
            menu = <EventMenu />
            break;
        case 'artist':
            menu = <ArtistMenu />
            break;
        case 'album':
            menu = <AlbumMenu />
            break;
        case 'song':
            menu = <SongMenu />
            break;
        case 'source':
            menu = <SourceMenu />
            break;
        default:
            <div>Error Loading Menu.</div>
    }

    return (
        <div className='filter-menu-container'>
            {menu}
        </div>
    )
}

export default FilterMenu;