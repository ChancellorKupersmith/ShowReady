import React, { useState, useEffect} from 'react';
import FilterView from '../Filter/FilterView';

const SeattleMap = () => {
  // default center seattle
  const [center, setCenter] = useState({lat: 47.608013, lng: -122.335167});
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

  let mapUI;
  useEffect(() => {
    let initMap = async () => {
      try{
        const { Map } = await google.maps.importLibrary("maps");
        mapUI = new Map(document.getElementById("mapUI"), {
          center: center,
          zoom: 11,
          mapTypeControl: false,
        });
      } catch (err) {
        console.error('Error fetching map: ', err);
      }
    };
    initMap();
  }, []);

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
