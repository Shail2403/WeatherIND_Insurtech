import { useState, useEffect } from 'react';
import { CloudRain, MapPin, Calendar, Loader2, Plus, Minus, Settings2, AlertCircle, Lock } from 'lucide-react';
import InteractiveMap from './InteractiveMap';

export default function InputForm({ onUploadSuccess, externalLocationTarget }) {
  const [formData, setFormData] = useState({
    latitude: '51.5074',
    longitude: '-0.1278',
    start_date: '2026-07-01',
    end_date: '2026-07-05'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationName, setLocationName] = useState('Locating...');
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Sync with external target from FileBrowser
  useEffect(() => {
    if (externalLocationTarget) {
      setFormData(prev => ({
        ...prev,
        latitude: externalLocationTarget.lat.toFixed(4),
        longitude: externalLocationTarget.lon.toFixed(4)
      }));
    }
  }, [externalLocationTarget]);

  // History State
  const [trackHistory, setTrackHistory] = useState(() => {
    const saved = localStorage.getItem('trackHistory');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [locationHistory, setLocationHistory] = useState(() => {
    const saved = localStorage.getItem('locationHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('trackHistory', JSON.stringify(trackHistory));
  }, [trackHistory]);

  useEffect(() => {
    localStorage.setItem('locationHistory', JSON.stringify(locationHistory));
  }, [locationHistory]);

  // Reverse Geocoding Effect with Debounce
  useEffect(() => {
    const lat = parseFloat(formData.latitude);
    const lon = parseFloat(formData.longitude);
    
    if (isNaN(lat) || isNaN(lon)) return;

    setIsGeocoding(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
          headers: { 'Accept-Language': 'en-US,en;q=0.9' }
        });
        const data = await response.json();
        
        if (data && data.display_name) {
          const addr = data.address || {};
          const area = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
          const state = addr.state || '';
          const country = addr.country || '';
          const postcode = addr.postcode || '';
          
          let cleanName = [area, state, country].filter(Boolean).join(', ');
          if (postcode) cleanName += ` - ${postcode}`;
          
          const finalName = cleanName || data.display_name;
          setLocationName(finalName);
          
          if (trackHistory) {
            setLocationHistory(prev => {
              const newEntry = { lat, lon, name: finalName };
              const filtered = prev.filter(p => p.lat !== lat || p.lon !== lon);
              return [newEntry, ...filtered].slice(0, 10);
            });
          }
        } else {
          setLocationName('Unknown Location');
        }
      } catch (err) {
        console.error("Geocoding error:", err);
        setLocationName('Unknown Location');
      } finally {
        setIsGeocoding(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [formData.latitude, formData.longitude]);

  const requestGeolocation = async () => {
    if ("geolocation" in navigator) {
      // Check permissions first if API is available
      if (navigator.permissions) {
        try {
          const perm = await navigator.permissions.query({ name: 'geolocation' });
          if (perm.state === 'denied') {
            setGeoError(true);
            setIsLocating(false);
            return;
          }
        } catch (e) {
          // fallback if permissions API fails
        }
      }

      setIsLocating(true);
      setGeoError(false);
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(4),
            longitude: position.coords.longitude.toFixed(4)
          }));
          setGeoError(false);
          setIsLocating(false);
        },
        (err) => {
          console.warn("Geolocation denied or error:", err);
          setGeoError(true);
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      setGeoError(true);
    }
  };

  useEffect(() => {
    requestGeolocation();
  }, []);

  // Today's date for limiting future dates
  const d = new Date();
  const today = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  useEffect(() => {
    // Clear validation errors when user changes dates
    if (error) setError(null);
  }, [formData.start_date, formData.end_date]);

  // Date Modifier State
  const [modifierAction, setModifierAction] = useState('add'); // 'add' or 'subtract'
  const [modifierTarget, setModifierTarget] = useState('start'); // 'start' or 'end'
  const [modifierAmount, setModifierAmount] = useState(1);
  const modifierOptions = [1, 2, 3, 5, 10, 15, 30, 31];

  const getModifierValidity = () => {
    if (!formData.start_date || !formData.end_date) return false;
    const amount = parseInt(modifierAmount, 10);
    const s = new Date(formData.start_date);
    const e = new Date(formData.end_date);
    
    if (modifierTarget === 'start' || modifierTarget === 'both') {
      s.setDate(modifierAction === 'add' ? s.getDate() - amount : s.getDate() + amount);
    }
    if (modifierTarget === 'end' || modifierTarget === 'both') {
      e.setDate(modifierAction === 'add' ? e.getDate() + amount : e.getDate() - amount);
    }
    return s > e; // Invalid if start goes beyond end
  };

  const isModifierInvalid = getModifierValidity();

  const applyModifier = () => {
    if (isModifierInvalid) return;
    
    const amount = parseInt(modifierAmount, 10);
    const newFormData = { ...formData };

    if (modifierTarget === 'start' || modifierTarget === 'both') {
      if (newFormData.start_date) {
        const start = new Date(newFormData.start_date);
        start.setDate(modifierAction === 'add' ? start.getDate() - amount : start.getDate() + amount);
        newFormData.start_date = start.toISOString().split('T')[0];
      }
    }

    if (modifierTarget === 'end' || modifierTarget === 'both') {
      if (newFormData.end_date) {
        const end = new Date(newFormData.end_date);
        end.setDate(modifierAction === 'add' ? end.getDate() + amount : end.getDate() - amount);
        newFormData.end_date = end.toISOString().split('T')[0];
      }
    }

    setFormData(newFormData);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/store-weather-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          start_date: formData.start_date,
          end_date: formData.end_date
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        let errStr = data.detail || 'Failed to fetch weather data';
        if (Array.isArray(data.detail)) {
          errStr = data.detail.map(e => e.msg).join(', ');
        } else if (typeof data.detail === 'object') {
          errStr = JSON.stringify(data.detail);
        }
        throw new Error(errStr);
      }

      onUploadSuccess(data.file);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Geolocation Retry / Error Banner */}
      {isLocating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse mb-4">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          <p>Requesting location permission from browser...</p>
        </div>
      )}

      {geoError && !isLocating && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 p-3 rounded-lg text-sm flex flex-col items-start gap-2 animate-fade-in mb-4">
          <div className="flex items-start gap-2">
            <Lock className="w-5 h-5 shrink-0 mt-0.5 text-orange-500" />
            <p className="break-words">
              <strong>Location access denied.</strong> Your browser blocked location access. Click the "Lock" icon in your URL bar to allow it, or click the map manually.
            </p>
          </div>
          <button 
            type="button"
            onClick={requestGeolocation}
            className="ml-7 bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-900 dark:text-orange-100 px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-sm"
          >
            Retry Location
          </button>
        </div>
      )}

      {/* Location Banner */}
      <div className="bg-climate-accent/10 border border-climate-accent/30 text-climate-accent p-3 rounded-lg flex items-center gap-2 mb-4">
        {isGeocoding ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
        <span className="text-sm font-medium">
          You are viewing for: {isGeocoding ? 'Locating...' : (locationName || 'Unknown Location')}
        </span>
      </div>

      {/* Interactive Map */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-climate-accent" />
          Select Location on Map
        </label>
        <InteractiveMap 
          lat={formData.latitude ? parseFloat(formData.latitude) : null}
          lon={formData.longitude ? parseFloat(formData.longitude) : null}
          locationHistory={locationHistory}
          trackHistory={trackHistory}
          onToggleHistory={() => setTrackHistory(!trackHistory)}
          onLocationSelect={(lat, lon) => {
            setFormData(prev => ({
              ...prev,
              latitude: lat.toFixed(4),
              longitude: lon.toFixed(4)
            }));
          }}
        />
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center gap-1">
            <MapPin size={16} className="text-climate-accent" /> Latitude
          </label>
          <input
            type="number"
            step="any"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:border-climate-accent transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-1 flex items-center gap-1">
            <MapPin size={16} className="text-climate-accent" /> Longitude
          </label>
          <input
            type="number"
            step="any"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:border-climate-accent transition-colors"
          />
        </div>
      </div>

      {/* Date Modifier Tool */}
      <div className="bg-gray-100 dark:bg-climate-dark/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase flex items-center gap-1">
          <Settings2 size={12} /> Advanced Date Modifier
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
          
          {/* Action Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={modifierAction}
              onChange={(e) => setModifierAction(e.target.value)}
              className="w-full bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-lg py-2 px-2 focus:outline-none focus:border-climate-accent shadow-sm"
            >
              <option value="add">➕ Add number of days</option>
              <option value="subtract">➖ Remove number of days</option>
            </select>
          </div>

          {/* Amount Dropdown */}
          <div className="sm:col-span-3">
            <select 
              value={modifierAmount} 
              onChange={(e) => setModifierAmount(e.target.value)}
              className="w-full bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-lg py-2 px-2 focus:outline-none focus:border-climate-accent shadow-sm"
            >
              {modifierOptions.map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Day' : 'Days'}</option>
              ))}
            </select>
          </div>

          <div className="hidden sm:block text-center text-gray-500 text-sm sm:col-span-1">
            to
          </div>

          {/* Target Dropdown */}
          <div className="sm:col-span-4">
            <select 
              value={modifierTarget} 
              onChange={(e) => setModifierTarget(e.target.value)}
              className="w-full bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-lg py-2 px-2 focus:outline-none focus:border-climate-accent shadow-sm"
            >
              <option value="start">▶️ Start Date</option>
              <option value="end">⏹️ End Date</option>
              <option value="both">🔀 Both Dates</option>
            </select>
          </div>
        </div>
        
        {/* Apply Button & Validation Warning */}
        <div className="mt-3 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-2">
          <div className="flex-1">
            {isModifierInvalid && (
              <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400 text-xs font-bold animate-pulse">
                <AlertCircle size={14} /> 
                <span>⚠️ Diff Error: No. of Days to Remove is greater than the Date Difference!</span>
              </div>
            )}
          </div>
          <button 
            type="button" 
            onClick={applyModifier}
            disabled={isModifierInvalid}
            className={`text-sm font-medium py-1.5 px-4 rounded-lg shadow-sm transition-colors ${
              isModifierInvalid 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                : 'bg-climate-accent hover:bg-blue-600 text-white'
            }`}
          >
            Apply Modification
          </button>
        </div>
      </div>

      {/* Dates */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-400 flex items-center gap-1">
            <Calendar size={16} className="text-climate-accent" /> Date Range
          </label>
          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 7);
                setFormData({...formData, start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0]});
              }}
              className="text-xs bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 hover:border-climate-accent dark:hover:border-climate-accent px-2 py-1 rounded text-gray-700 dark:text-gray-300 transition-colors"
            >
              7 Days
            </button>
            <button 
              type="button" 
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 30);
                setFormData({...formData, start_date: start.toISOString().split('T')[0], end_date: end.toISOString().split('T')[0]});
              }}
              className="text-xs bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 hover:border-climate-accent dark:hover:border-climate-accent px-2 py-1 rounded text-gray-700 dark:text-gray-300 transition-colors"
            >
              30 Days
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              max={today}
              required
              className="w-full bg-gray-50 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:border-climate-accent transition-colors shadow-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">End Date</label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              max={today}
              required
              className="w-full bg-gray-50 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:border-climate-accent transition-colors shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-climate-accent hover:bg-sky-400 text-climate-dark font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} /> Processing...
          </>
        ) : (
          <>
            <CloudRain size={20} /> Fetch & Store Weather Data
          </>
        )}
      </button>
    </form>
  );
}
