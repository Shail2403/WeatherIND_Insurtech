import { useState, useEffect } from 'react';
import { FileJson, Loader2, Database, Clock, Download } from 'lucide-react';

export default function FileBrowser({ refreshTrigger, onSelectFile }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFile, setActiveFile] = useState(null);

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
        <h3 className="font-medium text-gray-200">Storage Bucket Contents</h3>
      </div>
      
      {files.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">No weather data files found. Fetch some data first!</p>
      ) : (
        <div className="max-h-64 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => handleSelect(file.name)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 flex items-start gap-3
                ${activeFile === file.name 
                  ? 'bg-climate-dark border-climate-accent shadow-[0_0_10px_rgba(14,165,233,0.2)]' 
                  : 'bg-climate-dark/50 border-gray-700 hover:border-gray-500 hover:bg-climate-dark'
                }`}
            >
              <FileJson size={20} className={activeFile === file.name ? "text-climate-accent mt-0.5" : "text-gray-500 mt-0.5"} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${activeFile === file.name ? 'text-white' : 'text-gray-300'}`}>
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
