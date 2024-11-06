import React from 'react';
import SeattleMap, { MapContextProvider } from './Map/SeattleMapView';
import { FilterContextProvider } from '../Filter/FilterContext';
import './PlaylistGen.css'
import { ToastContainer } from 'react-toastify';
import BetaAccess from '../Landing/BetaAccess';

const PlaylistGenView = () => {

    return (
        <div id='songs-list-view'  className={`snap-section all-bg-color`}>
            <BetaAccess />
            <div className='playlist-gen-view-container'>
                <FilterContextProvider>
                <MapContextProvider>
                    <SeattleMap/>
                </MapContextProvider>
                </FilterContextProvider>
            </div>
            <ToastContainer />
        </div>
    );
};

export default PlaylistGenView;