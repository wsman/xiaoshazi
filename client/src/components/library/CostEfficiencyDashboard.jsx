// CostEfficiencyDashboard.jsx
// Refactored from EntropyDashboard.tsx for Token Cost Efficiency

import React, { useState, useEffect } from 'react';
import CostEfficiencyDisplay from './CostEfficiencyDisplay';
import './CostEfficiencyDashboard.css';

// Mock Data Generation
const generateMockData = () => [
  {
    model: 'GPT-4o',
    provider: 'OpenAI',
    inputCost: 5.00,
    outputCost: 15.00,
    efficiencyScore: 92,
    latency: 245,
    status: 'excellent',
    trend: 'stable'
  },
  {
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputCost: 3.00,
    outputCost: 15.00,
    efficiencyScore: 95,
    latency: 180,
    status: 'excellent',
    trend: 'improving'
  },
  {
    model: 'Gemini 1.5 Pro',
    provider: 'Google',
    inputCost: 3.50,
    outputCost: 10.50,
    efficiencyScore: 88,
    latency: 420,
    status: 'good',
    trend: 'stable'
  },
  {
    model: 'Llama 3.1 405B',
    provider: 'Meta',
    inputCost: 2.00,
    outputCost: 2.00,
    efficiencyScore: 85,
    latency: 650,
    status: 'good',
    trend: 'worsening'
  },
  {
    model: 'Llama 3 70B',
    provider: 'Groq',
    inputCost: 0.59,
    outputCost: 0.79,
    efficiencyScore: 98,
    latency: 12,
    status: 'excellent',
    trend: 'improving'
  },
  {
    model: 'Mistral Large 2',
    provider: 'Mistral',
    inputCost: 2.50,
    outputCost: 7.50,
    efficiencyScore: 82,
    latency: 380,
    status: 'average',
    trend: 'stable'
  }
];

export const CostEfficiencyDashboard = ({
  initialData,
  refreshInterval = 3000
}) => {
  const [data, setData] = useState(initialData || generateMockData());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  // Auto-refresh simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate slight data changes
      setData(prevData => prevData.map(item => ({
        ...item,
        latency: Math.max(1, Math.floor(item.latency + (Math.random() * 20 - 10))),
        efficiencyScore: Math.min(100, Math.max(0, Math.floor(item.efficiencyScore + (Math.random() * 2 - 1))))
      })));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(generateMockData());
      setIsRefreshing(false);
    }, 800);
  };

  const handleModelClick = (item) => {
    setSelectedModel(selectedModel === item.model ? null : item.model);
  };

  // Calculate Market Averages
  const avgInput = data.reduce((acc, curr) => acc + curr.inputCost, 0) / data.length;
  const avgOutput = data.reduce((acc, curr) => acc + curr.outputCost, 0) / data.length;
  const avgLatency = data.reduce((acc, curr) => acc + curr.latency, 0) / data.length;

  return (
    <div className="cost-dashboard bg-transparent p-8">
      <header className="dashboard-header flex justify-between items-end mb-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Live Infrastructure Node</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-white">Token Economic Matrix</h2>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-tighter text-xs">Unit Cost per 1,000,000 Tokens (USD) • TTFT Latency (ms)</p>
        </div>
        <button 
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${isRefreshing ? 'bg-white/5 text-gray-500' : 'bg-white/10 text-white hover:bg-white/20 border border-white/5 hover:border-white/10 shadow-2xl'}`} 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Re-Indexing...' : 'Refresh Market'}
        </button>
      </header>

      <main>
        {/* Horizontal Scroll Container for Matrix Elements */}
        <div className="flex gap-6 mb-12 overflow-x-auto pb-12 pt-4 no-scrollbar">
          {data.map((item) => (
            <div 
              key={item.model}
              className={`flex-none w-[320px] transition-all duration-500 transform ${selectedModel === item.model ? 'ring-2 ring-blue-500/50 scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <CostEfficiencyDisplay 
                data={item}
                variant="detailed"
                size="large"
                onClick={handleModelClick}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 px-1 rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden">
            <div className="flex flex-col p-8 border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Global Avg Input</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-black text-white">${avgInput.toFixed(2)}</span>
                 <span className="text-xs font-bold text-gray-600">/1M</span>
              </div>
            </div>
            
            <div className="flex flex-col p-8 border-r border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Global Avg Output</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-black text-white">${avgOutput.toFixed(2)}</span>
                 <span className="text-xs font-bold text-gray-600">/1M</span>
              </div>
            </div>

            <div className="flex flex-col p-8 bg-gradient-to-br from-white/[0.02] to-transparent">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Network Latency (Avg)</span>
              <div className="flex items-baseline gap-1">
                 <span className="text-3xl font-black text-blue-400">{Math.round(avgLatency)}ms</span>
                 <span className="text-xs font-bold text-gray-600">TTFT</span>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default CostEfficiencyDashboard;
