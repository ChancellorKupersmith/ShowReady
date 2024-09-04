import { useState } from "react";
import AddSvg from '../../assets/add-circle.svg'
import SubSvg from '../../assets/trash.svg'
import { useSongsFilter } from "../Filter/FilterContext";


const SongsListItem = ({songId, songTitle, artistName, eventLocation, date}) => {
    const { filters, updateFilters } = useSongsFilter();
    const [isIncluded, setIsIncluded] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleIsExpanded = () => setIsExpanded(!isExpanded);
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

    
    return (
        <div className={`songs-list-item ${isIncluded ? '' : 'dark-mode'}`}>
            <div>
                <div className="text-container" onDoubleClick={()=>toggleIsExpanded()}>
                    <p>Song: {songTitle}</p>
                    <p>Artist: {artistName}</p>
                    {isExpanded && (<>
                        <p>Venue: {eventLocation}</p>
                        <p>Date: {date}</p>
                    </>)}
                </div>
                <button className={`filter-toggle-btn ${isIncluded ? 'dark-mode' : ''}`} onClick={()=>toggleIsInclude()}>
                    {isIncluded ? <MinusImg/> : <AddImg/>}
                </button>
            </div>
        </div>
    );
};

export default SongsListItem;