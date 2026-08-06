import { useState, useEffect } from 'react'
import { Sun, Moon, Cloud, ChevronUp, ChevronDown } from 'lucide-react'
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

  // Smooth scroll logic for dynamic navigation
  const [prevSectionName, setPrevSectionName] = useState(null);
  const [nextSectionName, setNextSectionName] = useState(null);

  const sectionNames = {
    'section-fetch': 'Fetch Data',
    'section-storage': 'Storage',
    'section-analysis': 'Analysis'
  };
  const sections = ['section-fetch', 'section-storage', 'section-analysis'];

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const innerHeight = window.innerHeight;
      const scrollHeight = document.documentElement.scrollHeight;

      const atTop = scrollY <= 5;
      const atBottom = Math.ceil(scrollY + innerHeight) >= scrollHeight - 5;

      const yPositionsMap = new Map();
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && !yPositionsMap.has(el.offsetTop)) {
          yPositionsMap.set(el.offsetTop, id);
        }
      });
      const yPositions = Array.from(yPositionsMap.keys()).sort((a, b) => a - b);

      if (atTop) {
        setPrevSectionName(null);
      } else {
        const prevY = [...yPositions].reverse().find(y => y < scrollY - 50);
        setPrevSectionName(prevY !== undefined ? sectionNames[yPositionsMap.get(prevY)] : 'Top');
      }

      if (atBottom) {
        setNextSectionName(null);
      } else {
        const nextY = yPositions.find(y => y > scrollY + 50);
        setNextSectionName(nextY !== undefined ? sectionNames[yPositionsMap.get(nextY)] : 'Bottom');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount and after a short delay to account for rendering
    handleScroll();
    const timeout = setTimeout(handleScroll, 500);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeout);
    };
  }, [refreshTrigger, selectedFile]); // Re-evaluate when content size changes

  const handleScrollUp = () => {
    // Extract unique Y positions to handle side-by-side desktop grid cleanly
    const yPositions = Array.from(new Set(
      sections.map(id => document.getElementById(id)?.offsetTop).filter(y => y != null)
    )).sort((a, b) => a - b);

    const scrollY = window.scrollY;
    // Find the last Y position that is above current scrollY - header buffer
    const prevY = [...yPositions].reverse().find(y => y < scrollY - 50);

    if (prevY !== undefined) {
      window.scrollTo({ top: prevY - 24, behavior: 'smooth' }); // -24 for top margin padding
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollDown = () => {
    const yPositions = Array.from(new Set(
      sections.map(id => document.getElementById(id)?.offsetTop).filter(y => y != null)
    )).sort((a, b) => a - b);

    const scrollY = window.scrollY;
    // Find the first Y position that is below current scrollY + header buffer
    const nextY = yPositions.find(y => y > scrollY + 50);

    if (nextY !== undefined) {
      window.scrollTo({ top: nextY - 24, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen ambient-glow-bg p-8 transition-colors duration-300 relative overflow-hidden">
      
      {/* Floating Scroll Navigation */}
      <div className="fixed inset-y-0 left-2 md:left-6 flex flex-col items-center justify-center z-[100] pointer-events-none">
        <button 
          onClick={handleScrollUp}
          disabled={!prevSectionName}
          className={`pointer-events-auto p-3 rounded-full border-2 transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#facc15] ${
            prevSectionName 
              ? 'bg-gray-900 dark:bg-black border-gray-700 text-yellow-400 shadow-[4px_4px_0px_0px_#facc15] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#fef08a]' 
              : 'bg-gray-800 border-gray-700 text-gray-500 opacity-50 cursor-not-allowed shadow-none'
          }`}
          title="Scroll Up"
        >
          <ChevronUp size={24} className="stroke-[3]" />
        </button>
        {prevSectionName && (
          <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-full shadow-sm backdrop-blur border border-gray-200 dark:border-gray-700 pointer-events-auto transition-all animate-fade-in">
            {prevSectionName}
          </span>
        )}
      </div>

      <div className="fixed inset-y-0 right-2 md:right-6 flex flex-col items-center justify-center z-[100] pointer-events-none">
        {nextSectionName && (
          <span className="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-full shadow-sm backdrop-blur border border-gray-200 dark:border-gray-700 pointer-events-auto transition-all animate-fade-in">
            {nextSectionName}
          </span>
        )}
        <button 
          onClick={handleScrollDown}
          disabled={!nextSectionName}
          className={`pointer-events-auto p-3 rounded-full border-2 transition-all active:translate-y-0 active:shadow-[0px_0px_0px_0px_#facc15] ${
            nextSectionName 
              ? 'bg-gray-900 dark:bg-black border-gray-700 text-yellow-400 shadow-[4px_4px_0px_0px_#facc15] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#fef08a]' 
              : 'bg-gray-800 border-gray-700 text-gray-500 opacity-50 cursor-not-allowed shadow-none'
          }`}
          title="Scroll Down"
        >
          <ChevronDown size={24} className="stroke-[3]" />
        </button>
      </div>
      
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

        {/* Main Dashboard Grid */}
        <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 sm:px-8">
          
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
                onSelectFile={(file) => {
                  setSelectedFile(file);
                  setTimeout(() => {
                    document.getElementById('section-analysis')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 100);
                }} 
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
