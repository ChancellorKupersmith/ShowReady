import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import SongsListItem from './SongsListItem';
import AllBtn from './Source/All';
import { useSpotifyData, SpotifyBtn } from './Source/Spotify'
import { useYouTubeData, YouTubeBtn } from './Source/Youtube';
import { OrderByBtn, useSongsFilter } from '../Filter/FilterContext';
import SongsDarkSvg from '../../../assets/song-list(1).svg';
import SongsLightSvg from '../../../assets/song-list-light.svg';
import NextDarkSvg from '../../../assets/next-dark.svg';
import NextLightSvg from '../../../assets/next-light.svg';
import PrevDarkSvg from '../../../assets/prev-dark.svg';
import PrevLightSvg from '../../../assets/prev-light.svg';
import { SavePlaylistView } from "./Source/SavePlaylistView";
import { useThemeData } from '../../Home/Theme';
import '../../../styles/module/Map/songsList.css';

const SongsModal = ({ isFilterModalOpen, setIsFilterModalOpen, isSongsModalOpen, setIsSongsModalOpen }) => {
    // const [isSongsModalOpen, setIsOpen] = useState(false);
    const openCloseModal = () => {
        if(isFilterModalOpen) setIsFilterModalOpen(false);
        setIsSongsModalOpen(!isSongsModalOpen);
    };
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [songsList, setSongsList] = useState([]);
    // const [songsResultTotal, setSongsResultTotal] = useState(0);
    const [loading, setLoading] = useState(false); // Loading song list state
    const {theme} = useThemeData();
    
    const getTracksPageSize = () => {
        let pageSize = 6; // TODO: make dynamic to grow when generate playlist button not present
        if(window.innerHeight >= 909){
            pageSize = 9;
        }
        return pageSize;
    };

    // Fetch songs on: first load, page change, pageSize change, filter change
    const { filters } = useSongsFilter();
    useEffect(() => {
        const pageSize = getTracksPageSize();
        const fetchSongs = async () => {
            setLoading(true);
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
                const [songsList, total] = await response.json();
                if(total > 0){
                    setTotalPages(Math.ceil(total / pageSize));
                    setSongsList([...songsList]);
                }
            } catch(err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSongs();
    }, [page, filters]);

    // Check for cookies on each load
    const { updateSpotifyData } = useSpotifyData();
    const { updateYTData } = useYouTubeData();
    useEffect(() => {
        const getCookie = (name) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        };
      
        const parseSpotifyCookieData = () => {
            try{
                const spotifyAccessTokenCookie = getCookie('spotify_access_token');
                const spotifyRefreshTokenCookie = getCookie('spotify_refresh_token');
                const spotifyUserMetaCookie = getCookie('spotify_user_meta');
                let decodedSpotifyUserMetaCookie = decodeURIComponent(spotifyUserMetaCookie); 
                const spotifyUserMeta = JSON.parse(decodedSpotifyUserMetaCookie);
                if(spotifyUserMeta){
                    const spotifyData = {
                        accessToken: spotifyAccessTokenCookie,
                        refreshToken: spotifyRefreshTokenCookie,
                        username: spotifyUserMeta['username'],
                        spotifyID: spotifyUserMeta['id'],
                        profileImgURL: spotifyUserMeta['profileImg'],
                    };
                    updateSpotifyData(spotifyData);
                }

                const ytAccessTokenCookie = getCookie('google_access_token');
                const ytRefreshTokenCookie = getCookie('google_refresh_token');
                if(ytAccessTokenCookie){
                    const ytData = {
                        accessToken: ytAccessTokenCookie,
                        refreshToken: ytRefreshTokenCookie,
                    };
                    updateYTData(ytData);
                }
            } catch (err) {
                console.error(err);
            }
        };

        parseSpotifyCookieData();
    },[]);

    const handlePageChange = newPage => {
        if(newPage != page && newPage >= 1)
            setPage(newPage);    
    };
    const NextBtn = () => {
        const NextImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={theme === 'dark' ? NextDarkSvg : NextLightSvg}
                    alt='Next Page'
                />
            </div>
        );

        return (
            <button onClick={() => handlePageChange(page + 1)} disabled={false} >
                <NextImg />
            </button>
        );
    };
    const PrevBtn = () => {
        const PrevImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={ theme === 'dark' ? PrevDarkSvg : PrevLightSvg }
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
                    src={SongsDarkSvg}
                    alt='Songs'
                />
            </div>
        );
        return (
            <button id='songs-btn' className={isSongsModalOpen? 'selected' : ''} onClick={openCloseModal}><SongsImg /></button>
        );
    };

    return (
        <li className='nav-btn' style={{ colorScheme: `${theme}`}}>
            <SongsBtn />
            {isSongsModalOpen && createPortal(
                <div className='songs-view-container'>
                    <div className={`songs-list-container` }>
                        <div className='songs-list-header'>
                            <OrderByBtn />
                            <div className='source-tabs'>
                                <AllBtn />
                                <SpotifyBtn />
                                <YouTubeBtn />
                            </div>
                        </div>
                        <div className='songs-list-body'>
                            { loading ?
                                <div className="loading-animation"></div>
                            : 
                                <ul>
                                    { songsList.length > 0 &&
                                    songsList.map((song, index) =>
                                        <SongsListItem
                                            key={index}
                                            songId={song.songid}
                                            songTitle={song.songtitle}
                                            artistName={song.artist}
                                            artistUrl={song.artistspid ? `https://open.spotify.com/artist/${song.artistspid}` : song.artistlastfmurl}
                                            albumName={song.albumtitle}
                                            albumUrl={song.albumspid ? `https://open.spotify.com/album/${song.albumspid}` : song.albumlastfmurl}
                                            genres={song.genres}
                                            spId={song.spid}
                                            ytUrl={song.yturl}
                                            events={song.events}
                                            spotifyImg={song.spotifyimg}
                                        />)
                                    }
                                </ul>
                            }
                        </div>
                        <div className='footer'>
                            <div className='songs-page-nav'>
                                <PrevBtn />
                                <span className='songs-page-num'> Page {page} of {totalPages} </span>
                                <NextBtn />
                            </div>
                            <SavePlaylistView />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </li>
    );
};


export default SongsModal;