import React from 'react';
import { useState, useEffect } from 'react';
import Slider from 'react-slick'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './Landing.css'

export const PlaylistCarousel = ({ playlists }) => {
    var settings = {
      className: 'slider',
      dots: true,
      infinite: true,
      speed: 5000,
      slidesToShow: 3,
      slidesToScroll: 1,
      autoplay: true,
    };
    return (
      <Slider {...settings}>
          { playlists }
      </Slider>
    );
}

const PlaylistCover = ({ img, imgheight, imgwidth, name }) => {
  const coverStyle = {
    border: 'solid red',
    width: `300px`, // Has to be 640, 300, or 50px according to spotify use guidelines (https://developer.spotify.com/documentation/design)
    height: `300px`, // Has to be 640, 300, or 50px according to spotify use guidelines (https://developer.spotify.com/documentation/design)
    borderRadius: '15px',
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
    borderRadius: '15px',
  };

  return (
    <div style={coverStyle}>
      <img src={img} alt={name} style={imageStyle} />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        color: '#fff',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: '5px 10px',
        borderRadius: '5px',
      }}>
        {name}
      </div>
    </div>
  );
};

const LandingView = () => {
    const [radiogenPlaylists, setRadiogenPlaylists] = useState([]);
    // Fetch random radiogen playlists
    useEffect(() => {
      const fetchRadiogenPlaylists = async () => {
          try{
              const response = await fetch('/radiogen/random_playlists?limit=10');
              console.log(response)
              const data = await response.json();
              console.log(data);
              if(data){
                setRadiogenPlaylists(data.map((playlist, index) => <PlaylistCover key={index} name={playlist.name} img={playlist.img} imgheight={playlist.imgheight} imgwidth={playlist.imgwidth}/>))
              }
          }catch(err){
              console.error(err)
          }
      };
      fetchRadiogenPlaylists();
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
            </div>
            <div className='playlists-carousel-container'>
                <PlaylistCarousel playlists={radiogenPlaylists}/>
            </div>
        </div>
    );
};

export default LandingView;