import { useState, useEffect } from 'react';
import { FileJson, Loader2, Database, Clock, Download, Search } from 'lucide-react';

export default function FileBrowser({ refreshTrigger, onSelectFile, onRequestFetch }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all', '3days', '7days'
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchedCoordinates, setSearchedCoordinates] = useState(null); // {lat, lon, name}

  // Forward Geocode Search Query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedCoordinates(null);
      return;
    }

    setIsSearchingLocation(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          setSearchedCoordinates({
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
            name: data[0].display_name
          });
        } else {
          setSearchedCoordinates({ lat: 999, lon: 999, name: 'Unknown' }); // Force no match
        }
      } catch (err) {
        console.error("Search Geocoding error:", err);
      } finally {
        setIsSearchingLocation(false);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter Logic
  useEffect(() => {
    let activeFiles = [...files];

    // Date Filter
    if (dateFilter !== 'all') {
      const cutoff = new Date();
      if (dateFilter === '20mins') cutoff.setMinutes(cutoff.getMinutes() - 20);
      if (dateFilter === '1hour') cutoff.setHours(cutoff.getHours() - 1);
      if (dateFilter === '3hours') cutoff.setHours(cutoff.getHours() - 3);
      if (dateFilter === '24hours') cutoff.setHours(cutoff.getHours() - 24);
      if (dateFilter === '3days') cutoff.setDate(cutoff.getDate() - 3);
      if (dateFilter === '7days') cutoff.setDate(cutoff.getDate() - 7);
      
      activeFiles = activeFiles.filter(file => new Date(file.created_at) >= cutoff);
    }

    // Location/Keyword Filter
    if (searchQuery.trim().length > 0) {
      activeFiles = activeFiles.filter(file => {
        // 1. Direct Keyword Match in Filename
        if (file.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
        
        // 2. Geocoded Coordinate Match
        if (searchedCoordinates && searchedCoordinates.lat !== 999) {
          const parts = file.name.split('_');
          if (parts.length >= 3) {
            const fileLat = parseFloat(parts[1]);
            const fileLon = parseFloat(parts[2]);
            return Math.abs(fileLat - searchedCoordinates.lat) < 0.05 && 
                   Math.abs(fileLon - searchedCoordinates.lon) < 0.05;
          }
        }
        return false;
      });
    }

    setFilteredFiles(activeFiles);
  }, [files, dateFilter, searchQuery, searchedCoordinates]);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('http://127.0.0.1:8000/list-weather-files');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to fetch files');
        }
        
        // Sort files so the newest is at the top
        const sortedFiles = (data.files || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        
        setFiles(sortedFiles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [refreshTrigger]); // Re-run whenever refreshTrigger changes (e.g., after upload)

  const handleSelect = (fileName) => {
    setActiveFile(fileName);
    onSelectFile(fileName);
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <Loader2 className="animate-spin mb-2" size={24} />
        <p>Loading files from Supabase S3...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-lg text-sm">
        Error loading files: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Database size={20} className="text-climate-accent" />
        <h3 className="font-medium text-gray-800 dark:text-gray-200">Storage Bucket Contents</h3>
      </div>
      
      {/* Filters and Search */}
      <div className="flex flex-col xl:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search location (e.g. London)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-gray-200 focus:border-climate-accent focus:outline-none transition-colors shadow-sm"
          />
          {isSearchingLocation && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-climate-accent" />}
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', '20mins', '1hour', '3hours', '24hours', '3days', '7days'].map(f => (
            <button 
              key={f}
              onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shadow-sm ${dateFilter === f ? 'bg-climate-accent text-white border-climate-accent' : 'bg-white dark:bg-climate-dark border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:text-climate-accent dark:hover:text-climate-accent'}`}
            >
              {f === 'all' ? 'All Time' : 
               f === '20mins' ? 'Last 20m' :
               f === '1hour' ? 'Last Hour' : 
               f === '3hours' ? 'Last 3h' : 
               f === '24hours' ? 'Last 24h' : 
               f === '3days' ? 'Last 3d' : 'Last 7d'}
            </button>
          ))}
        </div>
      </div>
      
      {filteredFiles.length === 0 ? (
        searchQuery && !isSearchingLocation ? (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30 p-4 rounded-lg text-center animate-fade-in shadow-inner">
            <h4 className="text-orange-600 dark:text-orange-400 font-bold mb-2">Location Not Found in S3</h4>
            <p className="text-sm text-orange-800 dark:text-gray-400 mb-4">
              "{searchQuery}" is not in your object storage history. Do you want to fetch it now?
            </p>
            <button 
              onClick={() => {
                if (searchedCoordinates && searchedCoordinates.lat !== 999) {
                  onRequestFetch(searchedCoordinates.lat, searchedCoordinates.lon, searchedCoordinates.name);
                } else {
                  alert("Could not determine exact coordinates for this location.");
                }
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 px-6 rounded-lg transition-colors shadow-md"
            >
              Yes, Fetch It!
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No weather data files found matching filters.</p>
        )
      ) : (
        <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {filteredFiles.map((file) => (
            <button
              key={file.name}
              onClick={() => handleSelect(file.name)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-start gap-3
                ${activeFile === file.name 
                  ? 'bg-blue-50 border-blue-400 shadow-md dark:bg-climate-dark dark:border-climate-accent dark:shadow-[0_0_10px_rgba(14,165,233,0.2)]' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 dark:bg-climate-dark/50 dark:border-gray-700 dark:hover:border-gray-500 dark:hover:bg-climate-dark'
                }`}
            >
              <FileJson size={20} className={activeFile === file.name ? "text-blue-600 dark:text-climate-accent mt-0.5" : "text-gray-400 dark:text-gray-500 mt-0.5"} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${activeFile === file.name ? 'text-blue-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {file.name}
                </p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(file.created_at).toLocaleString()}
                  </span>
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                </div>
              </div>
              <a 
                href={`http://127.0.0.1:8000/weather-file-content/${file.name}`}
                download={`${file.name}`}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 hover:bg-climate-dark rounded-md text-gray-500 hover:text-climate-accent transition-colors"
                title="Download JSON"
              >
                <Download size={16} />
              </a>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
