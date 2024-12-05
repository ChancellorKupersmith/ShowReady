import React, { useState } from 'react';
import '../../styles/module/Map/navbar.css';
import { useViewContext } from '../../App';

const NavBtn = ({icon, viewName}) => {
    const { handleViewChange } = useViewContext();
    return (
        <li className='nav-btn'>
            <button onClick={() => handleViewChange(viewName)}>{icon}</button>
        </li>
    );
}
const NavBar = () => {
    
    return (
        <div className='navbar'>
            <ul className='btns-list'>
                <NavBtn icon={'Home'} viewName={'home'}/>
                <NavBtn icon={'Map'} viewName={'map'}/>
                <NavBtn icon={'About'} viewName={'about'}/>
            </ul>
        </div>
    )
}

export default NavBar;