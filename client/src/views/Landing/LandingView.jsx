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

const TypingAnimation = () => {
  const phrases = [
    'radio is discovering a new favorite',
    'radio is remembering a classic',
    'radio is staying current',
    'radio is no decision fatigue',
  ];
  const [displayText, setDisplayText] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 45; // milliseconds
  const deletingSpeed = 50; // milliseconds
  const pauseDuration = 400; // milliseconds

  // typing animation
  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];
    let timer;
    if (isDeleting) {
      if (displayText.length > 9) {
        timer = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, deletingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
          setCurrentPhraseIndex((prevIndex) => {
            return (prevIndex + 1) % phrases.length
          });
        }, pauseDuration - 400);
      }
    } else {
      if (displayText.length < currentPhrase.length) {
        timer = setTimeout(() => {
          setDisplayText(currentPhrase.slice(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentPhraseIndex]);

  return (
    <div style={{ left: 0, fontSize: '24px', fontFamily: 'monospace' }}>
      {displayText}
    </div>
  );
};

const FMRadio = () => {
  const PlaylistCover = ({ img, url }) => {
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
        </div>
      </a>
    );
  };

  const [radiogenPlaylists, setRadiogenPlaylists] = useState([]);
  const [playlistsCurrentIndex, setPlaylistCurIndex] = useState(0);
  const [knobAngle, setKnobAngle] = useState(0);
  // on mount
  useEffect(() => {
    const fetchRadiogenPlaylists = async () => {
      try{
          const response = await fetch('/radiogen/random_playlists?limit=10');
          const data = await response.json();
          if(data){
            console.log(data)
            setRadiogenPlaylists(data.reduce((acc, playlist) => {
              acc.push({
                name: playlist.name,
                url: `https://open.spotify.com/playlist/${playlist.spotifyexternalid}`,
                img: playlist.img,
                imgheight: playlist.imgheight,
                imgwidth: playlist.imgwidth
              });
              return acc;
            }, []))
          }
      }catch(err){
          console.error(err)
      }
    };
    fetchRadiogenPlaylists();

    const intervalID = setInterval(() => {
      setKnobAngle((prev) => (prev + 36) % 360);
      setPlaylistCurIndex((prev) => (prev + 1) % 10);
    }, 3000);

    return () => clearInterval(intervalID);
  }, []);
  
  return (
    <div className="radio">
      <div className="brand-logo">r a d i o g e n</div>
      <div className="top-panel">
        <div className='radio-display'>
          { radiogenPlaylists.length && 
            <PlaylistCover 
              key={playlistsCurrentIndex}
              img={radiogenPlaylists[playlistsCurrentIndex].img}
              url={radiogenPlaylists[playlistsCurrentIndex].url}
            />
          }
        </div>
        <div className="dial">
          <svg width="200" height="200">
            <circle cx="75" cy="75" r="60" stroke="grey" fill='grey' strokeWidth="5" />
            <line className="knob" x1="75" y1="15" x2="75" y2="35"
              style={{'transform': `rotate(${knobAngle}deg)`}}
            />
          </svg>
        </div>
      </div>
      <div className='playlist-label'>
        { radiogenPlaylists.length &&
          radiogenPlaylists[playlistsCurrentIndex].name 
        }
      </div>
    </div>
  );
};

const SearchRadiogenPlaylists = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      const fetchData = async () => {
          if (!query) {
              setResults([]);
              return;
          }
          setLoading(true);
          try {
              const response = await fetch(`/radiogen/playlists?name=${query}`);
              const data = await response.json();
              console.log(data)
              const names = data.map((result, index) => (
                <li key={index}>
                  <a href={`https://open.spotify.com/playlist/${result['spotifyexternalid']}`} target='_blank'>
                    {result.name}
                  </a>
                </li>
              ));
              setResults(names);
          } catch (error) {
              console.error('Error fetching data:', error);
          } finally {
              setLoading(false);
          }
      };

      const delayDebounceFn = setTimeout(() => {
          fetchData();
      }, 300);

      return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
      <div className='playlist-search'>
          <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
          />
          {loading && <div>Loading...</div>}
          {results.length > 0 && 
              <ul>
                  {results}
              </ul>
          }
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
        <label id='notes-label' htmlFor='notes-input'>Comment:</label>
        <textarea
          id='notes-input'
          className='notes'
          type='text'
          value={userNote}
          placeholder='anything to note'
          onChange={ event => setUserNote(event.target.value) }/>
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
            <TypingAnimation />
            { call_to_action_text }
          </div>
          <SearchRadiogenPlaylists />
          <FMRadio />
          <ToastContainer />
      </div>
  );
};

export default LandingView;