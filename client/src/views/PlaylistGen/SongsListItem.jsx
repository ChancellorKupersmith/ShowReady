import { useEffect, useRef, useState } from "react";
import AddSvg from '../../assets/add-circle.svg';
import SubSvg from '../../assets/trash.svg';
import { useSongsFilter } from "../Filter/FilterContext";
import { displayDate } from "../Filter/Menus/DateMenu";
import { SpotifyIcon } from "./Source/Spotify";
import { YouTubeIcon } from "./Source/Youtube";
import { useMap } from "./Map/SeattleMapView";


const SongsListItem = ({songId, songTitle, artistName, artistUrl, spotifyImg, albumName, albumUrl, genre, eventLocation, date, spId, ytUrl, events}) => {
    const { filters, updateFilters } = useSongsFilter();
    const [isIncluded, setIsIncluded] = useState(true);
    const toggleIsInclude = () => {
        updateFilters({
            ...filters,
            ex: {
                ...filters.ex,
                song: {
                    ...filters.ex.song,
                    ids: isIncluded ? [...filters.ex.song.ids, songId] : filters.ex.song.ids.filter(id => id !== songId)
                }
            }
        });
        setIsIncluded(!isIncluded);
    };

    const [hovered, setHovered] = useState(false);
    const [aboveHalfway, setAboveHalfway] = useState(true);
    const [elementPosition, setElementPosition] = useState({top: 0, right: 0});
    const elementRef = useRef(null);
    useEffect(() => {
        const updatePosition = () => {
            if(elementRef.current){
                const rect = elementRef.current.getBoundingClientRect();
                setElementPosition({
                    top: rect.top + window.scrollY,
                    right: rect.right + window.scrollX,
                });
                const halfwaypoint = window.innerHeight / 2 + 50;
                setAboveHalfway(rect.top < halfwaypoint);
            }
        }

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition);
        }
    }, [])

    const AddImg = () => (
        <div className="svg-container">
            <img
                loading="lazy"
                src={AddSvg}
                alt='Add'
            />
        </div>
    );
    const MinusImg = () => (
        <div className="svg-container">
            <img
                loading="lazy"
                src={SubSvg}
                alt='Remove'
            />
        </div>
    );
    
    const SourceMeta = () => {
        const spUrl = `http://open.spotify.com/track/${spId}`
        return (
            <div className="source-meta-container">
                { spId && 
                    <div className="source-meta">
                        <SpotifyIcon url={spUrl}/> 
                    </div>
                }
                { ytUrl && 
                    <div className="source-meta">
                        <YouTubeIcon url={ytUrl}/> 
                    </div>
                }
            </div>
        );
    }

    const SongOverlay = () => {
        const overlayStyle = {
            'top': aboveHalfway? `${Math.ceil(elementPosition.top * 0.6)}px` : `${Math.ceil(elementPosition.top * 0.8)}px`,
            right: `${Math.ceil(elementPosition.right * 0.22)}px`
        }

        const { findVenue } = useMap();
        return (
            <div className="overlay" style={overlayStyle}>
                { spotifyImg && 
                    <div className="artist-img">
                        <img src={spotifyImg} alt="artist image"/>
                    </div>
                }
                <div className="meta-container">
                    <p className="song-title">{songTitle}</p>
                    <SourceMeta />
                </div>
                <div className="artist-album-container">
                    <p className="artist-name">
                        <a href={artistUrl} target="_blank"> 
                            {artistName}
                        </a>
                    </p>
                    { albumName && <p className="break">-</p> }
                    { albumName &&
                        <p className="album-name">
                            <a href={albumUrl} target="_blank">
                                {albumName}
                            </a>
                        </p> 
                    }
                </div>
                { genre && <p className="genre-name">{genre}</p>}
                <ul>
                    { events.length > 0 &&
                        events.map((event, index) =>
                            <div key={`event-info${index}`} className="event-info">
                                <p className="location" onClick={() => findVenue(event.venue)}>{event.venue}</p>
                                    <div className="price-time-container">
                                        <p className="date">{displayDate(event.eventdate).slice(0,5)}</p>
                                        <p className="time">{event.eventtime}</p>
                                        <p className="price">{event.price}</p>
                                    </div>
                            </div>
                        )
                    }
                </ul>
            </div>
        );
    };

    return (
        <div className={`songs-list-item ${isIncluded ? '' : 'dark-mode'}`}>
            <div>
                <div 
                    className="text-container"
                    ref={elementRef}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <p className="song-title">{songTitle}</p>
                    <div className="meta-container">
                        <p className="artist-name">{artistName}</p>
                        <SourceMeta />
                    </div>
                    {hovered && <SongOverlay /> }
                </div>
                <button className={`remove-toggle ${isIncluded ? 'dark-mode' : ''}`} onClick={()=>toggleIsInclude()}>
                    {isIncluded ? <MinusImg/> : <AddImg/>}
                </button>
            </div>
        </div>
    );
};

export default SongsListItem;