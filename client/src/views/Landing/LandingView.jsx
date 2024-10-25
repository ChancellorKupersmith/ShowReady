import React from 'react';
import { useState, useEffect, useRef } from 'react';
import Slider from 'react-slick'
import emailjs from '@emailjs/browser'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './Landing.css'
import { createPortal } from 'react-dom';

export const PlaylistCarousel = () => {
  const PlaylistCover = ({ img, imgheight, imgwidth, name, url }) => {
    const coverStyle = {
      borderRadius: '4px', // 2px for small devices 4px for large according to spotify use guidelines (https://developer.spotify.com/documentation/design)
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    };
  
    const imageStyle = {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      borderRadius: '4px', // 2px for small devices 4px for large according to spotify use guidelines (https://developer.spotify.com/documentation/design)
    };
  
    return (
      <a className='playlist-cover' href={url} target='_blank'>
        <div>
          {/* spotify attribution */}
          <div className='img-container' style={coverStyle}>
            <img src={img} alt='Playlist Cover' style={imageStyle} />
          </div>
          <div style={{
            zIndex: '5',
            bottom: '10px',
            left: '10px',
            color: '#fff',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: '5px 10px',
            borderRadius: '4px', // 2px for small devices 4px for large according to spotify use guidelines (https://developer.spotify.com/documentation/design)
          }}>
            {name}
          </div>
        </div>
      </a>
    );
  };

  const [radiogenPlaylists, setRadiogenPlaylists] = useState([]);
  let sliderRef = useRef(null);
  const StartPlaylistSlideShow = () => sliderRef.slickPlay();
  // on mount
  useEffect(() => {
    const fetchRadiogenPlaylists = async () => {
        try{
            const response = await fetch('/radiogen/random_playlists?limit=10');
            const data = await response.json();
            if(data){
              console.log(data)
              setRadiogenPlaylists(data.map((playlist, index) => 
                <PlaylistCover 
                  key={index}
                  name={playlist.name}
                  url={`https://open.spotify.com/playlist/${playlist.spotifyexternalid}`}
                  img={playlist.img} imgheight={playlist.imgheight} imgwidth={playlist.imgwidth}
                />
              ))
            }
        }catch(err){
            console.error(err)
        }
    };
    fetchRadiogenPlaylists();

    const hidePlaylistNavButtons = () => {
      const buttonsToHide = document.querySelectorAll('.slick-arrow');
      buttonsToHide.forEach(button => button.style.display = 'none');
    }
    hidePlaylistNavButtons();
    StartPlaylistSlideShow();
  }, []);

  const settings = {
    className: 'slider',
    infinite: true,
    speed: 2000,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    pauseOnHover: true
  };
  return (
    <div className='playlists-carousel-container'>
      <Slider ref={slider => (sliderRef = slider)} {...settings}>
          { radiogenPlaylists }
      </Slider>
    </div>
  );
};

const LandingView = () => {
  const [betaReqModalIsOpen, setBetaReqModalIsOpen] = useState(false);
  const BetaAccess = () => {
    const SERVICE_ID = 'service_9b08cdg'
    const TEMPLATE_ID = 'template_jxk6xlz'
    emailjs.init({
      publicKey: 'lq4m8SEWmg2UdekP9',
      blockHeadless: true,
      limitRate: {
        id: 'app',
        // Allow 1 request per 10s
        throttle: 10000,
      },
    });

    const [userEmail, setUserEmail] = useState('');
    const [userName, setUserName] = useState('');
    const [userNote, setUserNote] = useState('');
    const [invalidEmail, setInvalidEmail] = useState(false);
    const [invalidName, setInvalidName] = useState(false);

    const sendBetaAccessReqEmail = () => {
      if(!userName) setInvalidName(true);
      if(!userEmail) setInvalidEmail(true);
      if(!userName || !userEmail) return;
      const template_params = {
        user_email: userEmail,
        user_name: userName,
        user_note: userNote
      }
      emailjs.send(SERVICE_ID, TEMPLATE_ID, template_params).then(
        (response) => {
          console.log(response)
          toast.success('Request Sent')
        },
        (error) => {
          console.error(error);
          toast.error('Failed to send request, please try again');
        },
      );
    };

    return (
      <div className='beta-request-modal'>
        <h3>Beta Access Request</h3>
        <div className='input-container'>
          <label htmlFor='name-input'>Name:</label>
          <input 
            id='name-input' 
            type='text' value={userName}
            className={invalidName? 'invalid' : ''}
            placeholder={invalidName? 'FIELD REQUIRED' : ''}
            onChange={ event => setUserName(event.target.value) }
          />
        </div>
        <div className='input-container'>
          <label htmlFor='email-input'>Email:</label>
          <input
            id='email-input'
            type='text' value={userEmail}
            className={invalidEmail? 'invalid' : ''}
            placeholder={invalidEmail? 'FIELD REQUIRED' : ''}
            onChange={ event => setUserEmail(event.target.value) }
          />
        </div>
        <label id='notes-label' htmlFor='notes-input'>Notes:</label>
        <textarea id='notes-input' className='notes' type='text' value={userNote} onChange={ event => setUserNote(event.target.value) }/>
        <div>
          <button onClick={() => setBetaReqModalIsOpen(false)}>Cancel</button>
          <button onClick={sendBetaAccessReqEmail}>Send Request</button>
        </div>
      </div>
    )
  };

  const [totalSongsToday, setTotalSongsToday] = useState(0);
  const [totalSongsWeekend, setTotalSongsWeekend] = useState(0);
  const [totalSongsWeek, setTotalSongsWeek] = useState(0);
  const [totalSongsMonth, setTotalSongsMonth] = useState(0);
  const [totalSongsYear, setTotalSongsYear] = useState(0);
  const call_to_action_text = (
    <div className='call-to-action'>
      <h3>Discover and Support Local Artists</h3>
      <ul >
        <li>
          <strong>Prepare For The Show:</strong> Find upcoming concerts and generate custom playlists based on performing artists!
        </li>
        <li>
          <strong>Stay Current On Your Local Music Scene:</strong> Follow r a d i o g e n on streaming services to updated on upcoming artists and support local performers.
        </li>
        <li>
          <strong>Organic Discovery:</strong> Uncover new artists without paid promotions.
        </li>
      </ul>
    </div>
  );

  return (
      <div id='landing-view' className='landing-view snap-section'>
          <a className='beta-access-container' onClick={() => setBetaReqModalIsOpen(!betaReqModalIsOpen)}>
            Playlist generation for Spotify is still in beta, request access here 24/25 spots left.
          </a>
          {betaReqModalIsOpen && createPortal(<BetaAccess />, document.body)}
          <div className='call-to-action-container'>
            <h1>r a d i o g e n . l i v e</h1>
            { call_to_action_text }
          </div>
          <PlaylistCarousel />
          <ToastContainer />
      </div>
  );
};

export default LandingView;