import React from 'react';
import DPSRankings from './components/DPSRankings';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <div className="container mx-auto py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
            MythicStats
          </h1>
          <p className="text-gray-400">Data-driven Mythic+ DPS Rankings</p>
        </header>

        <main>
          <DPSRankings />
        </main>

        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>Data sourced from Warcraft Logs API</p>
          <p>© 2026 MythicStats Analysis</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
