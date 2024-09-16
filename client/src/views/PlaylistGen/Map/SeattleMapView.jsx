import React, { useState, useEffect, createContext, useContext } from 'react';
import FilterView from '../../Filter/FilterView';
import NotificationView from '../../Notification/NotificationView';
import VenueMarkerSVG from  '../../../assets/venue-marker.svg'
import './Map.css'
import { SpotifyContextProvider } from '../Source/Spotify';
import SongsView from '../SongsView';

const MapContext = createContext();
export const useMap = () => useContext(MapContext);
export const MapContextProvider = ({children}) => {
    // default center seattle
  const [center, setCenter] = useState({lat: 47.608013, lng: -122.3217481});
  const [zoom, setZoom] = useState(12);
  const findVenue = async (address) => {
    try{
        const params = new URLSearchParams({
            address: address
        });
        const url = `/google_api/places?${params}`
        const response = await fetch(url);
        const data = await response.json();
        console.log(data)
        setCenter(data)
        setZoom(19);
    }catch(err){
        console.error(err)
    }
  };
  const [venues, setVenues] = useState([]);
  const [venueMarkers, updateVenueMarkers] = useState({});
  const setVenueMarkers = (venues) => {
    // console.log(venueMarkers);
    updateVenueMarkers(venues);
  }

  return (
    <MapContext.Provider value={{center, setCenter, findVenue, zoom, setZoom, venueMarkers, setVenueMarkers}}>
      { children }
    </MapContext.Provider>
  );
};

const SeattleMap = () => {
  const { center, zoom, venueMarkers, setVenueMarkers } = useMap();
  const [address, setAddress] = useState('');
  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    if(address){
      // query backend for list of results
    }
  };

  const handleAddressSelect = () => {
    // if address found 
      // set center to new lat and lng
    // else display pop up not found
  };

  const initMarkers = async (map) => {
    const fetchVenues = async () => {
      try {
          const response = await fetch('/songs_list/venue_markers');
          const data = await response.json();
          return data;
      } catch(err) {
          console.error(err)
      }
    };
  
    // only execute if map has loaded
    if(map){
      const venues = await fetchVenues();
      if(!venues) return
      const markers = {};
      for(let i=0; i<venues.length; i++){
        markers[venues[i].name] = L.marker([parseFloat(venues[i].lat), parseFloat(venues[i].lng)], {
          color: 'red',
          fillColor: '#f03',
          fillOpacity: 0.5,
          radius: 500
        }).addTo(map);
        const popup = `
          <b>${venues[i].name}</b><br>
          <a href='${venues[i].venueurl}'>${venues[i].venueurl}</a>
        `;
        markers[venues[i].name].bindPopup(popup);
      }
      
      setVenueMarkers(markers)
    }
  }

  let mapUI;
  useEffect(() => {
    let initMap = async () => {
      try {
        if(!mapUI){
          mapUI = L.map('mapUI', {
            center: [center.lat, center.lng],
            zoom: zoom
          });
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }).addTo(mapUI);
          await initMarkers(mapUI)
        }
      } catch (err) {
        console.error('Error fetching map: ', err);
      }
    };
    initMap();
  }, [center, zoom]);

  return (
    <div className='map-container'>
      {/* <div className='address-search'>
        <input 
          type='text'
          placeholder='Enter an address'
          value={address}
          onChange={handleAddressChange}
        />
        <button onClick={()=>handleAddressSelect()}>Find</button>
      </div> */}
        <SpotifyContextProvider>
          <div className='btn-tray'>
              <NotificationView />
              <FilterView />
              <SongsView />
          </div>
        </SpotifyContextProvider>
      <div id="mapUI">
      </div>
    </div>
  );
}

export default SeattleMap;
