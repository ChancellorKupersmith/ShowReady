import { useEffect, useRef, useState } from "react";
import AddSvg from '../../assets/add-circle.svg';
import SubSvg from '../../assets/trash.svg';
import { useSongsFilter } from "../Filter/FilterContext";
import { displayDate } from "../Filter/Menus/DateMenu";


const SongsListItem = ({songId, songTitle, artistName, eventLocation, date}) => {
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
    
    const SongOverlay = () => {
        // TODO: Try and make style on css
        const overlayStyle = {
            [aboveHalfway? 'top':'bottom']: aboveHalfway? `${elementPosition.top + 10}px` : `${10 - (Math.ceil(elementPosition.top / 70))}%`,
            left: `${elementPosition.left - 200}px`
        }

        return (
            <div className="overlay" style={overlayStyle}>
                <p>Song: {songTitle}</p>
                <p>Artist: {artistName}</p>
                <p>Venue: {eventLocation}</p>
                <p>Date: {date ? displayDate(date) : ''}</p>
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
                    <p>Song: {songTitle}</p>
                    <p>Artist: {artistName}</p>
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