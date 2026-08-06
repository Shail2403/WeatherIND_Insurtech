import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
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

const InteractiveMap = ({ lat, lon, onLocationSelect, locationHistory = [], trackHistory = true, onToggleHistory }) => {
  const defaultCenter = [51.505, -0.09]; // Default to London
  const center = lat && lon ? [lat, lon] : defaultCenter;

  return (
    <div className="w-full h-72 rounded-xl overflow-hidden shadow-inner border border-gray-300 dark:border-gray-700 mb-6 relative z-0">
      
      {/* Absolute Toggle Button */}
      <div className="absolute top-3 right-3 z-[1000]">
        <button 
          type="button"
          onClick={onToggleHistory}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg transition-all backdrop-blur-md border ${trackHistory ? 'bg-green-500/90 text-white border-green-400' : 'bg-gray-500/90 text-white border-gray-400'}`}
          title="Toggle saving history to local storage"
        >
          Track History: {trackHistory ? 'ON' : 'OFF'}
        </button>
      </div>

      <MapContainer 
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onLocationSelect={onLocationSelect} />
        
        {/* Render History Markers */}
        {trackHistory && locationHistory.map((loc, idx) => (
          <CircleMarker 
            key={`${loc.lat}-${loc.lon}-${idx}`}
            center={[loc.lat, loc.lon]}
            radius={8}
            pathOptions={{ color: 'white', weight: 2, fillColor: '#f97316', fillOpacity: 0.8 }}
            eventHandlers={{
              click: () => onLocationSelect(loc.lat, loc.lon)
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-xs font-semibold">History: {loc.name}</div>
              <div className="text-[10px] text-gray-500 text-center">Click to select</div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Current Location Marker */}
        {lat && lon && (
          <Marker position={[lat, lon]}>
            <Tooltip permanent direction="bottom" offset={[0, 10]} opacity={0.9} className="font-bold text-blue-600">
              Current Target
            </Tooltip>
          </Marker>
        )}
        <MapUpdater lat={lat} lon={lon} />
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;
