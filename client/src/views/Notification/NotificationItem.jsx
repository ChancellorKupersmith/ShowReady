import React from 'react';
import { SpotifyIcon } from '../PlaylistGen/Source/Spotify';


export const ProgressBar = ({color, progress}) => {   
      const currentPrgressStyle = {
        width: `${progress}%`,
        backgroundColor: color,
      }
    
      const labelStyles = {
        padding: 5,
        color: 'black',
        fontWeight: 'bold'
      }

      return (
        <div className='total' >
            <div className='current' style={currentPrgressStyle}>
                <span>{`${progress}%`}</span>
            </div>
        </div>
      );
}

export const SpotifyNotificationItem = ({playlist}) => {
    /*  
        // rgb(255, 0, 0) red 0%
        // rgb(255, 255, 0) yellow 50%
        // rgb(0, 255, 0) green 100%
        if(progress <= 50){
            green = 5 * progress
        }
        if(progress > 50){
            green = 255;
            red = red - (progress % 50) * 5
        }

    */
   console.log(`playlist progress ${playlist.page_progress}`)
   console.log(`playlist size ${playlist.size}`)
    const progress = Math.floor(playlist.page_progress / playlist.size * 100);
    console.log(`progress ${progress}`)

    const red = progress > 50 ? (255 - (progress % 50) * 5) : 255;
    const green = progress <= 50 ? 5 * progress : 255;
    const message = (
        <div className='progress-container'>
            <ProgressBar
                color={`rgb(${red}, ${green}, 0)`}
                progress={progress}
            />
        </div>
    );
    return (
        <NotificationItem 
            title={`Generating ${playlist.name}`}
            message={message}
            icon={<SpotifyIcon url={playlist.url}/>}
            onClose={playlist.onClose}
        />
    );
}

const NotificationItem = ({title, message, icon, onClose}) => {

    return (
        <div className='notification-list-item'>
            <div className='header'>
                <div className='title'>
                    {icon}
                    <h3>{title}</h3>
                </div>
                <button onClick={onClose}>x</button>
            </div>
            <div className='message'>
                { message }
            </div>
        </div>
    );
}


export default NotificationItem;