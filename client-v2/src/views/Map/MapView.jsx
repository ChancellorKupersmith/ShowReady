import React from 'react';
import SeattleMap, { MapContextProvider } from './PlaylistGen/Map/SeattleMapView';
import { FilterContextProvider } from './Filter/FilterContext';
import { SourceContextProvider } from './PlaylistGen/Source/SourceContext';
import NavBar from './Navbar';
import './PlaylistGen/PlaylistGen.css'
import { ToastContainer } from 'react-toastify';

const MapView = () => {

    return (
        <FilterContextProvider>
        <MapContextProvider>
        <SourceContextProvider>
          <SeattleMap />
          <NavBar />
        </SourceContextProvider>
        </MapContextProvider>
        </FilterContextProvider>
    );
}

export default MapView;