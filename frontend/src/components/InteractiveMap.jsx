import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Tooltip, useMapEvents, useMap } from 'react-leaflet';
import { Maximize2, Minimize2, Download } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
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

// Component to handle map resizing when maximizing
const MapResizer = ({ isMaximized }) => {
  const map = useMap();
  useEffect(() => {
    // Delay slightly to let the CSS transition finish before invalidating size
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [isMaximized, map]);
  return null;
};

const InteractiveMap = ({ lat, lon, onLocationSelect, locationHistory = [], trackHistory = true, onToggleHistory }) => {
  const defaultCenter = [51.505, -0.09]; // Default to London
  const center = lat && lon ? [lat, lon] : defaultCenter;
  const [isMaximized, setIsMaximized] = useState(false);
  const mapContainerRef = useRef(null);

  const handleDownload = async () => {
    if (!mapContainerRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(mapContainerRef.current, { backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = 'map_snapshot.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download map', err);
      alert('Failed to download map screenshot. Browsers sometimes block external map tiles for security.');
    }
  };

  const wrapperClasses = isMaximized 
    ? "fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in"
    : "";

  const mapClasses = isMaximized
    ? "w-full max-w-7xl h-[80vh] rounded-2xl overflow-hidden shadow-2xl relative"
    : "w-full h-72 rounded-xl overflow-hidden shadow-inner border border-gray-300 dark:border-gray-700 mb-6 relative z-0";

  return (
    <div 
      className={wrapperClasses}
      onClick={() => isMaximized && setIsMaximized(false)}
    >
      <div 
        ref={mapContainerRef} 
        className={mapClasses}
        onClick={(e) => isMaximized && e.stopPropagation()}
      >
        
        {/* Floating Action Buttons (Moved to Bottom Left to avoid Leaflet Zoom controls) */}
        <div className="absolute bottom-6 left-4 z-[1000] flex flex-row gap-3">
          <button 
            type="button"
            onClick={() => setIsMaximized(!isMaximized)}
            className="px-3 py-2 flex items-center gap-2 rounded-xl bg-blue-600 text-white shadow-[0_4px_12px_rgba(37,99,235,0.5)] border border-blue-500 hover:bg-blue-500 hover:-translate-y-1 hover:scale-105 transition-all backdrop-blur-md font-bold text-sm"
            title={isMaximized ? "Minimize Map" : "Maximize Map"}
          >
            {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            <span className="hidden sm:inline">{isMaximized ? "Minimize" : "Maximize"}</span>
          </button>
          <button 
            type="button"
            onClick={handleDownload}
            className="px-3 py-2 flex items-center gap-2 rounded-xl bg-emerald-600 text-white shadow-[0_4px_12px_rgba(5,150,105,0.5)] border border-emerald-500 hover:bg-emerald-500 hover:-translate-y-1 hover:scale-105 transition-all backdrop-blur-md font-bold text-sm"
            title="Download Map Snapshot"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Snapshot</span>
          </button>
        </div>

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

        {/* Map Legend */}
        <div className="absolute bottom-6 right-4 z-[1000] bg-white/90 dark:bg-gray-800/90 p-2.5 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-800 dark:text-gray-200">Current Target</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-sm"></div>
            <span className="text-gray-800 dark:text-gray-200">History Location</span>
          </div>
        </div>

        <MapUpdater lat={lat} lon={lon} />
        <MapResizer isMaximized={isMaximized} />
      </MapContainer>
      </div>
    </div>
  );
};

export default InteractiveMap;
