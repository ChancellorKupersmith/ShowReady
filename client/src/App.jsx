import React, { useRef } from 'react';
import './App.css';
import LandingView from './views/Landing/LandingView';
import SongsListView from './views/SongsList/SongsListView';
import { FilterContextProvider } from './views/Filter/FilterContext';

function App() {
  const containerRef = useRef(null);

  const scrollToTop = () => {
    // console.log('Scroll Top')
    document.getElementById('landing-view').scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    // console.log(`Scroll Botom: ${containerRef.current.scrollHeight}`)
    document.getElementById('songs-list-view').scrollIntoView({ behavior: 'smooth' });

  };

  return (
    <>
      <Navbar scrollToTop={scrollToTop} scrollToBottom={scrollToBottom} />
      <div className='snap-container' ref={containerRef}>
        <LandingView />
        <FilterContextProvider>
          <SongsListView />
        </FilterContextProvider>
      </div>
    </>
  );
};


const Navbar = ({ scrollToTop, scrollToBottom }) => {
  return (
    <div id="navbar" className="navbar">
      <a onClick={scrollToTop}>Seattle Live Radio</a>
      <a onClick={scrollToBottom}>Playlist Generator</a>
    </div>
  );
};

export default App;
