import React from 'react';
import { useState } from 'react';
import Slider from 'react-slick'
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import './Landing.css'

export const PlaylistCarousel = () => {
    var settings = {
      className: 'slider',
      dots: true,
      lazyLoad: true,
      infinite: true,
      speed: 500,
      slidesToShow: 3,
      slidesToScroll: 3,
      variableWidth: true,
    };
    return (
      <Slider {...settings}>
        <div className='playlist-carousel-slide'>
          <div className='radiogen-playlist'>
            playlist img
          </div>
        </div>
      </Slider>
    );
}

const LandingView = () => {
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
            <div className='data-stats-container'>data stats slides</div>
            <div className='playlists-carousel-container'>
                <PlaylistCarousel />
            </div>
        </div>
    );
};

export default LandingView;