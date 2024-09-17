import React, { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import NotifySvg from '../../assets/notify-bell.svg'
import './Notification.css';
import { SpotifyNotificationItem } from './NotificationItem';


const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);
export const NotificationProvider = ({children}) => {
    const mockPlaylist = {
        id: '2nQ04uKoAErm0R4wDgaCVa',
        name: 'test',
        page_progress: 6000,
        size: 10000,
        type: 'spotify',
        url: 'https://open.spotify.com/playlist/2nQ04uKoAErm0R4wDgaCVa',
        onClose: () => removeNotification('2nQ04uKoAErm0R4wDgaCVa')
    };
    const mockNotifications = {
        '2nQ04uKoAErm0R4wDgaCVa': mockPlaylist
    };
    const [notifications, setNotifications] = useState(mockNotifications);

    const addNotification = (notification) => {
        console.log('notification:')
        console.log(notification)
        setNotifications({
            ...notifications,
            [notification.id]: notification
        });
    }
    const removeNotification = (id) => {
        const { [id]: _, ...newState } = notifications;
        setNotifications(newState);
    };

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            { children }
        </NotificationContext.Provider>
    )
}

const NotificationView = () => {
    const [isOpen, setIsOpen] = useState(false);
    const openCloseModal = () => setIsOpen(!isOpen)

    const NotificationBtn = () => {
        const NotifyImg = () => (
            <div className="svg-container">
                <img
                    loading="lazy"
                    src={NotifySvg}
                    alt='notifications'
                />
            </div>
        );

        return(
            <button className={isOpen? 'selected' : ''} onClick={openCloseModal}>
                <NotifyImg />
            </button>
        );
    };
    
    const NotificationMenu = () => {
        const { notifications } = useNotifications();
        return (
            <div className='notifications-menu'>
                <div className="notification-title">
                    <div className='header'>
                        <h1>Notifications</h1>
                        <button onClick={openCloseModal}>x</button>
                    </div>
                </div>
                <ul className='notification-list-container'>
                    { Object.keys(notifications).length > 0 && 
                      Object.values(notifications).map((notification, index) => {
                            if(notification.type == 'spotify')
                                return <SpotifyNotificationItem key={index} playlist={notification}/>
                      })
                    }
                </ul>
            </div>
        )
    };

    return (
        <div className='notifications-container'>
            <NotificationBtn />
            {isOpen && createPortal(<NotificationMenu />, document.body)}
        </div>
    );
}

export default NotificationView;