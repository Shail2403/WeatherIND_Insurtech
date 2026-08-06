import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons not showing in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to handle map clicks
const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to recenter map when lat/lon changes from outside
const MapUpdater = ({ lat, lon }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lon) {
      map.flyTo([lat, lon], map.getZoom());
    }
  }, [lat, lon, map]);
  return null;
};

const InteractiveMap = ({ lat, lon, onLocationSelect }) => {
  const defaultCenter = [51.505, -0.09]; // Default to London
  const center = lat && lon ? [lat, lon] : defaultCenter;

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden shadow-inner border border-gray-300 dark:border-gray-700 mb-6 relative z-0">
      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onLocationSelect={onLocationSelect} />
        {lat && lon && (
          <Marker position={[lat, lon]} />
        )}
        <MapUpdater lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
