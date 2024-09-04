import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';
import { useSongsFilter } from '../../Filter/FilterContext';
import { useSourceData } from './SourceContext';
import { Toggle } from '../../Filter/Menus/MenuUtils';
import { getSpotifyClient, useSpotifyData } from './Spotify';

const SavePlaylistContext = createContext();
export const useSavePlaylistSignal = () => useContext(SavePlaylistContext);
export const SavePlaylistSignalProvider = ({children}) => {
    const [signals, setSignals] = useState({});
    const addSignal = (name) => {
        if(signals[name]) signals[name].abort();
        const signal = new AbortController();
        setSignals({
            ...signals,
            [name]: signal
        });
        return signal;
    }
    const abortSignal = (name) => {
        if(signals[name]){
            signals[name].abort();
            const { [name]: _, ...newSignals } = signals
            setSignals(newSignals);
        }
    }

    return(
        <SavePlaylistContext.Provider value={{ signals, addSignal, abortSignal }}>
            { children }
        </SavePlaylistContext.Provider>
    )
}

const saveSpotifyPlaylist = async (signal, client, spotifyData, filters, playlistName, isPrivate) => {
    const fetchTotalResults = async () => {
        try{
            const postData = {
                filters: filters
            };
            const response = await fetch('/songs_list/total_results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });
            const data = await response.json();
            return data['count'];
        }catch(err){
            console.error(err)
        }
    };
    
    const createSpotifyPlaylist = async (playlistNum) => {
        try{
            const endpoint = `/users/${spotifyData?.id}/playlists`;
            const payload = {
                name: playlistNum > 0 ? `${playlistName}(${playlistNum})` : playlistName,
                public: !isPrivate
            };
            const response = await client.post(endpoint, payload);
            if(response){
                const data = await response.json();
                const playlist = {
                    id: data['id'],
                    url: data['external_urls']['spotify'],
                    page_progress: 0
                };
                return playlist;
            }
        }catch(err){
            console.error(err);
        }
    }

    const fetchSpotifyTrackURIs = async (page) => {
        try{
            const postData = {
                page: page,
                limit: 100,
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
            if(data.length > 0){
                return [
                    data[0].total,
                    data.map(track => `spotify:track:${track.spid}`)
                ];
            }
            else{
                return [0, []];
            }
        }catch(err){
            console.error(err)
            return [0, []]
        }
    };

    const deleteSpotifyPlaylist = async (playlistId) => {
        try{
            const endpoint = `/playlists/${playlistId}/followers`;
            await client.delete(endpoint);
        }catch(err){
            console.error(err);
        }
    }

    try{
        const playlistSize = await fetchTotalResults() || 100;
        let page_progress = 0;
        for(let i=0; i < Math.ceil(playlistSize / 10000); i++){
            if(signal.aborted){
                throw new Error('Canceled playlist');
            }
            const newPlaylist = await createSpotifyPlaylist(i);
            console.log(`new playlist: ${newPlaylist?.url}`)
            console.log(newPlaylist);
            if(!newPlaylist) throw new Error('failed to create new spotify playlist.');
            try{
                let failed_tracks = [];
                while(newPlaylist.page_progress * 100 < 10000){
                    if(signal.aborted){
                        throw new Error('Canceled playlist');
                    }
                    console.log(`Page Progress ${newPlaylist.page_progress}`)
                    const [totalResults, URIs] = await fetchSpotifyTrackURIs(page_progress);
                    if(totalResults){
                        const endpoint = `/playlists/${newPlaylist.id}/tracks`;
                        const response = await client.post(endpoint, { uris: URIs });
                        if(!response)
                            failed_tracks = [...failed_tracks, ...URIs];
                    }
                    newPlaylist.page_progress = newPlaylist.page_progress + 1;
                    page_progress++;
                }
            } catch(err) {
                console.error(err);
                await deleteSpotifyPlaylist(newPlaylist.id);
            }
        }
    } catch(err) {
        console.error(err);
    }
}
// keeping out side hook for persisting between rerenders
let spotifyClient;
export const SavePlaylistView = () => {
    const [playlistName, setPlaylistName] = useState('');
    const handleNameChange = event => setPlaylistName(event.target.value)
    const [ isPrivate, setIsPrivate ] = useState(false);
    const handleIsPrivateToggle = () => setIsPrivate(!isPrivate);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const openCloseModal = () => {
        setPlaylistName('');
        setIsPrivate(false);
        setModalIsOpen(!modalIsOpen);
    }
    const { source, CSV_SOURCE, SPOTIFY_SOURCE, YOUTUBE_SOURCE } = useSourceData();
    // whenever spotify data changes update spotify client
    const { spotifyData } = useSpotifyData();
    useEffect(() => {
        if(spotifyData)
            spotifyClient = getSpotifyClient(spotifyData)   
    }, [spotifyData]);


    const { addSignal } = useSavePlaylistSignal();
    const { filters } = useSongsFilter();
    const savePlaylist = async () => {
        const signal = addSignal(playlistName);
        switch(source) {
            case SPOTIFY_SOURCE:
                if(spotifyClient && spotifyData)
                    await saveSpotifyPlaylist(signal, spotifyClient, spotifyData, filters, playlistName, isPrivate);
                break;
            default:
                console.log('source:' + source)
                break;
        }
        openCloseModal()
    }

    return (
        <div>
            <button onClick={openCloseModal}>Generate Playlist</button>
            { modalIsOpen && createPortal(
                <GenPlaylistModal 
                    closeModal={openCloseModal}
                    source={source}
                    playlistName={playlistName}
                    handleNameChange={handleNameChange}
                    isPrivate={isPrivate}
                    handleIsPrivateToggle={handleIsPrivateToggle}
                    savePlaylist={savePlaylist}
                />,
                document.body
            )}
            {/* progress bar */}
        </div>
    )
}

const GenPlaylistModal = ({closeModal, source, playlistName, handleNameChange, isPrivate, handleIsPrivateToggle, savePlaylist}) => {
    return (
        <div className='save-playlist-modal-container'>
            {/* header/close btn*/}
            <div className="filter-title">
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <h1 style={{flex: '1', textAlign: 'center'}}>{`Generate ${source == 0 ? 'CSV' : source == 1 ? 'Spotify' : 'YouTube'} Playlist`}</h1>
                    <button onClick={closeModal}>x</button>
                </div>
            </div>
            {/* name input */}
            <div className='save-playlist'>
                <div id='playlist-name-input'>
                    <label htmlFor='playlistNameInput'>Playlist Name: </label>
                    <input
                        type='text'
                        id='playlistNameInput'
                        placeholder='Name'
                        value={playlistName}
                        onChange={handleNameChange}
                    />
                </div>
                {/* private toggle */}
                <Toggle
                    label={'Private'}
                    toggled={isPrivate}
                    onClick={handleIsPrivateToggle}
                />
            </div>
            {/* save/cancel btn */}
            <div className='save-playlist-footer'>
                <button onClick={async () => await savePlaylist()}>Save</button>
                <button onClick={closeModal}>Cancel</button>
            </div>
        </div>
    )
}