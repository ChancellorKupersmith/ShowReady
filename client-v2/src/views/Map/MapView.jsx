import React from 'react';
import SeattleMap, { MapContextProvider } from './SeattleMap';
import { FilterContextProvider } from './Filter/FilterContext';
import { SourceContextProvider } from './Songs/Source/SourceContext';
import NavBar from './Navbar';


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