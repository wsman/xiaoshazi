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
    latency: 18,
    status: 'excellent',
    trend: 'stable'
  },
  {
    model: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    inputCost: 3.00,
    outputCost: 15.00,
    efficiencyScore: 95,
    latency: 15,
    status: 'excellent',
    trend: 'improving'
  },
  {
    model: 'Gemini 1.5 Pro',
    provider: 'Google',
    inputCost: 3.50,
    outputCost: 10.50,
    efficiencyScore: 88,
    latency: 22,
    status: 'good',
    trend: 'stable'
  },
  {
    model: 'Llama 3.1 405B',
    provider: 'Meta',
    inputCost: 2.00,
    outputCost: 2.00,
    efficiencyScore: 85,
    latency: 25,
    status: 'good',
    trend: 'worsening'
  },
  {
    model: 'Llama 3 70B',
    provider: 'Groq',
    inputCost: 0.59,
    outputCost: 0.79,
    efficiencyScore: 98,
    latency: 5,
    status: 'excellent',
    trend: 'improving'
  },
  {
    model: 'Mistral Large 2',
    provider: 'Mistral',
    inputCost: 2.50,
    outputCost: 7.50,
    efficiencyScore: 82,
    latency: 20,
    status: 'average',
    trend: 'stable'
  }
];

export const CostEfficiencyDashboard = ({
  initialData,
  refreshInterval = 5000
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
        latency: Math.max(1, Math.floor(item.latency + (Math.random() * 4 - 2))),
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
    <div className="cost-dashboard">
      <header className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Token Efficiency Market</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time cost & performance tracking</p>
        </div>
        <button 
          className="refresh-button" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Syncing...' : 'Refresh Market'}
        </button>
      </header>

      <main>
        <div className="section-title">Model Efficiency Index</div>
        <div className="model-grid">
          {data.map((item) => (
            <div 
              key={item.model}
              className={`model-card ${selectedModel === item.model ? 'selected' : ''}`}
            >
              <CostEfficiencyDisplay 
                data={item}
                variant="detailed"
                size="medium"
                onClick={handleModelClick}
              />
            </div>
          ))}
        </div>

        <div className="metrics-section">
          <div className="section-title">Market Metrics (Avg)</div>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Input Cost (1M)</span>
              <span className="metric-value">${avgInput.toFixed(2)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Output Cost (1M)</span>
              <span className="metric-value">${avgOutput.toFixed(2)}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Avg Latency</span>
              <span className="metric-value">{avgLatency.toFixed(1)}ms</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CostEfficiencyDashboard;
