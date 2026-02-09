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
    <div className="h-screen w-screen overflow-hidden bg-[#f1f4f9] text-slate-900 font-sans selection:bg-blue-200">
      {/* Three Column Layout with Sidebars */}
      <div className="flex w-full h-full">
        
        {/* Left Sidebar - Scrolling Down */}
        <aside className="hidden xl:block w-[300px] shrink-0 border-r border-slate-300/50 bg-[#f8fafc] h-full relative overflow-hidden shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
          <div className="sticky top-0 p-3 z-30 sticky-sidebar-header border-b border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600/80">Global Economy</h3>
          </div>
          <div className="h-[calc(100vh-45px)] overflow-hidden">
            <ScrollingEconomicColumn data={sidebarData} direction="down" speed={60} width="280px" />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 bg-white shadow-[0_0_80px_rgba(0,0,0,0.08)] z-30 flex flex-col h-full overflow-hidden border-x border-slate-200/60">
          {/* Sticky Compact Premium Header */}
          <header className="py-3 shrink-0 border-b border-slate-100 bg-white/95 backdrop-blur-md z-40 shadow-[0_1px_10px_rgba(0,0,0,0.02)]">
            {/* Abstract background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none overflow-hidden opacity-40">
              <div className="absolute top-[-100%] left-[-10%] w-[40%] h-[300%] bg-blue-500/10 blur-[120px] rounded-full"></div>
              <div className="absolute top-[-100%] right-[-10%] w-[40%] h-[300%] bg-purple-500/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="container mx-auto px-8 relative z-10 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <h1 className="text-2xl font-black tracking-[calc(-0.05em)] text-slate-900">
                  AgentStats<span className="text-blue-600">.</span>
                </h1>
                
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 text-[8px] font-black uppercase tracking-widest animate-fade-in">
                  <span className="relative flex h-1 w-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-600"></span>
                  </span>
                  System Active
                </div>
              </div>
              
              <div className="flex items-center gap-10">
                <div className="flex flex-col items-end text-right">
                  <span className="text-sm font-black text-slate-900 leading-none tabular-nums">154</span>
                  <span className="text-[7px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1">Models</span>
                </div>
                <div className="w-[1px] h-5 bg-slate-100"></div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-sm font-black text-slate-900 leading-none tabular-nums">1.2M</span>
                  <span className="text-[7px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1">Queries</span>
                </div>
                <div className="w-[1px] h-5 bg-slate-100"></div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-sm font-black text-blue-600 leading-none tracking-tighter tabular-nums">Realtime</span>
                  <span className="text-[7px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1">Status</span>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Model Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth bg-[#fcfdfe]">
            <div className="container mx-auto py-6 pb-6">
              <main className="px-4">
                <AgentRankings />
              </main>

              <footer className="mt-6 py-4 border-t border-slate-50 text-center text-slate-300 text-[10px] px-6">
                <div className="flex justify-center gap-8 mb-2">
                  <a href="#" className="hover:text-blue-500 transition-colors uppercase font-black tracking-[0.2em]">Protocol</a>
                  <a href="#" className="hover:text-blue-500 transition-colors uppercase font-black tracking-[0.2em]">Endpoint</a>
                  <a href="#" className="hover:text-blue-500 transition-colors uppercase font-black tracking-[0.2em]">Matrix</a>
                </div>
                <p className="mt-1 opacity-30 uppercase tracking-[0.3em] font-black">© 2026 AgentStats • Tech Standard</p>
              </footer>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Scrolling Up */}
        <aside className="hidden xl:block w-[300px] shrink-0 border-l border-slate-300/50 bg-[#f8fafc] h-full relative overflow-hidden shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
          <div className="sticky top-0 p-3 z-30 text-right sticky-sidebar-header border-b border-slate-200">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-600/80">Efficiency Matrix</h3>
          </div>
          <div className="h-[calc(100vh-45px)] overflow-hidden">
            <ScrollingEconomicColumn data={sidebarData} direction="up" speed={55} width="280px" />
          </div>
        </aside>

      </div>
    </div>
  );
}

export default App;
