import React, { useRef, useEffect, useState, createContext,  useContext  } from 'react';
import { HashRouter as Router, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import LandingView from './views/Landing/LandingView';
import SongsListView from './views/SongsList/SongsListView';
import { FilterContextProvider } from './views/Filter/FilterContext';


function App() {
  const containerRef = useRef(null);
  

  return (
    <Router>
      <Navbar />element
      <div className='snap-container' ref={containerRef}>
        <Routes>
          <Route path='/' element={<LandingView />}/>
          <Route path='/playlist_gen' element={<PlaylistGen />}/>
        </Routes>
      </div>
    </Router>
  );
};

const PlaylistGen = () => {

  return (
    <FilterContextProvider>
        <SongsListView />
    </FilterContextProvider>
  );
}

const Navbar = () => {
  return (
    <nav id="navbar" className="navbar">
      <Link to='/' >Seattle Live Radio</Link>
      <Link to='/playlist_gen'>Playlist Generator</Link>
    </nav>
  );
};

export default App;
