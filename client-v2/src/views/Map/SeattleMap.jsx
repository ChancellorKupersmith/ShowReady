import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';
import { displayDate } from "./Filter/Menus/DateMenu";
import '../../styles/module/Map/map.css';
import { useSongsFilter } from './Filter/FilterContext';

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
          console.log('upcoming events: ')
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
  const { filters, updateFilters, filtersTotal, updateFiltersTotal } = useSongsFilter();
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
          req: {
              ...prevState.req,
              location: {
                  ...prevState.req.location,
                  venues: [...prevState.req.location.venues, venueName]
              }
          }
        }));
        updateFiltersTotal(filtersTotal + 1);
      }
    }

    if(event.target.closest('.ex-btn')){
      const venueName = event.target.closest('.ex-btn').dataset.venue;
      if(!filters.ex.location.venues.includes(venueName)){
        updateFilters((prevState) => ({
            ...prevState,
            ex: {
                ...prevState.ex,
                location: {
                    ...prevState.ex.location,
                    venues: [...prevState.ex.location.venues, venueName]
                }
            }
        }));
        updateFiltersTotal(filtersTotal + 1);
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
        <div className='venue-marker-popup-title-container'>
          <a style={{zIndex: '10'}} className='venue-marker-popup-title' href={venue.venueurl} target='_blank'>{venue.name}</a>
          <div className='venue-marker-popup-title-reqex-btn-container'>
              <button data-venue={venue.name} className='venue-marker-popup-title-reqex-btn req-btn'>
                <p>+</p>
              </button>
              <button data-venue={venue.name} className='venue-marker-popup-title-reqex-btn ex-btn'>
                <p>-</p>
              </button>
          </div>
        </div>
        <ul className='venue-marker-popup-events-container'>
          { events && events.length > 0 &&
              events.map((event, index) => {
                const imgSrc = event.eoimg ? (event.eoimg != venue.name ? event.eoimg : event.tmimg) : event.tmimg;
                return (
                  <a style={{zIndex: '10'}} className='venue-marker-popup-event' key={`event-info${index}`} href={ event.ticketslink ? event.ticketslink : event.url } target='_blank'>
                    { imgSrc && 
                      <img 
                        className='venue-marker-popup-event-img'
                        src={imgSrc}
                        onClick={e => { e.preventDefault(); console.log(e.target.parentNode); e.target.parentNode.click(); }}
                      />
                    }
                    <div className='venue-popup-event-info-container'
                    onClick={e => { e.preventDefault(); console.log(e.target.parentNode); e.target.parentNode.click(); }}
                    >
                      <div className='venue-popup-event-info'>
                        <div className='venue-popup-event-time'>
                          {/* <p>{event.venueid}</p> */}
                          <p>{event.venuelat}</p>
                          <p>{event.venuelng}</p>
                          <p className="date">{displayDate(event.eventdate).slice(0,5)}</p>
                          <p className='time'>{event.eventtime}</p>
                        </div>
                        <p className='price'>{event.price}</p>
                      </div>
                      <p className='venue-popup-event-name'>{event.eventname}</p>
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
      try{
        // only execute if map has loaded
        if(mapRef.current){
          // clear previous markers
          mapRef.current.eachLayer(layer => {
            if(layer instanceof L.Marker) {
              mapRef.current.removeLayer(layer);
            }
          });

          let venues = [];
          if(allVenues.length == 0){
            venues = await fetchVenues();
          }
          else {
            venues = allVenues.filter(v => !filters.ex.location.venues.includes(v.name) && upcomingEvents[v.name]);
          }
          const markers = {};
          venues.forEach(venue => {
            markers[venue.name] = createMarker(mapRef.current, venue)
          });
          // save for access to markers through context provider
          setVenueMarkers(markers)
        }
        } catch (err){
          console.error(err)
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

  return (
    <div className='map-container'>
      <div id="mapUI"></div>
    </div>
  );
}

export default SeattleMap;
