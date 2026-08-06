import { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts';
import { Loader2, TrendingUp, Thermometer, AlertTriangle, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';

export default function DataVisualization({ selectedFile }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('line'); // 'line' or 'area'

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

        // Open-Meteo returns data in parallel arrays. We requested daily data (max/min temps).
        if (result.daily?.time && result.daily?.temperature_2m_max) {
          const chartData = result.daily.time.map((timeStr, index) => {
            const date = new Date(timeStr);
            return {
              time: `${date.getDate()}/${date.getMonth()+1}`,
              temperature: result.daily.temperature_2m_max[index],
              minTemp: result.daily.temperature_2m_min[index],
              timestamp: date.getTime()
            };
          });
          
          setData(chartData);
        } else {
          throw new Error("Invalid data format received from S3. Expected daily forecast structure.");
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
      <div className="h-96 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <TrendingUp size={48} className="mb-4 opacity-50" />
        <p>Select a file from the File Browser to visualize data</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-96 border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center text-climate-accent">
        <Loader2 size={48} className="animate-spin mb-4" />
        <p>Fetching and parsing JSON from Supabase S3...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 border-2 border-dashed border-red-900/50 rounded-lg flex flex-col items-center justify-center text-red-400 p-8 text-center">
        <AlertTriangle size={48} className="mb-4" />
        <p>Error loading data visualization:</p>
        <p className="font-mono text-sm mt-2">{error}</p>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // Calculate some simple parametric insurance metrics
  const maxTemp = Math.max(...data.map(d => d.temperature));
  const minTemp = Math.min(...data.map(d => d.minTemp));
  const avgTemp = (data.reduce((sum, d) => sum + ((d.temperature + d.minTemp) / 2), 0) / data.length).toFixed(1);
  const extremeDays = data.filter(d => d.temperature > 35 || d.minTemp < 0).length;

  return (
    <div className="space-y-6">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-climate-dark/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Max Temp</p>
          <p className="text-2xl font-bold text-red-500 dark:text-red-400">{maxTemp}°C</p>
        </div>
        <div className="bg-white dark:bg-climate-dark/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Min Temp</p>
          <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{minTemp}°C</p>
        </div>
        <div className="bg-white dark:bg-climate-dark/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">Avg Temp</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{avgTemp}°C</p>
        </div>
        <div className="bg-white dark:bg-climate-dark/50 border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
            <AlertTriangle size={12} className="text-orange-500 dark:text-orange-400" /> Extreme Days
          </p>
          <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">{extremeDays}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 dark:bg-climate-dark/30 border border-gray-200 dark:border-gray-700 p-4 rounded-lg pt-6">
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
