import React, { useState, useEffect } from 'react';
import SongsListItem from './SongsListItem';
import FilterView from '../Filter/FilterView';
import CSVBtn from './Source/CSV';
import { useSongsFilter } from '../Filter/FilterContext';
import { SavePlaylistView } from "./Source/SavePlaylistView";
import { SpotifyContextProvider, useSpotifyData, SpotifyBtn } from './Source/Spotify'
import { YouTubeBtn } from './Source/Youtube';

const SongListView = () => {
    const [page, setPage] = useState(1);
    /* TODO: Make songs lists page size dynamic to window size */
    const [pageSize, setPageSize] = useState(10);
    const { filters } = useSongsFilter();
    const [totalPages, setTotalPages] = useState(1);
    const [songs, setSongs] = useState([]);

    // Fetch songs on: first load, page change, pageSize change, filter change
    useEffect(() => {
        const fetchSongs = async () => {
            try{
                const postData = {
                    page: page,
                    limit: pageSize,
                    filters: filters
                };
                const response = await fetch('/songs_list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const data = await response.json();
                if(data.length > 0)
                    setTotalPages(Math.ceil(data[0].total / pageSize))
                // console.log(data);
                setSongs([...data]);
            }catch(err){
                console.error(err)
            }
        };

        fetchSongs();
    }, [page, pageSize, filters]);

    const handlePageChange = newPage => {
        if(newPage != page && newPage >= 1 && newPage <= totalPages)
            setPage(newPage);    
    };

    return (
        <div className='songs-list-container'>
            <SpotifyContextProvider>
                <div style={{display: 'flex', width: '100%'}}>
                    <CSVBtn />
                        <SpotifyBtn />

                    <YouTubeBtn />
                </div>
                <FilterView />
                {/* TODO: Make songs lists page size dynamic to window size */}
                <div style={{minHeight: 'fit-content', height: '100%'}}>
                    <ul className='songs-container'>
                        {songs.length > 0 && songs.map((song, index) => (<SongsListItem key={index} songTitle={song.title} artistName={song.artist} eventLocation={songs.venue} date={song.eventdate}/>))}
                    </ul>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} >
                            Previous
                        </button>
                        <span style={{color: '#333'}}>
                            Page {page} of {totalPages}
                        </span>
                        <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} >
                            Next
                        </button>
                    </div>
                </div>
                <SavePlaylistView />
            </SpotifyContextProvider>
        </div>
    );
}


export default SongListView;