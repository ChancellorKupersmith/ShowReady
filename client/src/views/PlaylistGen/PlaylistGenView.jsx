import React from 'react';
import SeattleMap, { MapContextProvider } from './Map/SeattleMapView';
import SongsView from './SongsView';
import { FilterContextProvider } from '../Filter/FilterContext';
import { SavePlaylistSignalProvider } from './Source/SavePlaylistView';
import { useSourceData } from './Source/SourceContext';
import './PlaylistGen.css'
import { NotificationProvider } from '../Notification/NotificationView';

const PlaylistGenView = () => {
    const { bgColor } = useSourceData();

    return (
        <div id='songs-list-view'  className={`snap-section ${bgColor}`}>
            <div className='playlist-gen-view-container'>
                <FilterContextProvider>
                <NotificationProvider>
                <SavePlaylistSignalProvider>
                <MapContextProvider>
                    <SeattleMap/>
                    <SongsView />
                </MapContextProvider>
                </SavePlaylistSignalProvider>
                </NotificationProvider>
                </FilterContextProvider>
            </div>
        </div>
    );
};

export default PlaylistGenView;