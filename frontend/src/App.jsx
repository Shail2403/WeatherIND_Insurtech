import { useState, useEffect } from 'react'
import { Sun, Moon, Cloud } from 'lucide-react'
import InputForm from './components/InputForm'
import FileBrowser from './components/FileBrowser'
import DataVisualization from './components/DataVisualization'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [externalLocationTarget, setExternalLocationTarget] = useState(null);
  
  // Sync Map Location when a file is selected
  useEffect(() => {
    if (selectedFile) {
      const parts = selectedFile.split('_');
      if (parts.length >= 3) {
        const lat = parseFloat(parts[1]);
        const lon = parseFloat(parts[2]);
        if (!isNaN(lat) && !isNaN(lon)) {
          setExternalLocationTarget({ lat, lon });
        }
      }
    }
  }, [selectedFile]);
  
  // Theme state: defaults to true (dark mode)
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Smooth scroll for mobile navigation
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen ambient-glow-bg p-8 transition-colors duration-300 relative overflow-hidden">
      
      {/* Decorative Weather Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-20 dark:opacity-[0.03]">
        <div className="absolute top-10 left-[10%] animate-sun text-yellow-500">
          <Sun size={120} />
        </div>
        <div className="absolute top-24 -left-32 animate-drift-slow text-gray-400">
          <Cloud size={80} />
        </div>
        <div className="absolute top-48 -left-32 animate-drift-fast text-gray-300" style={{ animationDelay: '12s' }}>
          <Cloud size={60} />
        </div>
        <div className="absolute bottom-32 -left-32 animate-drift-slow text-gray-400" style={{ animationDelay: '25s' }}>
          <Cloud size={100} />
        </div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <header className="max-w-6xl mx-auto mb-8 border-b border-gray-300 dark:border-climate-card pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-climate-accent">
            InRisk Climate Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Historical weather data analysis and parametric insurance metrics.
          </p>
        </div>
        
        {/* Theme Toggle Button */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-climate-card text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        </header>

        {/* Mobile Navigation Pills */}
        <div className="lg:hidden flex flex-wrap justify-center gap-2 mb-8 animate-fade-in z-50 relative">
          <button onClick={() => scrollToSection('section-fetch')} className="px-4 py-2 bg-white/90 dark:bg-climate-card/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm hover:text-climate-accent transition-colors">
            📍 Fetch Data
          </button>
          <button onClick={() => scrollToSection('section-storage')} className="px-4 py-2 bg-white/90 dark:bg-climate-card/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm hover:text-climate-accent transition-colors">
            🗄️ Storage
          </button>
          <button onClick={() => scrollToSection('section-analysis')} className="px-4 py-2 bg-white/90 dark:bg-climate-card/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm hover:text-climate-accent transition-colors">
            📊 Analysis
          </button>
        </div>

        {/* Main Dashboard Grid */}
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input Form */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Input Form */}
            <div id="section-fetch" className="glass-panel p-6 rounded-xl scroll-mt-24">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Fetch Data</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter coordinates and date range to fetch from Open-Meteo and store in S3.
            </p>
            <InputForm 
              externalLocationTarget={externalLocationTarget}
              onUploadSuccess={(file) => {
                setRefreshTrigger(prev => prev + 1);
                setSelectedFile(file);
                setExternalLocationTarget(null); // Reset after successful upload
              }} 
            />
          </div>
        </div>

          {/* Right Column: Visualization & File Browser */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* File Browser moved to top of right column */}
            <div id="section-storage" className="glass-panel p-6 rounded-xl scroll-mt-24">
              <FileBrowser 
                refreshTrigger={refreshTrigger} 
                onSelectFile={(file) => setSelectedFile(file)} 
                onRequestFetch={(lat, lon, name) => setExternalLocationTarget({ lat, lon, name })}
              />
            </div>
            
            <div id="section-analysis" className="glass-panel p-6 rounded-xl scroll-mt-24">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Climate Data Analysis</h2>
            <DataVisualization selectedFile={selectedFile} />
          </div>

        </div>

        </main>
      </div>
    </div>
  )
}

export default App
