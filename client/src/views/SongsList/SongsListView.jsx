import React, { useState, useEffect, createContext, useContext } from 'react';
import SongsListItem from './SongsListItem';
import SeattleMap from './SeattleMapView';
import { useSongsFilter } from '../Filter/FilterContext';
import FilterView from '../Filter/FilterView';

const Save2ClientContext = createContext();
const BgColorContext = createContext();
const Save2ClientBtn = ({clientType}) => {
    const {setSave2Client} = useContext(Save2ClientContext);
    const {setBgColor}= useContext(BgColorContext);

    const handleSave2ClientChange = () => {
        switch(clientType.toLowerCase()){
            case 'spotify':
                setBgColor('#18c49e');
                setSave2Client(1);
                break;
            case 'youtube':
                setBgColor('#e76265');
                setSave2Client(2);
                break;
            default:
                setBgColor('#8fdaed');
                setSave2Client(0);
        }
    };
    return (
        <button style={{width: '100%'}} onClick={()=>handleSave2ClientChange()}>{clientType}</button>
    );
};

const SongsListView = () => {
    const [bgColor, setBgColor] = useState('#8fdaed');
    const [save2Client, setSave2Client] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { filters } = useSongsFilter();
    const [totalPages, setTotalPages] = useState(1);
    const [songs, setSongs] = useState([]);
    // Fetch songs on: first load, page change, pageSize change, filter change
    useEffect(() => {
        const fetchSongs = async () => {
            try{
                const postData = {
                    page: page,
                    limit: pageSize,
                    filters: filters
                };
                const response = await fetch('/songs_list', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const data = await response.json();
                // console.log(data)
                if(data.length > 0)
                    setTotalPages(Math.ceil(data[0].total / pageSize))
                setSongs([...data]);
            }catch(err){
                console.log(err)
            }
        };

        fetchSongs();
    }, [page, pageSize, filters]);

    const handlePageChange = newPage => {
        if(newPage != page && newPage >= 1 && newPage <= totalPages)
            setPage(newPage);    
    };


    return (
        <div id='songs-list-view'  className='snap-section' style={{backgroundColor: bgColor}}>
            <div className='songs-list-view-container'>
                <SeattleMap/>
                <Save2ClientContext.Provider value={{save2Client, setSave2Client}} style={{width: '100%'}}>
                    <BgColorContext.Provider value={{bgColor, setBgColor}} style={{width: '100%'}}>
                        <div className='songs-list-container'>
                            <div style={{display: 'flex', justifyContent: 'space-around', width: '100%'}}>
                                <Save2ClientBtn clientType={'CSV'}/>
                                <Save2ClientBtn clientType={'Spotify'}/>
                                <Save2ClientBtn clientType={'YouTube'}/>
                            </div>
                            <FilterView />
                            {/* TODO: Make songs lists page size dynamic to window size */}
                            <div style={{minHeight: 'fit-content', height: '100%'}}>
                                <ul className='songs-container'>
                                    {songs.length > 0 && songs.map((song, index) => (<SongsListItem key={index} songTitle={song.title} artistName={song.artist} eventLocation={songs.venue} date={song.eventdate}/>))}
                                </ul>
                                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                    <button onClick={() => handlePageChange(page - 1)} disabled={page === 1} >
                                        Previous
                                    </button>
                                    <span>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages} >
                                        Next
                                    </button>
                                </div>
                            </div>
                            <button>Save Playlist</button>
                        </div>
                    </BgColorContext.Provider>
                </Save2ClientContext.Provider>
            </div>
        </div>
    );
};

export default SongsListView;