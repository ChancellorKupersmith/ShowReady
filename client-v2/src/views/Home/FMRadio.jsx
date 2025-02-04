import React, { createContext, useContext, useState, useEffect } from 'react';
import { useThemeData } from './Theme';
import '../../styles/module/Home/fmradio.css'
// a clock to keep knob and playlist cover animations in sync
const FMRadioClockContext = createContext();
export const useFMRadioClock = () => useContext(FMRadioClockContext);
export const FMRadioClockContextProvider = ({ children }) => {
  const [clockIndex, updateIndex] = useState(0);
  const totalSteps = 10;
  const intervalDuration = 3000;

  useEffect(() => {
      const intervalID = setInterval(() => {
        updateIndex( prev => (prev + 1) % totalSteps);
      }, intervalDuration);

      return () => clearInterval(intervalID);
  }, []);

  return (
    <FMRadioClockContext.Provider value={{clockIndex, totalSteps}}>
      { children }
    </FMRadioClockContext.Provider>
  );
};

const PlaylistCover = ({ playlists }) => {
  const { clockIndex } = useFMRadioClock();

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
    maxHeight: '220px',
    objectFit: 'cover',
    borderRadius: '4px', // 2px for small devices 4px for large according to spotify use guidelines (https://developer.spotify.com/documentation/design)
  };

  return (
    <div>
        { playlists.length &&
            <a className='playlist-cover' href={playlists[clockIndex].url} target='_blank'>
                <div>
                    {/* spotify attribution */}
                    <div className='img-container' style={coverStyle}>
                    <img src={playlists[clockIndex].img} alt='Playlist Cover' style={imageStyle} />
                    </div>
                </div>
            </a>
        }
    </div>
  );
};

const Knob = () => {
  const { clockIndex, totalSteps } = useFMRadioClock();
  const knobAngle = clockIndex * 360 / totalSteps;
  return (
    <line className="knob" x1="75" y1="15" x2="75" y2="35"
      style={{'transform': `rotate(${knobAngle}deg)`}}
    />
  );
};

const PlaylistLabel = ({ playlists }) => {
    const { clockIndex } = useFMRadioClock();
    return (
        <div className='playlist-label'>
            { playlists.length &&
                playlists[clockIndex].name 
            }
        </div>
    );
}


const FMRadio = () => {
  const [radiogenPlaylists, setRadiogenPlaylists] = useState([]);
  const { theme } = useThemeData();
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
  }, []);
  
  return (
    <div className='radio-container'>
      <div className="radio">
        <FMRadioClockContextProvider>
          <h3 className="brand-logo">Follow on Spotify!</h3>
          <div className="top-panel">
            <div className='radio-display'>
                <PlaylistCover playlists={radiogenPlaylists}/>
            </div>
            <div className="dial">
              <svg width="200" height="200">
                <circle cx="75" cy="75" r="60" stroke={theme === 'dark' ? "grey" : "#333333"} fill={theme === 'dark' ? "grey" : "#333333"} strokeWidth="5" />
                <Knob />
              </svg>
            </div>
          </div>
          <PlaylistLabel playlists={radiogenPlaylists}/>
        </FMRadioClockContextProvider>
      </div>
    </div>
  );
};

export default FMRadio;