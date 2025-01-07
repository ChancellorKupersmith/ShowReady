import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Filter/FilterView';
import './Songs/SongsView';
import '../../styles/module/Map/navbar.css';
import FilterModal from './Filter/FilterView';
import SongsModal from './Songs/SongsView';

const NavViewBtn = ({icon, route}) => {
    const navigate = useNavigate();
    const handleViewChange = () => navigate(route);

    return (
        <li className='nav-view-btn'>
            <button onClick={handleViewChange}>{icon}</button>
        </li>
    );
}

const NavBar = () => {
    
    return (
        <div className='navbar'>
            <ul className='btns-list'>
                <NavViewBtn icon={'Home'} route={'/'}/>
                <FilterModal />
                <SongsModal />
                <NavViewBtn icon={'About'} route={'/about'}/>
            </ul>
        </div>
    );
}

export default NavBar;