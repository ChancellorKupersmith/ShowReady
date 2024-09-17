import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import FilterView from '../../Filter/FilterView';
import NotificationView from '../../Notification/NotificationView';
import VenueMarkerSVG from  '../../../assets/venue-marker.svg'
import './Map.css'
import { SpotifyContextProvider } from '../Source/Spotify';
import SongsView from '../SongsView';
import { useSongsFilter } from '../../Filter/FilterContext';

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
  const [allVenues, setAllVenues] = useState([]);
  const [venueMarkers, updateVenueMarkers] = useState({});
  const setVenueMarkers = (venues) => {
    // console.log(venueMarkers);
    updateVenueMarkers(venues);
  }

  return (
    <MapContext.Provider value={{center, setCenter, findVenue, zoom, setZoom, venueMarkers, setVenueMarkers, allVenues, setAllVenues}}>
      { children }
    </MapContext.Provider>
  );
};

const SeattleMap = () => {
  const { center, zoom, setVenueMarkers, allVenues, setAllVenues } = useMap();
  const [address, setAddress] = useState('');
  const { filters, updateFilters } = useSongsFilter();
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

  const reqVenue = (venueName) => {
    updateFilters((prevState) => ({
      ...prevState,
      total: prevState.total + 1,
      req: {
          ...prevState.req,
          location: {
              ...prevState.req.location,
              venues: [...prevState.req.location.venues, venueName]
          }
      }
    }));
  };
  const exVenue = (venueName, marker, map) => {
    if(!filters.ex.location.venues.includes(venueName)){
      updateFilters((prevState) => ({
          ...prevState,
          total: prevState.total + 1,
          ex: {
              ...prevState.ex,
              location: {
                  ...prevState.ex.location,
                  venues: [...prevState.ex.location.venues, venueName]
              }
          }
      }));
    };
    map.removeLayer(marker)
  };
  const createMarker = (map, venue) => {
    const marker = L.marker([parseFloat(venue.lat), parseFloat(venue.lng)], {
      id: `map-marker-${venue.name}`,
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500
    });
    marker.addTo(map);
    const popup = `
        <div classname='venue-marker-popup'>
          <a classname='venue-name' href='${venue.venueurl}'>${venue.name}</a>
          <div className='reqex-btn-container'>
              <button id='map-marker-btn-req-${venue.name}' className='reqex-btn req-btn'>Require</button>
              <button id='map-marker-btn-ex-${venue.name}' className='reqex-btn ex-btn'>Exclude</button>
          </div>
        </div>
    `;
    marker.bindPopup(popup);
    // listeners need to be unique so they can be removed later
    const listenerName = `markerPopupReqExListener_${venue.name}`;
    window[listenerName] = (event) => {
      if(event.target.id === `map-marker-btn-req-${venue.name}`){
        reqVenue(venue.name)
      }
      if(event.target.id === `map-marker-btn-ex-${venue.name}`){
        exVenue(venue.name, marker, map)
      }
    }
    document.addEventListener('click', window[listenerName])
    marker.on('remove', function(){
      console.log(`Filtering out ${venue.name}`)
      document.removeEventListener('click', window[listenerName])
    });

    return marker;
  };

  // INIT MAP
  const initMarkers = async (map) => {
    const fetchVenues = async () => {
      try {
          const response = await fetch('/songs_list/venue_markers');
          const data = await response.json();
          // save complete venues list for later filter sync
          setAllVenues(data);
          return data;
      } catch(err) {
          console.error(err)
      }
    };  

    // only execute if map has loaded
    if(map){
      const venues = await fetchVenues();
      const markers = {};
      venues.forEach(venue => {
        markers[venue.name] = createMarker(map, venue)
      });
      // save for access to markers through context provider
      setVenueMarkers(markers)
    }
  };
  const mapRef = useRef(null);
  useEffect(() => {
    let initMap = async () => {
      try {
        // only run once
        if(!mapRef.current){
          const mapUI = L.map('mapUI', {
            center: [center.lat, center.lng],
            zoom: zoom
          });
          mapRef.current = mapUI;
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
  // sync map markers with filters
  useEffect(() => {
    if(mapRef.current){
      allVenues.forEach(v => {
        // check if out of sync (if in allVenues but not on map and not in filter exclusions)
        let onMap = false;
        mapRef.current.eachLayer(layer =>{
          if(layer instanceof L.Marker && layer.options.id == `map-marker-${v.name}`){
            onMap = true;
          }
        });
        if(!filters.ex.location.venues.includes(v.name) && !onMap){
          createMarker(mapRef.current, v)
        }
      });
    }
    
  }, [filters]);



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
