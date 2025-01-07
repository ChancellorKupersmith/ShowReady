import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './styles/base.css';
import './styles/theme.css';
import './styles/layout/root.css';
import { SpotifyContextProvider } from './views/Map/Songs/Source/Spotify';

const HomeView = React.lazy(() => import('./views/Home/HomeView.jsx'));
const MapView = React.lazy(() => import('./views/Map/MapView.jsx'));

function App() {

  return (
    <Router>
      <Suspense>
      <SpotifyContextProvider>
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </SpotifyContextProvider>
      </Suspense>
    </Router>
  );
}


export default App;
