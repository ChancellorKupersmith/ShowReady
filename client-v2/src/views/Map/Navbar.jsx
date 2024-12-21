import React from 'react';
import { useViewContext } from '../../App';
import './Filter/FilterView';
import './PlaylistGen/SongsView';
import '../../styles/module/Map/navbar.css';
import FilterModal from './Filter/FilterView';
import SongsModal from './PlaylistGen/SongsView';

const NavViewBtn = ({icon, viewName}) => {
    const { handleViewChange } = useViewContext();
    return (
        <li className='nav-view-btn'>
            <button onClick={() => handleViewChange(viewName)}>{icon}</button>
        </li>
    );
}

const NavBar = () => {
    
    return (
        <div className='navbar'>
            <ul className='btns-list'>
                <NavViewBtn icon={'Home'} viewName={'home'}/>
                <FilterModal />
                <SongsModal />
                <NavViewBtn icon={'About'} viewName={'about'}/>
            </ul>
        </div>
    );
}

export default NavBar;