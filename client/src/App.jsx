import React, { useState } from 'react';
import AgentRankings from './components/AgentRankings';
import ScrollingEconomicColumn from './components/library/ScrollingEconomicColumn';
import './components/library/RouteTransition.css';

// Mock Data for Sidebars (reused from CostEfficiencyDashboard)
const sidebarData = [
  { model: 'GPT-4o', provider: 'OpenAI', inputCost: 5.00, outputCost: 15.00, efficiencyScore: 92, latency: 245, status: 'excellent' },
  { model: 'Claude 3.5 Sonnet', provider: 'Anthropic', inputCost: 3.00, outputCost: 15.00, efficiencyScore: 95, latency: 180, status: 'excellent' },
  { model: 'Gemini 1.5 Pro', provider: 'Google', inputCost: 3.50, outputCost: 10.50, efficiencyScore: 88, latency: 420, status: 'good' },
  { model: 'Llama 3.1 405B', provider: 'Meta', inputCost: 2.00, outputCost: 2.00, efficiencyScore: 85, latency: 650, status: 'good' },
  { model: 'Llama 3 70B', provider: 'Groq', inputCost: 0.59, outputCost: 0.79, efficiencyScore: 98, latency: 12, status: 'excellent' },
  { model: 'Mistral Large 2', provider: 'Mistral', inputCost: 2.50, outputCost: 7.50, efficiencyScore: 82, latency: 380, status: 'average' },
  { model: 'DeepSeek V3', provider: 'DeepSeek', inputCost: 0.14, outputCost: 0.28, efficiencyScore: 99, latency: 150, status: 'excellent' },
  { model: 'Command R+', provider: 'Cohere', inputCost: 3.00, outputCost: 15.00, efficiencyScore: 84, latency: 310, status: 'good' },
];

function App() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-[#e1e7ef] font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* Three Column Layout with Sidebars */}
      <div className="flex w-full">
        
        {/* Left Sidebar - Scrolling Down */}
        <aside className="hidden xl:block w-[320px] shrink-0 border-r border-white/5 bg-black/20">
          <div className="sticky top-0 p-4 border-b border-white/5 bg-[#0b0e14]/80 backdrop-blur-md z-20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Global Economy</h3>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Live Efficiency Feed ↓</p>
          </div>
          <ScrollingEconomicColumn data={sidebarData} direction="down" speed={45} />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Premium Header */}
          <header className="relative py-16 overflow-hidden border-b border-white/5 bg-gradient-to-b from-blue-500/5 to-transparent">
            {/* Abstract background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-400 text-xs font-bold tracking-widest uppercase mb-6 animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Real-time Benchmarks
              </div>
              
              <h1 className="text-6xl md:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40 drop-shadow-2xl">
                AgentStats<span className="text-blue-500">.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-medium">
                The definitive leaderboard for <span className="text-white">AI Agent performance</span>, tracking speed, cost, and intelligence.
              </p>

              <div className="flex justify-center gap-8 mt-10">
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-white">154+</span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Models</span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-white">1.2M</span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Samples</span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-white">24h</span>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Update</span>
                </div>
              </div>
            </div>
          </header>

          <div className="container mx-auto pb-16">
            <main>
              <AgentRankings />
            </main>

            <footer className="mt-20 py-12 border-t border-white/5 text-center text-gray-600 text-sm px-6">
              <div className="flex justify-center gap-6 mb-4">
                <a href="#" className="hover:text-blue-400 transition-colors uppercase text-[10px] font-black tracking-widest">Documentation</a>
                <a href="#" className="hover:text-blue-400 transition-colors uppercase text-[10px] font-black tracking-widest">API Access</a>
                <a href="#" className="hover:text-blue-400 transition-colors uppercase text-[10px] font-black tracking-widest">Methodology</a>
              </div>
              <p>Data sourced from standardized benchmarks and real-world evaluation pipelines.</p>
              <p className="mt-2 opacity-50 uppercase tracking-tighter font-bold">© 2026 AgentStats Analysis • Technology Ministry Standard</p>
            </footer>
          </div>
        </div>

        {/* Right Sidebar - Scrolling Up */}
        <aside className="hidden xl:block w-[320px] shrink-0 border-l border-white/5 bg-black/20">
          <div className="sticky top-0 p-4 border-b border-white/5 bg-[#0b0e14]/80 backdrop-blur-md z-20 text-right">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-500">Efficiency Matrix</h3>
            <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Market Volatility ↑</p>
          </div>
          <ScrollingEconomicColumn data={sidebarData} direction="up" speed={40} />
        </aside>

      </div>
    </div>
  );
}

export default App;
