import React, { useState, useEffect } from 'react';
import SongsListItem from './SongsListItem';
import AllBtn from './Source/All';
import SongsDarkSvg from '../../../assets/song-list(1).svg'
import NextDarkSvg from '../../../assets/next-dark.svg'
import NextDLightSvg from '../../../assets/next-light.svg'
import PrevDarkSvg from '../../../assets/prev-dark.svg'
import PrevLightSvg from '../../../assets/prev-light.svg'
import { OrderByBtn, useSongsFilter } from '../Filter/FilterContext';
import { SavePlaylistView } from "./Source/SavePlaylistView";
import { SpotifyContextProvider, useSpotifyData, SpotifyBtn } from './Source/Spotify'
import { YouTubeBtn } from './Source/Youtube';
import { createPortal } from 'react-dom';
import { useSourceData } from './Source/SourceContext';
import '../../../styles/module/Map/songsList.css';

const SongsModal = () => {
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

    const getTracksPageSize = () => {
        const isMobileScreen = window.innerWidth <= 750;
        return isMobileScreen ? 7 : 10;
    }
    // Fetch songs on: first load, page change, pageSize change, filter change
    useEffect(() => {
        const fetchSongs = async () => {
            setLoading(true);
            try{
                const postData = {
                    page: page,
                    limit: getTracksPageSize(),
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


    const { updateSpotifyData } = useSpotifyData();
  const getCookie = (name) => {

    const value = `; ${document.cookie}`;
    console.log(value);
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };
  useEffect(() => {
    try{
      const accessTokenCookie = getCookie('access_token');
      const refreshTokenCookie = getCookie('refresh_token');
      const userMetaCookie = getCookie('user_meta');
      let decodeduserMetaCookie = decodeURIComponent(userMetaCookie); 
      const userMeta = JSON.parse(decodeduserMetaCookie);
      if(userMeta){
          const spotifyData = {
            accessToken: accessTokenCookie,
            refreshToken: refreshTokenCookie,
            username: userMeta['username'],
            spotifyID: userMeta['id'],
            profileImgURL: userMeta['profileImg'],
          };
          console.log(spotifyData)
          updateSpotifyData(spotifyData);
      }
    } catch (err) {
      console.error(err);
    }
  },[]);

    const handlePageChange = newPage => {
        if(newPage != page && newPage >= 1 && newPage <= totalPages)
            setPage(newPage);    
    };
    const NextBtn = () => {
        const NextImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={NextDarkSvg}
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
                    src={PrevDarkSvg}
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
            <button id='songs-btn' className={isOpen? 'selected' : ''} onClick={openCloseModal}><SongsImg /></button>
        );
    };

    return (
        <li className='nav-btn'>
            <SongsBtn />
            {isOpen && createPortal(
                // <SpotifyContextProvider>
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
                            </div>
                            <div className='footer'>
                                <PrevBtn />
                                <span className='footer-page-num'> Page {page} of {totalPages} </span>
                                <NextBtn />
                            </div>
                            <SavePlaylistView />
                        </div>
                    </div>,
                // </SpotifyContextProvider>,
                document.body
            )}
        </li>
    );
}


export default SongsModal;