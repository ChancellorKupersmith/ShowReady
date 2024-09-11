import { useEffect, useRef, useState } from "react";
import AddSvg from '../../assets/add-circle.svg';
import SubSvg from '../../assets/trash.svg';
import { useSongsFilter } from "../Filter/FilterContext";
import { displayDate } from "../Filter/Menus/DateMenu";
import { SpotifyIcon } from "./Source/Spotify";
import { YouTubeIcon } from "./Source/Youtube";
import { useMap } from "./Map/SeattleMapView";


const SongsListItem = ({songId, songTitle, artistName, eventLocation, date, spId, ytUrl, events}) => {
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
                    left: rect.left + window.scrollX,
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
        const style = {
            display: 'flex',
            justifyContent: 'start',
            width: '20px',
            height: '20px',
            margin: '1px',
            cursor: 'pointer',
            // border: 'solid',
        }
        const containerStyle = {
            display: 'flex'
        }
        const spUrl = `http://open.spotify.com/track/${spId}`
        return (
            <div style={containerStyle}>
                { spId && 
                    <div className="source-meta" style={style}>
                        <SpotifyIcon url={spUrl}/> 
                    </div>
                }
                { ytUrl && 
                    <div className="source-meta" style={style}>
                        <YouTubeIcon url={ytUrl}/> 
                    </div>
                }
            </div>
        );
    }

    const metaContainerStyle = {
        display: 'flex',
        alignItems: 'end',
        // justifyContent: 'end',
    }
    const artistNameStyle = {
        fontSize: '12px',
        maxWidth: '80%',
        marginLeft: '2px',
        paddingLeft: '0px',
        alignSelf: 'center',
    }
    const songTitleStyle = {
        fontWeight: 'bold',
        maxWidth: '96%',
        marginTop: '8px',
        paddingLeft: '0px',
    }

    const SongOverlay = () => {
        // TODO: Try and make style on css
        const overlayStyle = {
            [aboveHalfway? 'top':'bottom']: aboveHalfway? `${elementPosition.top + 10}px` : `${10 - (Math.ceil(elementPosition.top / 70))}%`,
            left: `${elementPosition.left - 200}px`
        }

        const eventInfoStyle = {
            borderBottom: 'solid black 1px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'end',
            paddingTop: '14px',
            paddingBottom: '4px',
        }
        const dateStyle = {
            fontWeight: 'bold',
            fontSize: '12px',
            margin: '0px',
            padding: '0px',
            minWidth: 'fit-content'
            // border: 'solid',
        }
        const locationStyle = {
            // border: 'solid',
            fontWeight: 'bold',
            fontSize: '14px',
            textAlign: 'left',
            margin: '0px',
            marginLeft: '6px',
            padding: '0px',
            cursor: 'pointer',
        }
        const priceTimeContainerStyle = {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'end',
        }
        const priceTimeStyle = {
            fontSize: '10px',
            whiteSpace: 'nowrap', /* Allow text to wrap */
            overflow: 'visible',   /* Ensure the overflow is visible */
            textOverflow: 'clip', /* Disable ellipsis */
            maxWidth: 'max-content'
        }
        const { findVenue } = useMap();
        return (
            <div className="overlay" style={overlayStyle}>
                <div className="meta-container" style={metaContainerStyle}>
                    <p className="song-title" style={songTitleStyle}>{songTitle}</p>
                    <SourceMeta />
                </div>
                {/* album title */}
                <p className="artist-name" style={artistNameStyle}>{artistName}</p>
                <ul>
                    { events.length > 0 &&
                        events.map((event, index) =>
                            <div key={`event-info${index}`} className="event-info" style={eventInfoStyle}>
                                <p className="date" style={dateStyle}>{displayDate(event.eventdate).slice(0,5)}</p>
                                <p className="location" onClick={() => findVenue(event.venueaddress)} style={locationStyle}>{event.venue}</p>
                                <div className="price-time-container" style={priceTimeContainerStyle}>
                                    <p className="time" style={priceTimeStyle}>{event.eventtime}</p>
                                    <p className="price" style={priceTimeStyle}>{event.price}</p>
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
                    <p className="song-title" style={songTitleStyle}>{songTitle}</p>
                    <div className="meta-container" style={metaContainerStyle}>
                        <p className="artist-name" style={artistNameStyle}>{artistName}</p>
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