import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SpotifyContextProvider } from './views/Map/Songs/Source/Spotify';
import { YouTubeContextProvider } from './views/Map/Songs/Source/Youtube.jsx';
import { ThemeContextProvider } from './views/Home/Theme.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/base.css';
import './styles/theme.css';
import './styles/layout/root.css';

const HomeView = React.lazy(() => import('./views/Home/HomeView.jsx'));
const MapView = React.lazy(() => import('./views/Map/MapView.jsx'));

function App() {

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
      <SpotifyContextProvider>
      <YouTubeContextProvider>
      <ThemeContextProvider>
      <ToastContainer />
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/map" element={<MapView />} />
        </Routes>
      </ThemeContextProvider>
      </YouTubeContextProvider>
      </SpotifyContextProvider>
      </Suspense>
    </Router>
  );
}


export default App;
