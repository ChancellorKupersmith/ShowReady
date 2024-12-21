import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { displayDate } from "../../Filter/Menus/DateMenu";
import './Map.css'
import { useSongsFilter } from '../../Filter/FilterContext';

const MapContext = createContext();
export const useMap = () => useContext(MapContext);
export const MapContextProvider = ({children}) => {
  // default center seattle
  const [center, setCenter] = useState({lat: 47.608013, lng: -122.3217481});
  const [zoom, setZoom] = useState(12);
  const [allVenues, setAllVenues] = useState([]);
  const [venueMarkers, updateVenueMarkers] = useState({});
  const setVenueMarkers = (venues) => {
    updateVenueMarkers(venues);
  };
  const findVenue = async (venueName) => {
    allVenues.forEach(v => {
      if(v.name == venueName) {
        console.log(v)
        setZoom(16);
        setCenter({ lat: v.lat, lng: v.lng });
        venueMarkers[v.name].openPopup();
      }
    });
  };

  const { filters } = useSongsFilter();
  const [upcomingEvents, setUpcomingEvents] = useState({});
  // Fetch all upcoming events based on filters
  useEffect(() => {
    const fetchEvents = async () => {
      try{
          const postData = {
              filters: filters
          };
          const response = await fetch('/songs_list/upcoming_events', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(postData)
          });
          const data = await response.json();
          console.log(data);
          setUpcomingEvents(data);
      } catch(err) {
          console.error(err)
      }
    };
    
    fetchEvents();
  }, [filters]);


  return (
    <MapContext.Provider value={{center, setCenter, findVenue, zoom, setZoom, venueMarkers, setVenueMarkers, allVenues, setAllVenues, upcomingEvents, setUpcomingEvents}}>
      { children }
    </MapContext.Provider>
  );
};

const SeattleMap = () => {
  const { center, zoom, setVenueMarkers, allVenues, setAllVenues, upcomingEvents } = useMap();
  const { filters, updateFilters } = useSongsFilter();
  const mapRef = useRef(null);

  // HELPER FUNCS
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
  // writing one click handler to avoid performance issues with dealing with many individual event listeners
  const handleReqExVenueClick = (event) => {
    if(event.target.closest('.req-btn')){
      const venueName = event.target.closest('.req-btn').dataset.venue;
      if(!filters.req.location.venues.includes(venueName)){
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
      }
    }

    if(event.target.closest('.ex-btn')){
      const venueName = event.target.closest('.ex-btn').dataset.venue;
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
      mapRef.current.eachLayer(layer => {
        if(layer.options.id == `map-marker-${venueName}`) {
          mapRef.current.removeLayer(layer);
        }
      });
    }
  }

  const MarkerPopup = ({venue, events}) => {
    return (
      <div className='venue-marker-popup'>
        <div className='title'>
          <a className='venue-name' href={venue.venueurl} target='_blank'>{venue.name}</a>
          <div className='reqex-btn-container'>
              <button data-venue={venue.name} className='reqex-btn req-btn'>
                <p>+</p>
              </button>
              <button data-venue={venue.name} className='reqex-btn ex-btn'>
                <p>-</p>
              </button>
          </div>
        </div>
        <ul className='events-info-list'>
          { events && events.length > 0 &&
              events.map((event, index) => {
                const imgSrc = event.eoimg ? (event.eoimg != venue.name ? event.eoimg : event.tmimg) : event.tmimg;
                return (
                  <a key={`event-info${index}`} href={ event.ticketslink ? event.ticketslink : event.url } target='_blank'>
                    { imgSrc && 
                      <img 
                        className='eventImg'
                        src={imgSrc}
                        onClick={e => { e.preventDefault(); console.log(e.target.parentNode); e.target.parentNode.click(); }}
                      />
                    }
                    <div className='event-info-container'>
                      <p className="date">{displayDate(event.eventdate).slice(0,5)}</p>
                      <p className='event'>{event.eventname}</p>
                    </div>
                  </a>
                );
              })
          }
        </ul>
      </div>
    );
  };
  const createMarker = (map, venue) => {
    const marker = L.marker([parseFloat(venue.lat), parseFloat(venue.lng)], {
      id: `map-marker-${venue.name}`
    });
    marker.addTo(map);
    marker.bindPopup('Loading...');
    const venueEvents = upcomingEvents[venue.name];
    marker.on('popupopen', ()=>{
      const popupContent = ReactDOMServer.renderToString(
        <MarkerPopup venue={venue} events={venueEvents ? venueEvents : []}/>
      );
      marker.getPopup().setContent(popupContent);
    });

    return marker;
  };

  /* INIT MAP
    - create map
    - add overlay
    - init markers
  */
  useEffect(() => {
    let initMap = async () => {
      try {
        // only init once
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
        }
      } catch (err) {
        console.error('Error initilaizing map: ', err);
      }
    };

    initMap();
    document.addEventListener('click', handleReqExVenueClick);
    return () => {
      document.removeEventListener('click', handleReqExVenueClick);
    }

  }, []);
  
  /* INIT MARKERS
    rerenders based on upcoming events to keep popup event info current
    - removes previous marker instances
    - for each venue (excluding those specified in filters)
    - saves list to map context
  */
  useEffect(() => {
    const initMarkers = async () => {
      // only execute if map has loaded
      if(mapRef.current){
        // clear previous markers
        mapRef.current.eachLayer(layer => {
          if(layer instanceof L.Marker) {
            mapRef.current.removeLayer(layer);
          }
        });

        let venues;
        if(allVenues.length == 0){
          venues = await fetchVenues();
        }
        else {
          venues = allVenues.filter(v => !filters.ex.location.venues.includes(v.name));
        }
        const markers = {};
        venues.forEach(venue => {
          markers[venue.name] = createMarker(mapRef.current, venue)
        });
        // save for access to markers through context provider
        setVenueMarkers(markers)
      }
    };

    initMarkers();
  }, [upcomingEvents]);

  /* Sync map view with center and zoom
  */
  useEffect(() => {
    // only execute if map has loaded
    if(mapRef.current){
      mapRef.current.setView([center.lat, center.lng], zoom)
    }
  }, [center, zoom])
  // sync map markers with filters
  useEffect(() => {
    const addMissingMarkers = async () => {
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
            createMarker(mapRef.current, v);
          }
        });
      }
    };

    addMissingMarkers();
  }, [filters]);


  return (
    <div className='map-container'>
      <div id="mapUI"></div>
    </div>
  );
}

export default SeattleMap;
