import React from 'react';
import FMRadio from './FMRadio';
import BetaAccess from './BetaAccess';
import '../../styles/layout/Home/home.css';
import '../../styles/module/Home/home.css';
import { ThemeToggle, useThemeData } from './Theme';
import GitHubLightSvg from '../../assets/github-light.svg';
import GitHubDarkSvg from '../../assets/github-dark.svg';

const GitHubBtn = ({ theme = 'light' }) => {
  return (
    <a
      className='github-link'
      href='https://github.com/ChancellorKupersmith/ShowReady'
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className='svg-container'>
        <img
          loading='lazy'
          src={ theme === 'dark' ? GitHubDarkSvg : GitHubLightSvg }
          alt='github repo'
        />
      </div>
    </a>
  );
}

const HomeView = () => {
  const { theme } = useThemeData();
  const handleViewChange = (route) => {
    window.location.href = route;
  };

  return (
    <div id='l-view-container-home'  style={{ colorScheme: `${theme}`}}>
      <BetaAccess />
      <div className='theme-toggle-container'>
        <GitHubBtn theme={theme} />
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