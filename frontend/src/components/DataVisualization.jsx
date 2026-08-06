import { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { 
  Loader2, TrendingUp, Thermometer, AlertTriangle, LineChart as LineChartIcon, AreaChart as AreaChartIcon,
  MapPin, Calendar, CloudRain, Wind, ThermometerSun, ThermometerSnow, CheckCircle2, Cloud
} from 'lucide-react';

export default function DataVisualization({ selectedFile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line' or 'area'

  const [headerLocation, setHeaderLocation] = useState('Locating...');
  
  // Reverse Geocoding for Header based on file name
  useEffect(() => {
    if (!selectedFile) return;
    const parts = selectedFile.split('_');
    if (parts.length >= 3) {
      const lat = parseFloat(parts[1]);
      const lon = parseFloat(parts[2]);
      if (!isNaN(lat) && !isNaN(lon)) {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
          .then(res => res.json())
          .then(data => {
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county;
            const state = addr.state;
            const country = addr.country;
            const name = [city, state, country].filter(Boolean).join(', ') || data.display_name;
            setHeaderLocation(name);
          })
          .catch(() => setHeaderLocation(`Coordinates: ${lat}, ${lon}`));
      }
    }
  }, [selectedFile]);

  useEffect(() => {
    if (!selectedFile) return;

    const fetchFileData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`http://127.0.0.1:8000/weather-file-content/${selectedFile}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.detail || 'Failed to fetch file content');
        }

        if (result.daily?.time && result.daily?.temperature_2m_max) {
          const chartData = result.daily.time.map((timeStr, index) => {
            const date = new Date(timeStr);
            return {
              time: `${date.getDate()}/${date.getMonth()+1}`,
              dateObj: date,
              temperature: result.daily.temperature_2m_max[index],
              minTemp: result.daily.temperature_2m_min[index],
              precipitation: result.daily.precipitation_sum ? result.daily.precipitation_sum[index] : 0,
              windSpeed: result.daily.wind_speed_10m_max ? result.daily.wind_speed_10m_max[index] : 0,
              timestamp: date.getTime()
            };
          });
          
          setData(chartData);
        } else {
          throw new Error("Invalid data format received from S3.");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFileData();
  }, [selectedFile]);

  if (!selectedFile) {
    return (
      <div className="h-96 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <TrendingUp size={48} className="mb-4 opacity-50 text-climate-accent" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">Select a file from the File Browser to visualize data</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-96 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center text-climate-accent">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p className="font-medium text-gray-600 dark:text-gray-400">Fetching and parsing JSON from Supabase S3...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 border-2 border-dashed border-red-500/50 rounded-lg flex flex-col items-center justify-center text-red-500 p-8 text-center bg-red-50 dark:bg-red-900/10">
        <AlertTriangle size={48} className="mb-4" />
        <p className="font-bold">Error loading data visualization:</p>
        <p className="font-mono text-sm mt-2 opacity-80">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // Formatting Dates
  const startDate = data[0].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endDate = data[data.length - 1].dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Math Calculations
  const maxTemps = data.map(d => d.temperature).filter(t => t != null);
  const minTemps = data.map(d => d.minTemp).filter(t => t != null);
  const precip = data.map(d => d.precipitation).filter(p => p != null);
  const winds = data.map(d => d.windSpeed).filter(w => w != null);

  const peakHigh = Math.max(...maxTemps);
  const lowestLow = Math.min(...minTemps);
  const avgHigh = (maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length).toFixed(1);
  const avgLow = (minTemps.reduce((a, b) => a + b, 0) / minTemps.length).toFixed(1);
  
  const totalRain = precip.reduce((a, b) => a + b, 0).toFixed(1);
  const rainDays = precip.filter(p => p > 0.5).length;
  
  const maxWind = winds.length > 0 ? Math.max(...winds).toFixed(1) : 'N/A';
  const avgWind = winds.length > 0 ? (winds.reduce((a, b) => a + b, 0) / winds.length).toFixed(1) : 'N/A';
  const observations = data.length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-xl border-l-4 border-l-climate-accent bg-gradient-to-r from-blue-50/50 to-white dark:from-blue-900/20 dark:to-climate-card/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="text-climate-accent" size={24} /> {headerLocation}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              <Calendar size={16} /> <span>{startDate} – {endDate}</span>
              <span className="hidden sm:inline mx-1">•</span>
              <span className="hidden sm:inline">Historical Weather Analysis</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <CheckCircle2 size={14} className="text-green-500" /> {observations} daily climate observations
            </div>
          </div>
          
          {/* Condition Box */}
          <div className="bg-white dark:bg-climate-dark border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              {totalRain > 5 ? <CloudRain className="text-blue-500" size={24} /> : <Cloud className="text-blue-400" size={24} />}
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{totalRain > 5 ? 'Rainy' : 'Partly Cloudy'}</p>
              <p className="text-lg font-black text-gray-800 dark:text-gray-100">{avgLow}° – {peakHigh}°C</p>
              <p className="text-xs text-gray-500">{peakHigh}° High</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-white to-red-50/50 dark:from-climate-dark dark:to-red-900/10">
          <div className="flex items-center gap-2 mb-2">
            <ThermometerSun size={16} className="text-red-500" />
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Average High</p>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{avgHigh} <span className="text-lg text-gray-500 font-medium">°C</span></p>
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold bg-red-100 dark:bg-red-900/30 inline-block px-2 py-0.5 rounded-full">
            Peak: {peakHigh}°C
          </p>
        </div>

        {/* Card 2 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-white to-blue-50/50 dark:from-climate-dark dark:to-blue-900/10">
          <div className="flex items-center gap-2 mb-2">
            <ThermometerSnow size={16} className="text-blue-500" />
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Average Low</p>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{avgLow} <span className="text-lg text-gray-500 font-medium">°C</span></p>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-900/30 inline-block px-2 py-0.5 rounded-full">
            Lowest: {lowestLow}°C
          </p>
        </div>

        {/* Card 3 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-white to-cyan-50/50 dark:from-climate-dark dark:to-cyan-900/10">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain size={16} className="text-cyan-500" />
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Rainfall</p>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{totalRain} <span className="text-lg text-gray-500 font-medium">mm</span></p>
          <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold bg-cyan-100 dark:bg-cyan-900/30 inline-block px-2 py-0.5 rounded-full">
            Cumulative
          </p>
        </div>

        {/* Card 4 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-white to-indigo-50/50 dark:from-climate-dark dark:to-indigo-900/10">
          <div className="flex items-center gap-2 mb-2">
            <CloudRain size={16} className="text-indigo-500" />
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Rain Days</p>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{rainDays} <span className="text-lg text-gray-500 font-medium">Days</span></p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-100 dark:bg-indigo-900/30 inline-block px-2 py-0.5 rounded-full">
            {'>'}0.5 mm Rain
          </p>
        </div>

        {/* Card 5 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-white to-teal-50/50 dark:from-climate-dark dark:to-teal-900/10">
          <div className="flex items-center gap-2 mb-2">
            <Wind size={16} className="text-teal-500" />
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Wind Speed</p>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{avgWind} <span className="text-lg text-gray-500 font-medium">km/h</span></p>
          <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold bg-teal-100 dark:bg-teal-900/30 inline-block px-2 py-0.5 rounded-full">
            Max: {maxWind} km/h
          </p>
        </div>

        {/* Card 6 */}
        <div className="glass-panel p-5 rounded-xl border border-gray-200 dark:border-gray-700/60 bg-gradient-to-br from-white to-green-50/50 dark:from-climate-dark dark:to-green-900/10">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-green-500" />
            <p className="text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Observations</p>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white mb-1">{observations} <span className="text-lg text-gray-500 font-medium">Records</span></p>
          <p className="text-xs text-green-600 dark:text-green-400 font-semibold bg-green-100 dark:bg-green-900/30 inline-block px-2 py-0.5 rounded-full">
            100% Complete
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-panel p-4 rounded-lg pt-6">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <Thermometer size={20} className="text-climate-accent" />
            <h3 className="font-medium text-gray-800 dark:text-gray-200">Temperature Time Series</h3>
          </div>
          
          {/* Chart Toggle */}
          <div className="flex bg-gray-200 dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 transition-colors ${chartType === 'line' ? 'bg-climate-accent text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
              title="Line Chart"
            >
              <LineChartIcon size={16} />
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 transition-colors ${chartType === 'area' ? 'bg-climate-accent text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
              title="Area Chart"
            >
              <AreaChartIcon size={16} />
            </button>
          </div>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" vertical={false} opacity={0.3} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickMargin={10} minTickGap={30} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={['auto', 'auto']} tickFormatter={(value) => `${value}°`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900)', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#0ea5e9' }}
                />
                <ReferenceLine y={35} label={{ position: 'top', value: 'High Risk (>35°C)', fill: '#ef4444', fontSize: 12 }} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={0} label={{ position: 'bottom', value: 'Freeze Risk (<0°C)', fill: '#3b82f6', fontSize: 12 }} stroke="#3b82f6" strokeDasharray="3 3" />
                
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 6 }} name="Max Temp" />
                <Line type="monotone" dataKey="minTemp" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 6 }} name="Min Temp" />
              </LineChart>
            ) : (
              <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorMax" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#9ca3af" vertical={false} opacity={0.3} />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickMargin={10} minTickGap={30} />
                <YAxis stroke="#9CA3AF" fontSize={12} domain={['auto', 'auto']} tickFormatter={(value) => `${value}°`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tw-colors-gray-900)', borderColor: '#374151', color: '#f8fafc', borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#0ea5e9' }}
                />
                <ReferenceLine y={35} stroke="#ef4444" strokeDasharray="3 3" />
                <ReferenceLine y={0} stroke="#3b82f6" strokeDasharray="3 3" />
                
                <Area type="monotone" dataKey="temperature" stroke="#ef4444" fillOpacity={1} fill="url(#colorMax)" name="Max Temp" />
                <Area type="monotone" dataKey="minTemp" stroke="#3b82f6" fillOpacity={1} fill="url(#colorMin)" name="Min Temp" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
