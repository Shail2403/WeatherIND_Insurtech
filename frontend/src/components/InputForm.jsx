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
    const targetDateStr = modifierTarget === 'start' ? formData.start_date : formData.end_date;
    if (!targetDateStr) return;
    
    const date = new Date(targetDateStr);
    const amount = parseInt(modifierAmount, 10);
    
    if (modifierAction === 'add') {
      date.setDate(date.getDate() + amount);
    } else {
      date.setDate(date.getDate() - amount);
    }
    
    const newDateStr = date.toISOString().split('T')[0];
    setFormData({
      ...formData,
      [modifierTarget === 'start' ? 'start_date' : 'end_date']: newDateStr
    });
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
      <div className="bg-gray-100 dark:bg-climate-dark/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase flex items-center gap-1">
          <Settings2 size={12} /> Date Modifier
        </label>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Action */}
          <div className="flex bg-gray-200 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setModifierAction('add')}
              className={`px-3 py-1.5 flex items-center gap-1 text-sm ${modifierAction === 'add' ? 'bg-climate-accent text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
              title="Add Days"
            >
              <Plus size={14} />
            </button>
            <button
              type="button"
              onClick={() => setModifierAction('subtract')}
              className={`px-3 py-1.5 flex items-center gap-1 text-sm ${modifierAction === 'subtract' ? 'bg-red-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
              title="Subtract Days"
            >
              <Minus size={14} />
            </button>
          </div>

          {/* Amount */}
          <select 
            value={modifierAmount} 
            onChange={(e) => setModifierAmount(e.target.value)}
            className="bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-lg py-1.5 px-2 focus:outline-none focus:border-climate-accent"
          >
            {modifierOptions.map(num => (
              <option key={num} value={num}>{num} {num === 1 ? 'Day' : 'Days'}</option>
            ))}
          </select>

          <span className="text-gray-500 text-sm">to</span>

          {/* Target */}
          <select 
            value={modifierTarget} 
            onChange={(e) => setModifierTarget(e.target.value)}
            className="bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 text-sm rounded-lg py-1.5 px-2 focus:outline-none focus:border-climate-accent"
          >
            <option value="start">Start Date</option>
            <option value="end">End Date</option>
          </select>

          {/* Apply */}
          <button 
            type="button" 
            onClick={applyModifier}
            className="ml-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium py-1.5 px-3 rounded-lg transition-colors"
          >
            Apply
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
