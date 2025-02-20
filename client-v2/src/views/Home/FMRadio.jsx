import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useThemeData } from './Theme';
import '../../styles/module/Home/fmradio.css';

const FMRadioClockContext = createContext();
export const useFMRadioClock = () => useContext(FMRadioClockContext);

export const FMRadioClockContextProvider = ({ children }) => {
  const [clockIndex, setClockIndex] = useState(0);
  const [isManual, setIsManual] = useState(false);
  const totalSteps = 12;
  const intervalDuration = 3000;

  useEffect(() => {
    if (!isManual) {
      const intervalID = setInterval(() => {
        setClockIndex(prev => (prev + 1) % totalSteps);
      }, intervalDuration);
      return () => clearInterval(intervalID);
    }
  }, [isManual, totalSteps, intervalDuration]);

  return (
    <FMRadioClockContext.Provider value={{ clockIndex, totalSteps, setClockIndex, setIsManual }}>
      { children }
    </FMRadioClockContext.Provider>
  );
};

const PlaylistCover = ({ playlists }) => {
  const { clockIndex } = useFMRadioClock();

  const coverStyle = {
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  };

  const imageStyle = {
    width: '100%',
    maxHeight: '220px',
    objectFit: 'cover',
    borderRadius: '4px',
  };

  return (
    <div>
      {playlists.length > 0 &&
        <a
          className='playlist-cover'
          href={playlists[clockIndex].url}
          target='_blank'
          rel="noopener noreferrer"
        >
          <div>
            <div className='img-container' style={coverStyle}>
              <img src={playlists[clockIndex].img} alt='Playlist Cover' style={imageStyle} />
            </div>
          </div>
        </a>
      }
    </div>
  );
};

const PlaylistLabel = ({ playlists }) => {
  const { clockIndex } = useFMRadioClock();
  return (
    <div className='playlist-label'>
      {playlists.length > 0 && playlists[clockIndex].name}
    </div>
  );
};

const Knob = () => {
  const { clockIndex, totalSteps } = useFMRadioClock();
  const knobAngle = clockIndex * 360 / totalSteps;
  return (
    <line
      className="knob"
      x1="75"
      y1="15"
      x2="75"
      y2="35"
      style={{
        transform: `rotate(${knobAngle}deg)`,
        transformOrigin: '75px 75px'
      }}
    />
  );
};

// --- Dial component that handles both dragging and clicking ---
const Dial = () => {
  const { totalSteps, setClockIndex, setIsManual } = useFMRadioClock();
  const { theme } = useThemeData();
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);

  // The center of the dial (matching the circle's cx and cy)
  const centerX = 75;
  const centerY = 75;

  // Calculate angle from dial center and update clockIndex based on discrete steps.
  const updateAngle = (clientX, clientY, svgRect) => {
    const x = clientX - svgRect.left;
    const y = clientY - svgRect.top;
    const angleRad = Math.atan2(y - centerY, x - centerX);
    let angleDeg = angleRad * 180 / Math.PI;
    if (angleDeg < 0) angleDeg += 360;
    const stepSize = 360 / totalSteps;
    const step = Math.round(angleDeg / stepSize) % totalSteps;
    setClockIndex(step);
  };

  const handleMouseDown = (e) => {
    setIsManual(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!dragStart) return;
    // Calculate movement distance to determine if dragging is occurring.
    const distance = Math.sqrt(
      (e.clientX - dragStart.x) ** 2 + (e.clientY - dragStart.y) ** 2
    );
    // If movement exceeds a threshold, consider it a drag.
    if (distance > 5) {
      setIsDragging(true);
      const svgRect = e.currentTarget.getBoundingClientRect();
      updateAngle(e.clientX, e.clientY, svgRect);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDragging) setClockIndex(prev => (prev + 1) % totalSteps);
    setIsDragging(false);
    setDragStart(null);
    setIsManual(false);
  };

  useEffect(() => {
    if (dragStart) {
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [dragStart, isDragging]);

  return (
    <svg
      width="200"
      height="200"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      style={{ cursor: 'pointer' }}
    >
      <circle
        cx="75"
        cy="75"
        r="60"
        stroke={theme === 'dark' ? "grey" : "#333333"}
        fill={theme === 'dark' ? "grey" : "#333333"}
        strokeWidth="5"
      />
      <Knob />
    </svg>
  );
};

const FMRadio = () => {
  const [radiogenPlaylists, setRadiogenPlaylists] = useState([]);

  useEffect(() => {
    const fetchRadiogenPlaylists = async () => {
      try {
        const response = await fetch('/radiogen/random_playlists?limit=12');
        const data = await response.json();
        if (data) {
          setRadiogenPlaylists(data.reduce((acc, playlist) => {
            acc.push({
              name: playlist.name,
              url: `https://open.spotify.com/playlist/${playlist.spotifyexternalid}`,
              img: playlist.img,
              imgheight: playlist.imgheight,
              imgwidth: playlist.imgwidth
            });
            return acc;
          }, []));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRadiogenPlaylists();
  }, []);

  return (
    <div className='radio-container'>
      <div className="radio">
        <FMRadioClockContextProvider>
          <h3 className="brand-logo">Follow on Spotify!</h3>
          <div className="top-panel">
            <div className='radio-display'>
              <PlaylistCover playlists={radiogenPlaylists} />
            </div>
            <div className="dial">
              <Dial />
            </div>
          </div>
          <PlaylistLabel playlists={radiogenPlaylists} />
        </FMRadioClockContextProvider>
      </div>
    </div>
  );
};

export default FMRadio;
