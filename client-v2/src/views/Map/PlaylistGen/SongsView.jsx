import React, { useState, useEffect } from 'react';
import SongsListItem from './SongsListItem';
import AllBtn from './Source/All';
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
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { filters } = useSongsFilter();
    const [totalPages, setTotalPages] = useState(1);
    const [songs, setSongs] = useState([]);
    const [events, setEvents] = useState({});
    const { bgColor } = useSourceData()
    const [loading, setLoading] = useState(false); // Loading song list state

    // Fetch songs on: first load, page change, pageSize change, filter change
    useEffect(() => {
        const fetchSongs = async () => {
            setLoading(true);
            try{
                const postData = {
                    page: page,
                    limit: pageSize,
                    filters: filters
                };
                console.log(filters)
                const response = await fetch('/songs_list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const data = await response.json();
                if(data[0].length > 0)
                    setTotalPages(Math.ceil(data[0][0].total / pageSize))
                console.log(data)
                setSongs([...data[0]]);
                setEvents(data[1]);
            } catch(err) {
                console.error(err);
            } finally {
                setLoading(false);
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
        <li className='nav-btn'>
            <SongsBtn />
            {isOpen && createPortal(
                <SpotifyContextProvider>
                    <div className='songs-view-container'>
                        <div className={`songs-list-container ${bgColor}`}>
                            <OrderByBtn />
                            <div className='source-tabs'>
                                <AllBtn />
                                <SpotifyBtn />
                                <YouTubeBtn />
                            </div>
                            { loading ?
                                <div className="loading-animation">Loading...</div>
                            : 
                                <ul>
                                    { songs.length > 0 &&
                                    songs.map((song, index) =>
                                        <SongsListItem
                                            key={index}
                                            songTitle={song.songtitle}
                                            artistName={song.artist}
                                            artistUrl={song.artistspid ? `https://open.spotify.com/artist/${song.artistspid}` : song.artistlastfmurl}
                                            albumName={song.albumtitle}
                                            albumUrl={song.albumspid ? `https://open.spotify.com/album/${song.albumspid}` : song.albumlastfmurl}
                                            genre={song.genre}
                                            spId={song.spid}
                                            ytUrl={song.yturl}
                                            events={events[song.artist]}
                                            spotifyImg={song.spotifyimg}
                                        />)
                                    }
                                </ul>
                            }
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
        </li>
    );
}


export default SongsView;