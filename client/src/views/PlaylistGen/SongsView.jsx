import React, { useState, useEffect } from 'react';
import SongsListItem from './SongsListItem';
import CSVBtn from './Source/CSV';
import SongsSvg from '../../assets/song-list.svg'
import NextSvg from '../../assets/next.svg'
import PrevSvg from '../../assets/prev.svg'
import { OrderByBtn, useSongsFilter } from '../Filter/FilterContext';
import { SavePlaylistView } from "./Source/SavePlaylistView";
import { SpotifyContextProvider, useSpotifyData, SpotifyBtn } from './Source/Spotify'
import { YouTubeBtn } from './Source/Youtube';
import { createPortal } from 'react-dom';
import { useSourceData } from './Source/SourceContext';

const SongsView = () => {
    const [isOpen, setIsOpen] = useState(false);
    const openCloseModal = () => setIsOpen(!isOpen)
    /* TODO: Make songs lists page size dynamic to window size */
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { filters } = useSongsFilter();
    const [totalPages, setTotalPages] = useState(1);
    const [songs, setSongs] = useState([]);
    const [events, setEvents] = useState({});
    const { bgColor } = useSourceData()

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
                    setTotalPages(Math.ceil(data[0][0].total / pageSize))
                console.log(data);
                setSongs([...data[0]]);
                setEvents(data[1])
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
    const NextBtn = () => {
        const NextImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={NextSvg}
                    alt='Next Page'
                />
            </div>
        );

        return (
            <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} >
                <NextImg />
            </button>
        );
    };
    const PrevBtn = () => {
        const PrevImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={PrevSvg}
                    alt='Previous Page'
                />
            </div>
        );

        return(
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} >
                <PrevImg />
            </button>
        );
    };

    const SongsBtn = () => {
        const SongsImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={SongsSvg}
                    alt='Songs'
                />
            </div>
        );
        return (
            <button id='songs-btn' className={isOpen? 'selected' : ''} onClick={openCloseModal}><SongsImg /></button>
        );
    };

    return (
        <div>
            <SongsBtn />
            {isOpen && createPortal(
                <SpotifyContextProvider>
                    <div className='songs-view-container'>
                        {/* TODO: Make songs lists page size dynamic to window size */}
                        <div className={`songs-list-container ${bgColor}`}>
                            <OrderByBtn />
                            <div className='source-tabs'>
                                <CSVBtn />
                                <SpotifyBtn />
                                <YouTubeBtn />
                            </div>
                            <ul>
                                { songs.length > 0 &&
                                songs.map((song, index) =>
                                    <SongsListItem
                                        key={index}
                                        songTitle={song.songtitle}
                                        artistName={song.artist}
                                        albumName={song.albumtitle}
                                        eventLocation={song.venue}
                                        date={song.eventdate}
                                        spId={song.spid}
                                        ytUrl={song.yturl}
                                        events={events[song.artist]}
                                    />)
                                }
                            </ul>
                            <div className='footer'>
                                <PrevBtn />
                                <span> Page {page} of {totalPages} </span>
                                <NextBtn />
                            </div>
                            <SavePlaylistView />
                        </div>
                    </div>
                </SpotifyContextProvider>,
                document.body
            )}
        </div>
    );
}


export default SongsView;