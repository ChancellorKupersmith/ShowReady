import { useState } from "react";
import './SongsList.css';
import AddSvg from '../../assets/add-circle.svg'
import SubSvg from '../../assets/trash.svg'
import MaximizeSvg from '../../assets/maximize.svg'
import MinimizeSvg from '../../assets/minimize.svg'


const SongsListItem = ({songTitle, artistName, eventLocation, date}) => {
    const [isIncluded, setIsIncluded] = useState(true);
    const toggleIsInclude = () => setIsIncluded(!isIncluded);
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleIsExpanded = () => setIsExpanded(!isExpanded);

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
    const MaximizeImg = () => (
        <div className="svg-container">
            <img
                loading="lazy"
                src={MaximizeSvg}
                alt='Expand'
            />
        </div>
    );
    const MinimizeImg = () => (
        <div className="svg-container">
            <img
                loading='lazy'
                src={MinimizeSvg}
                alt='Close'
            />
        </div>
    );
    
    return (
        <div className={`songs-list-item ${isIncluded ? 'dark-mode' : ''}`}>
            <div>
                <button className={`expand-toggle-btn`} onClick={()=>toggleIsExpanded()}>
                    {isExpanded ? <MinimizeImg/> : <MaximizeImg/>}
                </button>
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
{/* <div className="text-container" style={{ display: 'flex', flexDirection: 'column' }}>
  <p>Venue: {eventLocation}</p>
  <p>Date: {date}</p>
</div> */}