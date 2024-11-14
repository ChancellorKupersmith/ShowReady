import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BetaAccess from './BetaAccess';
import FMRadio from './FMRadio';
import './Landing.css'

const TypingAnimation = () => {
  const phrases = [
    'radio is finding a new favorite.',
    'radio is no decision fatigue.',
    'radio is nostalgia.',
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
          <BetaAccess />
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