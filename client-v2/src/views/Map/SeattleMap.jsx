import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { displayDate } from "./Filter/Menus/DateMenu";
import EventDateSvg from "../../assets/event-date.svg";
import EventTimeSvg from "../../assets/event-time.svg";
import { useSongsFilter } from './Filter/FilterContext';
import '../../styles/module/Map/map.css';

const MapContext = createContext();
export const useMap = () => useContext(MapContext);
export const MapContextProvider = ({children}) => {
  // default center seattle
  const [center, setCenter] = useState({lat: 47.608013, lng: -122.3217481});
  const updateMapCenter = (lat, lng) => {
    console.log('hit')
    const latOffset = (parseFloat(lat) + 0.00275); // lowering so entire popup is visible on small screens
    setCenter({ lat: latOffset, lng: lng });
  }
  const [zoom, setZoom] = useState(12);
  const [allVenues, setAllVenues] = useState([]);
  const [venueMarkers, updateVenueMarkers] = useState({});
  const setVenueMarkers = (venues) => {
    updateVenueMarkers(venues);
  };
  const findVenue = async (venueName) => {
    allVenues.forEach(v => {
      if(v.name == venueName) {
        setZoom(16);
        const latOffset = (parseFloat(v.lat) + 0.00275); // lowering so entire popup is visible on small screens
        setCenter({ lat: latOffset, lng: v.lng });
        venueMarkers[v.name].openPopup();
      }
    });
  };

  const { filters } = useSongsFilter();
  const [upcomingEvents, setUpcomingEvents] = useState({});
  const [loading, setLoading] = useState(false);
  // Fetch all upcoming events based on filters
  useEffect(() => {
    const fetchEvents = async () => {
      try{
        setLoading(true);
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
        setUpcomingEvents(data);
      } catch(err) {
          console.error(err)
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [filters]);


  return (
    <MapContext.Provider value={{center, updateMapCenter, findVenue, zoom, setZoom, venueMarkers, setVenueMarkers, allVenues, setAllVenues, upcomingEvents, setUpcomingEvents, loading}}>
      { children }
    </MapContext.Provider>
  );
};


const EventCard = ({event, venue}) => {
  // TODO: dirty data from scrapers where some eo images are the venue's name
  const imgSrc = event.eoimg ? (event.eoimg != venue.name ? event.eoimg : event.tmimg) : event.tmimg;
  return (
    <a className='venue-marker-popup-eventcard-container' href={ event.ticketslink ? event.ticketslink : event.url } target='_blank'>
      <div className='venue-marker-popup-eventcard'>
        <div className='venue-marker-popup-event-backgroundimg' style={{backgroundImage: `url(${imgSrc})`}} />
        {/* gradient overlay for better text readability */}
        <div className='text-overlay' />
        <div className='venue-popup-event-info-container'>        
          <h2 className='venue-popup-event-info-name'>{event.eventname}</h2>
            <div className='venue-popup-event-info'>
              <img
                loading='lazy'
                src={EventDateSvg}
                alt='event date'
              />
              <span>{displayDate(event.eventdate).slice(0,5)}</span>
            </div>
            <div  className='venue-popup-event-info'>
              <img
                loading='lazy'
                src={EventTimeSvg}
                alt='event time'
              />
              <span>{event.eventtime}</span>
              { event.price && <div className='venue-popup-event-info-price'>{event.price}</div> }
            </div>
        </div>
      </div>
    </a>
  );
};

const SeattleMap = () => {
  const { center, updateMapCenter, zoom, setZoom, setVenueMarkers, allVenues, setAllVenues, upcomingEvents, loading } = useMap();
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

  const handleReqVenueOnClick = (venueName) => {
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
  };
  const handleExVenueOnClick = (venueName) => {
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
  };
  const MarkerPopup = ({venue, events}) => {
    return (
      <div className='venue-marker-popup'>
        <div className='venue-marker-popup-title-container'>
          <a style={{zIndex: '10'}} className='venue-marker-popup-title' href={venue.venueurl} target='_blank'>{venue.name}</a>
          <div className='venue-marker-popup-title-reqex-btn-container'>
              <button 
                data-venue={venue.name}
                className='venue-marker-popup-title-reqex-btn req-btn'
                onClick={() => handleReqVenueOnClick(venue.name)}
              >
                <p>+</p>
              </button>
              <button
                data-venue={venue.name}
                className='venue-marker-popup-title-reqex-btn ex-btn'
                onClick={() => handleExVenueOnClick(venue.name)}
              >
                <p>-</p>
              </button>
          </div>
        </div>
        <ul className='venue-marker-popup-events-container'>
          { events && events.length > 0 &&
              events.map((event, index) => <EventCard key={'event-card-' + index} event={event} venue={venue}/>)
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
      updateMapCenter(venue.lat, venue.lng);
      // Enable onClick event handling of leafletJS marker Popups by
      // 1st rendering an empty element
      const container = document.createElement('div');
      marker.getPopup().setContent(container);
      // 2nd mounting MarkerPopup into container and adding to DOM
      const root = createRoot(container);
      root.render(
        <MarkerPopup venue={venue} events={venueEvents ? venueEvents : []}/>
      );
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
    const manualZoomIn = () => setZoom(prevState => (prevState + 0.5));
    const manualZoomOut = () => setZoom(prevState => (prevState - 0.5));
    const zoomInBtn = document.querySelector('.leaflet-control-zoom-in');
    const zoomOutBtn = document.querySelector('.leaflet-control-zoom-out');
    zoomInBtn.addEventListener('click', manualZoomIn);
    zoomOutBtn.addEventListener('click', manualZoomOut);
    return () => {
      zoomInBtn.removeEventListener('click', manualZoomIn);
      zoomOutBtn.removeEventListener('click', manualZoomOut);
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
      { loading && <div style={{zIndex: '20'}} className="loading-animation"></div> }
    </div>
  );
}

export default SeattleMap;
