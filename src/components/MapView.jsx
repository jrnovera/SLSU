import React from 'react';
import GoogleMapReact from 'google-map-react';

const Marker = ({ text }) => (
  <div
    style={{
      color: 'white',
      background: '#1E88E5',
      padding: '10px 15px',
      display: 'inline-flex',
      textAlign: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '100%',
      transform: 'translate(-50%, -50%)',
      fontSize: '18px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    }}
  >
    {text}
  </div>
);

function MapView() {
  const defaultProps = {
    center: {
      lat: 13.6545,
      lng: 122.3334,
    },
    zoom: 14,
  };

  return (
    <div className="rounded-[30px] overflow-hidden shadow-md" style={{ height: '300px', width: '100%' }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: '' }} // Insert your API key here
        defaultCenter={defaultProps.center}
        defaultZoom={defaultProps.zoom}
      >
        <Marker lat={13.6545} lng={122.3334} text="📍" />
      </GoogleMapReact>
    </div>
  );
}

export default MapView;
