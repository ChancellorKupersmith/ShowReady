import React, { useState, useEffect, useRef, useContext, createContext } from 'react';
import { createPortal } from 'react-dom';
import { useSongsFilter } from '../../Filter/FilterContext';
import { useSourceData } from './SourceContext';
import { Toggle } from '../../Filter/Menus/MenuUtils';
import { getSpotifyClient, useSpotifyData } from './Spotify';
import { displayDate } from '../../Filter/Menus/DateMenu';
import { useNotifications } from '../../Notification/NotificationView';

const SavePlaylistContext = createContext();
export const useSavePlaylistSignal = () => useContext(SavePlaylistContext);
export const SavePlaylistSignalProvider = ({children}) => {
    const { addNotification, removeNotification } = useNotifications();
    const [signals, setSignals] = useState({});
    const addSignal = (playlist) => {
        if(signals[playlist.id]) signals[playlist.id].abort();
        const signal = new AbortController();
        setSignals({
            ...signals,
            [playlist.id]: [signal]
        });
        playlist.onClose = () => abortSignal(playlist.id);
        addNotification(playlist)
        return signal;
    }
    const abortSignal = () => {
        if(signals[id]){
            signals[id].abort();
            const { [id]: _, ...newSignals } = signals
            setSignals(newSignals);
            removeNotification(id)
        }
    }

    return(
        <SavePlaylistContext.Provider value={{ signals, addSignal, abortSignal }}>
            { children }
        </SavePlaylistContext.Provider>
    )
}

const saveSpotifyPlaylist = async (client, spotifyData, filters, playlistName, isPrivate, addSignal, abortSignal, addNotification) => {
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
            return data['total'];
        }catch(err){
            console.error(err)
        }
    };
    
    const createSpotifyPlaylist = async (playlistNum) => {
        try{
            const endpoint = `/users/${spotifyData?.id}/playlists`;
            const name = playlistNum > 0 ? `${playlistName}(${playlistNum})` : playlistName;
            const payload = {
                name: name,
                public: !isPrivate
            };
            const response = await client.post(endpoint, payload);
            if(response){
                const data = await response.json();
                const playlist = {
                    id: data['id'],
                    type: 'spotify',
                    name: name,
                    url: data['external_urls']['spotify'],
                    page_progress: 0,
                    size: 100,
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
            console.log(data)
            if(data.length > 0){
                return [
                    data[0][0].total,
                    data[0].map(track => `spotify:track:${track.spid}`)
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
        const numOfPlaylists = playlistSize <= 10000 ? 1 : Math.ceil(playlistSize / 10000);
        let page_progress = 0;
        for(let i=0; i < numOfPlaylists; i++){
            const newPlaylist = await createSpotifyPlaylist(i);
            console.log(`new playlist: ${newPlaylist?.url}`)
            if(!newPlaylist) throw new Error('failed to create new spotify playlist.');
            try{
                let failed_tracks = [];
                newPlaylist.size = Math.min(playlistSize, 10000);
                const signal = addSignal(newPlaylist)
                while(newPlaylist.page_progress < newPlaylist.size){
                    if(signal.aborted) throw new Error('Canceled playlist');
                    
                    const [totalResults, URIs] = await fetchSpotifyTrackURIs(page_progress);
                    if(totalResults){
                        const endpoint = `/playlists/${newPlaylist.id}/tracks`;
                        const response = await client.post(endpoint, { uris: URIs });
                        if(!response)
                            failed_tracks = [...failed_tracks, ...URIs];
                    }
                    // update notification progress
                    newPlaylist.page_progress = newPlaylist.page_progress + 100;
                    addNotification(newPlaylist)
                    page_progress++;
                }
                if(failed_tracks.length > 0)
                    console.error(failed_tracks);
            } catch(err) {
                console.error(err);
                await deleteSpotifyPlaylist(newPlaylist.id);
                abortSignal(newPlaylist);
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


    const { addSignal, abortSignal } = useSavePlaylistSignal();
    const { addNotification } = useNotifications();
    const { filters } = useSongsFilter();
    const hintPlaylistName = filters.dateGThan && filters.dateLThan ? `${displayDate(filters.dateGThan)} - ${displayDate(filters.dateLThan)}` : 'Name';
    const savePlaylist = async () => {
        let name = playlistName ? playlistName : hintPlaylistName;
        switch(source) {
            case SPOTIFY_SOURCE:
                if(spotifyClient && spotifyData)
                    await saveSpotifyPlaylist(spotifyClient, spotifyData, filters, name, isPrivate, addSignal, abortSignal, addNotification);
                break;
            default:
                console.log('source:' + source)
                break;
        }
        openCloseModal()
    }

    return (
        <div className='save-playlist-view-container'>
            <button onClick={openCloseModal}>Generate Playlist</button>
            { modalIsOpen && createPortal(
                <GenPlaylistModal 
                    closeModal={openCloseModal}
                    source={source}
                    playlistName={playlistName}
                    nameHint={hintPlaylistName}
                    handleNameChange={handleNameChange}
                    isPrivate={isPrivate}
                    handleIsPrivateToggle={handleIsPrivateToggle}
                    savePlaylist={savePlaylist}
                />,
                document.body
            )}
        </div>
    )
}

const GenPlaylistModal = ({closeModal, source, playlistName, nameHint, handleNameChange, isPrivate, handleIsPrivateToggle, savePlaylist}) => {
    return (
        <div className='save-playlist-modal-container'>
            <div className='header'>
                <h1>{`Generate ${source == 0 ? 'CSV' : source == 1 ? 'Spotify' : 'YouTube'} Playlist`}</h1>
                <button onClick={closeModal}>x</button>
            </div>
            <div className='save-playlist'>
                <div id='playlist-name-input'>
                    <label htmlFor='playlistNameInput'>Playlist Name: </label>
                    <input
                        type='text'
                        id='playlistNameInput'
                        placeholder={nameHint}
                        value={playlistName}
                        onChange={handleNameChange}
                    />
                </div>
                <Toggle
                    label={'Private'}
                    toggled={isPrivate}
                    onClick={handleIsPrivateToggle}
                />
            </div>
            <div className='save-playlist-footer'>
                <button onClick={async () => {
                    const promise = savePlaylist();
                    closeModal();
                    await promise;
                }}>Save</button>
                <button onClick={closeModal}>Cancel</button>
            </div>
        </div>
    )
}