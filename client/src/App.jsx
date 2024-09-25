import React from 'react';
import { HashRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';
import './views/PlaylistGen/PlaylistGen.css'
import HomeSvg from './assets/home.svg'
import LandingView from './views/Landing/LandingView';
import PlaylistGenView from './views/PlaylistGen/PlaylistGenView';
import { SourceContextProvider } from './views/PlaylistGen/Source/SourceContext';

const Navbar = () => {
  const HomeImg = () => (
    <div className="svg-container">
        <img
            loading="lazy"
            src={HomeSvg}
            alt='home'
        />
    </div>
  );
  return (
    <nav id="navbar" className="navbar">
      <Link className='home-btn' to='/' ><HomeImg /></Link>
      <Link to='/playlist_gen'>r a d i o g e n</Link>
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
