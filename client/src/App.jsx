import React from 'react';
import { HashRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import './views/PlaylistGen/PlaylistGen.css'
import LandingView from './views/Landing/LandingView';
import PlaylistGenView from './views/PlaylistGen/PlaylistGenView';
import { SourceContextProvider } from './views/PlaylistGen/Source/SourceContext';

const Navbar = () => {
  return (
    <nav id="navbar" className="navbar">
      <Link to='/' >Seattle Live Radio</Link>
      <Link to='/playlist_gen'>Playlist Generator</Link>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <Navbar />
        <Routes>
          <Route path='/' element={<LandingView />}/>
          <Route path='/playlist_gen' element={
              <SourceContextProvider>
                <PlaylistGenView />
              </SourceContextProvider>
          }/>
        </Routes>
    </Router>
  );
}


export default App;
