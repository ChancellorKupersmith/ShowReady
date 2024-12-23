import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FMRadio from './FMRadio';
import BetaAccess from './BetaAccess';
import '../../styles/layout/Home/home.css';
import '../../styles/module/Home/home.css';
import { useSpotifyData } from '../Map/PlaylistGen/Source/Spotify';


const HomeView = () => {
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

  const navigate = useNavigate();
  const handleViewChange = (route) => navigate(route);

  return (
    <div id='l-view-container-home'>
      <BetaAccess />
      <div id='l-home-body'>
        <header id='l-home-header'>
          <h2 className='title'>Show Ready</h2>
        </header>
        <div id='l-home-body-grabber'>
          <FMRadio />
          <p className='grabber-description'>A Playlist generator for upcoming Seattle Concerts!</p>
        </div>
        <div id='l-home-call-to-action'>
          <h1>You Ready?</h1>
          <button className='open-map-view' onClick={() => handleViewChange('/map')}>Discover</button>
        </div>
      </div>
      <div id='l-home-footer'>footer</div>
    </div>
  );
};

export default HomeView;