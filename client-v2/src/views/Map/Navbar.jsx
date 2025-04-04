import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './Filter/FilterView';
import './Songs/SongsView';
import '../../styles/module/Map/navbar.css';
import FilterModal from './Filter/FilterView';
import SongsModal from './Songs/SongsView';
import { useThemeData } from '../Home/Theme';

const NavViewBtn = ({icon, route}) => {
    const handleViewChange = () => {
        window.location.href = route;
    };

    return (
        <li className='nav-view-btn'>
            <button onClick={handleViewChange}>{icon}</button>
        </li>
    );
}

const PlaceHolderBtn = ({icon}) => {
    const handleOnClickAbout = () => {
        toast.warn('feature coming soon!', {
            autoClose: true
        });
    };

    return (
        <li className='nav-view-btn'>
            <button onClick={() => handleOnClickAbout()}>{icon}</button>
        </li>
    );
}


const NavBar = () => {
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isSongsModalOpen, setIsSongsModalOpen] = useState(false);


    const {theme} = useThemeData();
    return (
        <div className='navbar' style={{ colorScheme: `${theme}`}}>
            <ul className='btns-list'>
                <NavViewBtn icon={'Home'} route={'/'}/>
                <FilterModal 
                    isFilterModalOpen={isFilterModalOpen}
                    setIsFilterModalOpen={setIsFilterModalOpen}
                    isSongsModalOpen={isSongsModalOpen}
                    setIsSongsModalOpen={setIsSongsModalOpen}
                />
                <SongsModal
                    isFilterModalOpen={isFilterModalOpen}
                    setIsFilterModalOpen={setIsFilterModalOpen}
                    isSongsModalOpen={isSongsModalOpen}
                    setIsSongsModalOpen={setIsSongsModalOpen}
                />
                <PlaceHolderBtn icon={'About'}/>
            </ul>
        </div>
    );
}

export default NavBar;