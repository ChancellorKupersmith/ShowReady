import React from 'react';
import SeattleMap from './SeattleMapView';
import SongListView from './SongListView';
import { FilterContextProvider } from '../Filter/FilterContext';
import { useSourceData } from './Source/SourceContext';
import './PlaylistGen.css'

const PlaylistGenView = () => {
    const { bgColor } = useSourceData();

    return (
        <div id='songs-list-view'  className='snap-section' style={{backgroundColor: bgColor}}>
            <div className='playlist-gen-view-container'>
                <FilterContextProvider>
                    <SeattleMap/>
                    <SongListView />
                </FilterContextProvider>
            </div>
        </div>
    );
};

export default PlaylistGenView;