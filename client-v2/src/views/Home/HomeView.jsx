import React from 'react';
import { useNavigate } from 'react-router-dom';
import FMRadio from './FMRadio';
import BetaAccess from './BetaAccess';
import '../../styles/layout/Home/home.css';
import '../../styles/module/Home/home.css';
import { ThemeToggle, useThemeData } from './Theme';


const HomeView = () => {
  const { theme } = useThemeData();
  const navigate = useNavigate();
  const handleViewChange = (route) => navigate(route);

  return (
    <div id='l-view-container-home'  style={{ colorScheme: `${theme}`}}>
      <BetaAccess />
      <div className='theme-toggle-container'>
        <ThemeToggle />
      </div>
      <div id='l-home-body'>
        <header id='l-home-header'>
          <h2 className='title'>Show Ready</h2>
        </header>
        <div id='l-home-body-grabber'>
          <FMRadio />
          <p className='grabber-description'>A Playlist generator for upcoming Seattle Concerts!</p>
        </div>
        <div id='l-home-call-to-action'>
          <h1>You Ready?</h1>
          <button className='open-map-view' onClick={() => handleViewChange('/map')}>Discover</button>
        </div>
      </div>
      {/* <div id='l-home-footer'>footer</div> */}
    </div>
  );
};

export default HomeView;