import React from 'react';
import SeattleMap, { MapContextProvider } from './Map/SeattleMapView';
import { FilterContextProvider } from '../Filter/FilterContext';
import { SavePlaylistSignalProvider } from './Source/SavePlaylistView';
import './PlaylistGen.css'
import { NotificationProvider } from '../Notification/NotificationView';
import { ToastContainer } from 'react-toastify';

const PlaylistGenView = () => {

    return (
        <div id='songs-list-view'  className={`snap-section all-bg-color`}>
            <div className='playlist-gen-view-container'>
                <FilterContextProvider>
                <NotificationProvider>
                <SavePlaylistSignalProvider>
                <MapContextProvider>
                    <SeattleMap/>
                </MapContextProvider>
                </SavePlaylistSignalProvider>
                </NotificationProvider>
                </FilterContextProvider>
            </div>
            <ToastContainer />
        </div>
    );
};

export default PlaylistGenView;