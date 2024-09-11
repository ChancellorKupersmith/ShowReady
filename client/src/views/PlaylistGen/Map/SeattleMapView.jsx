import React, { useState, useEffect, createContext, useContext, version } from 'react';
import FilterView from '../../Filter/FilterView';
import VenueMarkerSVG from  '../../../assets/venue-marker.svg'
import './Map.css'

const MapContext = createContext();
export const useMap = () => useContext(MapContext);
export const MapContextProvider = ({children}) => {
  const [center, setCenter] = useState({lat: 47.6028246, lng: -122.3146200});
  const [zoom, setZoom] = useState(11);
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
  // default center seattle
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
    // query backend for venues
    const fetchVenues = async () => {
      try{
          const response = await fetch('/songs_list/venue_markers');
          const data = await response.json();
          return data;
      }catch(err){
          console.error(err)
      }
    };

  
    if(map){
      const venues = await fetchVenues();
      const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
      if(!venues) return
      const markers = {};
      for(let i=0; i<venues.length; i++){
        const parser = new DOMParser();
        let pinSvgString =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 56 56" fill="none"><rect width="56" height="56" rx="28" fill="#7837FF"></rect><path d="M46.0675 22.1319L44.0601 22.7843" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11.9402 33.2201L9.93262 33.8723" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M27.9999 47.0046V44.8933" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M27.9999 9V11.1113" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M39.1583 43.3597L37.9186 41.6532" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16.8419 12.6442L18.0816 14.3506" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M9.93262 22.1319L11.9402 22.7843" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M46.0676 33.8724L44.0601 33.2201" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M39.1583 12.6442L37.9186 14.3506" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M16.8419 43.3597L18.0816 41.6532" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M28 39L26.8725 37.9904C24.9292 36.226 23.325 34.7026 22.06 33.4202C20.795 32.1378 19.7867 30.9918 19.035 29.9823C18.2833 28.9727 17.7562 28.0587 17.4537 27.2401C17.1512 26.4216 17 25.5939 17 24.7572C17 23.1201 17.5546 21.7513 18.6638 20.6508C19.7729 19.5502 21.1433 19 22.775 19C23.82 19 24.7871 19.2456 25.6762 19.7367C26.5654 20.2278 27.34 20.9372 28 21.8649C28.77 20.8827 29.5858 20.1596 30.4475 19.6958C31.3092 19.2319 32.235 19 33.225 19C34.8567 19 36.2271 19.5502 37.3362 20.6508C38.4454 21.7513 39 23.1201 39 24.7572C39 25.5939 38.8488 26.4216 38.5463 27.2401C38.2438 28.0587 37.7167 28.9727 36.965 29.9823C36.2133 30.9918 35.205 32.1378 33.94 33.4202C32.675 34.7026 31.0708 36.226 29.1275 37.9904L28 39Z" fill="#FF7878"></path></svg>';
          pinSvgString = `<svg width="48px" height="48" viewBox="0 0 512 512" enable-background="new 0 0 24 24" id="Layer_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

          <g>
          
          <circle cx="200.52" cy="327.486" fill="none" r="47.248" stroke="#3B3A3E" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="20"/>
          
          <line fill="none" stroke="#3B3A3E" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="20" x1="247.768" x2="247.768" y1="327.486" y2="145.245"/>
          
          <polygon fill="none" points="   358.729,184.766 247.768,193.766 247.768,145.245 358.729,137.266  " stroke="#3B3A3E" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="20"/>
          
          <circle cx="200.52" cy="327.486" fill="#D9DCE1" r="47.248" stroke="#3B3A3E" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="20"/>
          
          <line fill="none" stroke="#3B3A3E" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="20" x1="247.768" x2="247.768" y1="327.486" y2="145.245"/>
          
          <polygon fill="#3C74BA" points="   358.729,184.766 247.768,193.766 247.768,145.245 358.729,137.266  " stroke="#3B3A3E" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" stroke-width="20"/>
          
          </g>
          
          </svg>`;
          const pinSvg = parser.parseFromString(
          pinSvgString,
          "image/svg+xml",
        ).documentElement;
        console.log(pinSvg)
        if(venues[i].lat && venues[i].lng){
          markers[venues[i].name] = new AdvancedMarkerElement({
            map: map,
            position: {
              lat: parseFloat(venues[i].lat),
              lng: parseFloat(venues[i].lng)
            },
            title: `${venues[i].name}: (${venues[i].lat}, ${venues[i].lng})`,
            content: pinSvg
          });
        }
      }
      setVenueMarkers(markers)
    }
  }

  let mapUI;
  useEffect(() => {
    let initMap = async () => {
      try{
        const { Map } = await google.maps.importLibrary("maps");
        mapUI = new Map(document.getElementById("mapUI"), {
          center: center,
          zoom: zoom,
          mapTypeControl: false,
          mapId: 'eff2d9f8600c8ed2',
        });
        await initMarkers(mapUI)
      } catch (err) {
        console.error('Error fetching map: ', err);
      }
    };
    initMap();
  }, [center, zoom]);

  return (
    <div className='map-container'>
      <div className='address-search'>
        <input 
          type='text'
          placeholder='Enter an address'
          value={address}
          onChange={handleAddressChange}
        />
        <button onClick={()=>handleAddressSelect()}>Find</button>
      </div>
      <div id="mapUI"></div>
    </div>
  );
}

export default SeattleMap;
