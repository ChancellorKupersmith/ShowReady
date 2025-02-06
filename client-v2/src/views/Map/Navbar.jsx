import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Filter/FilterView';
import './Songs/SongsView';
import '../../styles/module/Map/navbar.css';
import FilterModal from './Filter/FilterView';
import SongsModal from './Songs/SongsView';
import { useThemeData } from '../Home/Theme';

const NavViewBtn = ({icon, route}) => {
    const navigate = useNavigate();
    const handleViewChange = () => navigate(route);

    return (
        <li className='nav-view-btn'>
            <button onClick={handleViewChange}>{icon}</button>
        </li>
    );
}

const PlaceHolderBtn = ({icon, route}) => {
    const navigate = useNavigate();
    const handleViewChange = () => navigate(route);
    const handleOnClickAbout = () => {
        console.log(icon);  
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
    const {theme} = useThemeData();
    return (
        <div className='navbar' style={{ colorScheme: `${theme}`}}>
            <ul className='btns-list'>
                <NavViewBtn icon={'Home'} route={'/'}/>
                <FilterModal />
                <SongsModal />
                <PlaceHolderBtn icon={'About'} route={'/map'}/>
            </ul>
        </div>
    );
}

export default NavBar;