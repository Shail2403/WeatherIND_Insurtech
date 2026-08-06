import { useState } from 'react';
import { CloudRain, MapPin, Calendar, Loader2, Plus, Minus, Settings2 } from 'lucide-react';

export default function InputForm({ onUploadSuccess }) {
  const [formData, setFormData] = useState({
    latitude: '51.5074',
    longitude: '-0.1278',
    start_date: '2026-07-01',
    end_date: '2026-07-05'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date Modifier State
  const [modifierAction, setModifierAction] = useState('add'); // 'add' or 'subtract'
  const [modifierTarget, setModifierTarget] = useState('start'); // 'start' or 'end'
  const [modifierAmount, setModifierAmount] = useState(1);
  const modifierOptions = [1, 2, 3, 5, 10, 15, 30, 31];

  const applyModifier = () => {
    const amount = parseInt(modifierAmount, 10);
    let newFormData = { ...formData };

    if (modifierTarget === 'start' || modifierTarget === 'both') {
      if (newFormData.start_date) {
        const start = new Date(newFormData.start_date);
        start.setDate(modifierAction === 'add' ? start.getDate() + amount : start.getDate() - amount);
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
        throw new Error(data.detail || 'Failed to fetch weather data');
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
              <option value="start">📅 Start Date</option>
              <option value="end">📅 End Date</option>
              <option value="both">📅 Both Dates</option>
            </select>
          </div>
        </div>
        
        {/* Apply Button */}
        <div className="mt-3 flex justify-end">
          <button 
            type="button" 
            onClick={applyModifier}
            className="bg-climate-accent hover:bg-blue-600 text-white text-sm font-medium py-1.5 px-4 rounded-lg shadow-sm transition-colors"
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
        
        <div className="grid grid-cols-2 gap-4">
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:border-climate-accent transition-colors"
          />
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            required
            className="w-full bg-gray-50 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-900 dark:text-white focus:outline-none focus:border-climate-accent transition-colors"
          />
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
