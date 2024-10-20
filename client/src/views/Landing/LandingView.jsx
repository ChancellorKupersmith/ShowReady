import React from 'react';
import { useState, useEffect, useRef } from 'react';
import Slider from 'react-slick'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './Landing.css'

export const PlaylistCarousel = () => {
  const PlaylistCover = ({ img, imgheight, imgwidth, name }) => {
    const coverStyle = {
      // border: 'solid red',
      // width: `300px`, // Has to be 640, 300, or 50px according to spotify use guidelines (https://developer.spotify.com/documentation/design)
      // height: `300px`, // Has to be 640, 300, or 50px according to spotify use guidelines (https://developer.spotify.com/documentation/design)
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
      <div className='playlist-cover'>
        {/* spotify attribution */}
        <div className='img-container' style={coverStyle}>
          <img src={img} alt={name} style={imageStyle} />
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
              setRadiogenPlaylists(data.map((playlist, index) => <PlaylistCover key={index} name={playlist.name} img={playlist.img} imgheight={playlist.imgheight} imgwidth={playlist.imgwidth}/>))
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
}

const LandingView = () => {
  const [totalSongsToday, setTotalSongsToday] = useState(0);
  const [totalSongsWeekend, setTotalSongsWeekend] = useState(0);
  const [totalSongsWeek, setTotalSongsWeek] = useState(0);
  const [totalSongsMonth, setTotalSongsMonth] = useState(0);
  const [totalSongsYear, setTotalSongsYear] = useState(0);
  // fetch stats data
  useEffect(() => {
    const fetchTotalSongs = async () => {
      const feftchTotal = async (timeRange) => {
        try {
            const response = await fetch(`/songs_list/total_songs?time=${timeRange}`);
            const data = await response.json();
            return data['count'];
        } catch(err){
            console.error(err)
        }
      }

      const songsToday = await feftchTotal('today');
      const songsThisWeekend = await feftchTotal('weekend');
      const songsThisWeek = await feftchTotal('week');
      const songsThisMonth = await feftchTotal('month');
      const songsThisYear = await feftchTotal('year');
      setTotalSongsToday(songsToday);
      setTotalSongsWeekend(songsThisWeekend);
      setTotalSongsWeek(songsThisWeek);
      setTotalSongsMonth(songsThisMonth);
      setTotalSongsYear(songsThisYear);
      console.log(`songs today: ${songsToday}, weekend: ${songsThisWeekend}, week: ${songsThisWeek}, month: ${songsThisMonth}, year: ${songsThisYear}`)
    };
    fetchTotalSongs();

    const fetchTotalEvents = async () => {
      const feftchTotal = async (timeRange) => {
        try {
            const response = await fetch(`/songs_list/total_events?time=${timeRange}`);
            const data = await response.json();
            return data['count'];
        } catch(err){
            console.error(err)
        }
      }

      const songsToday = await feftchTotal('today');
      const songsThisWeekend = await feftchTotal('weekend');
      const songsThisWeek = await feftchTotal('week');
      const songsThisMonth = await feftchTotal('month');
      const songsThisYear = await feftchTotal('year');
      setTotalSongsToday(songsToday);
      setTotalSongsWeekend(songsThisWeekend);
      setTotalSongsWeek(songsThisWeek);
      setTotalSongsMonth(songsThisMonth);
      setTotalSongsYear(songsThisYear);
      console.log(`events today: ${songsToday}, weekend: ${songsThisWeekend}, week: ${songsThisWeek}, month: ${songsThisMonth}, year: ${songsThisYear}`)

    };
    fetchTotalEvents()
  }, []);
    const call_to_action_text = `
        A tool for discovering and supporting artists performing live in your area.
        - find upcoming concerts and generate custom playlists
            - listen to their discograpy before so sing along
        - get to know the local music scene
            - follow and listen to radiogen on streaming services
            - supporting local performers
            - more organic discovery than paid promotions
        - generate custom playlists
            - don't want to forget a weekend of fun create a timecapsule
    `;
    return (
        <div id='landing-view' className='landing-view snap-section'>
            <div className='call-to-action-container'>
                <h1>r a d i o g e n . l i v e</h1>
                <p>
                    {call_to_action_text}
                </p>
            </div>
            <div className='data-stats-container'>
              Total songs, total events this weekend/month/year, most/least popular artist performing this month
              6. Ticket Pricing
Average Ticket Price: Calculate the average ticket price for events.
# events with price less than __ this week
Events by Genre: Count of events that feature specific genres
Events by Date: Number of events scheduled for each day, month, or year.

Top Artists: List artists ranked by their average Spotify popularity.

            </div>
            <PlaylistCarousel />
        </div>
    );
};

export default LandingView;