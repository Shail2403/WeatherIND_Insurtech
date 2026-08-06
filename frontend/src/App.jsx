import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import InputForm from './components/InputForm'
import FileBrowser from './components/FileBrowser'
import DataVisualization from './components/DataVisualization'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  
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

  return (
    <div className="min-h-screen p-8 transition-colors duration-300">
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
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Input Form & File Browser */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Input Form */}
          <div className="bg-white dark:bg-climate-card p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 transition-colors">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Fetch Data</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Enter coordinates and date range to fetch from Open-Meteo and store in S3.
            </p>
            <InputForm 
              onUploadSuccess={(file) => {
                setRefreshTrigger(prev => prev + 1);
                setSelectedFile(file);
              }} 
            />
          </div>

          {/* File Browser */}
          <div className="bg-white dark:bg-climate-card p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 transition-colors">
            <FileBrowser 
              refreshTrigger={refreshTrigger} 
              onSelectFile={(file) => setSelectedFile(file)} 
            />
          </div>

        </div>

        {/* Right Column: Visualization */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-climate-card p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 transition-colors">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">Climate Data Analysis</h2>
            <DataVisualization selectedFile={selectedFile} />
          </div>

        </div>

      </main>
    </div>
  )
}

export default App
