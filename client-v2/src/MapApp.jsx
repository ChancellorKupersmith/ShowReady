import React, { Suspense } from "react";
import { ThemeContextProvider } from './views/Home/Theme.jsx';
import { SpotifyContextProvider } from "./views/Map/Songs/Source/Spotify";
import { YouTubeContextProvider } from "./views/Map/Songs/Source/Youtube.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/base.css";
import "./styles/theme.css";
import "./styles/layout/root.css";

const MapView = React.lazy(() => import("./views/Map/MapView.jsx"));

function MapApp() {
  return (
    <ThemeContextProvider>
    <SpotifyContextProvider>
    <YouTubeContextProvider>
    <Suspense fallback={<div>Loading...</div>}>
        <ToastContainer />
        <MapView />
    </Suspense>
    </YouTubeContextProvider>
    </SpotifyContextProvider>
    </ThemeContextProvider>
  );
}

export default MapApp;
