import React from 'react';
import MapView from './MapView';

function LocationMap() {
  return (
    <section className="bg-white rounded-[30px] p-6 shadow-md">
      <h3 className="text-xl font-bold text-[#333] mb-1">Location Map</h3>
      <p className="text-sm text-gray-600 mb-4">
        Coordinates: <span className="font-medium">13.6545° N, 122.3334° E</span>
      </p>
      <MapView />
    </section>
  );
}

export default LocationMap;
