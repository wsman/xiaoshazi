import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PerfBar from './PerfBar';
import TierBadge from './TierBadge';
import { getProviderColor } from '../utils/providerColors';
import { PageSkeleton } from './library/PageSkeleton';
import RouteTransition from './library/RouteTransition';
import CostEfficiencyDashboard from './library/CostEfficiencyDashboard';
import { RollingNumber } from './library/RollingNumber';
import { MotionButton, MotionButtonGroup } from './library/MotionButton';

const AgentRankings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxPerf, setMaxPerf] = useState(0);
  const [activeScenario, setActiveScenario] = useState('all');
  const [activeTimeframe, setActiveTimeframe] = useState('current');

  const scenarios = [
    { id: 'all', label: 'All Scenarios' },
    { id: 'coding', label: 'Coding' },
    { id: 'reasoning', label: 'Reasoning' },
    { id: 'creative', label: 'Creative' },
  ];

  const timeframes = [
    { id: 'current', label: 'Current' },
    { id: 'last', label: 'Last Month' },
    { id: 'alltime', label: 'All Time' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, we would pass filters to the API
        const response = await axios.get('/api/agents');
        if (response.data.success) {
          setData(response.data.data);
          // Calculate max Perf for bar scaling (Peak value)
          const max = Math.max(...response.data.data.map(item => item.peakPerf));
          setMaxPerf(max);
        }
      } catch (error) {
        console.error('Error fetching Agent data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeScenario, activeTimeframe]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <PageSkeleton type="market" showHeader={false} />
      </div>
    );
  }

  return (
    <RouteTransition animationType="slide-up" duration={300}>
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-white">AI Agent Performance</h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <MotionButtonGroup spacing={1}>
              {scenarios.map(scenario => (
                <MotionButton
                  key={scenario.id}
                  size="sm"
                  variant={activeScenario === scenario.id ? 'primary' : 'secondary'}
                  onClick={() => setActiveScenario(scenario.id)}
                >
                  {scenario.label}
                </MotionButton>
              ))}
            </MotionButtonGroup>
            
            <MotionButtonGroup spacing={1}>
              {timeframes.map(tf => (
                <MotionButton
                  key={tf.id}
                  size="sm"
                  variant={activeTimeframe === tf.id ? 'primary' : 'secondary'}
                  onClick={() => setActiveTimeframe(tf.id)}
                >
                  {tf.label}
                </MotionButton>
              ))}
            </MotionButtonGroup>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Rankings are based on average performance scores across diverse benchmarks.
          "Peak Capability" represents the score on the most complex tasks for each model.
        </p>

        <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-800/50 text-gray-400 text-sm font-medium border-b border-gray-800">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-1 text-center">Diff</div>
            <div className="col-span-1 text-center">Tier</div>
            <div className="col-span-3">Model / Provider</div>
            <div className="col-span-5">Performance (Avg / Peak)</div>
            <div className="col-span-1 text-right">Samples</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-800">
            {data.map((item) => {
              const providerColor = getProviderColor(item.provider);
              return (
                <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-800/30 transition-colors">
                  <div className="col-span-1 text-center font-bold text-gray-300">
                    {item.rank}
                  </div>
                  <div className="col-span-1 text-center">
                    {item.diff > 0 && <span className="text-green-500">↑ {item.diff}</span>}
                    {item.diff < 0 && <span className="text-red-500">↓ {Math.abs(item.diff)}</span>}
                    {item.diff === 0 && <span className="text-gray-600">-</span>}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <TierBadge tier={item.tier} />
                  </div>
                  <div className="col-span-3 flex flex-col">
                    <div className="flex items-center gap-1">
                      {item.rank === 1 && <span className="text-yellow-400 text-lg">★</span>}
                      <span className="font-bold text-white">{item.model}</span>
                    </div>
                    <span className="text-xs text-gray-500" style={{ color: providerColor }}>{item.provider}</span>
                  </div>
                  <div className="col-span-5">
                    <PerfBar
                      avgPerf={item.avgPerf}
                      peakPerf={item.peakPerf}
                      maxPerf={maxPerf}
                      color={providerColor}
                    />
                  </div>
                  <div className="col-span-1 text-right text-gray-400 text-sm font-mono">
                    <RollingNumber value={item.samples} duration={800} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cost Efficiency Dashboard Integration */}
        <div className="mt-8">
          <CostEfficiencyDashboard />
        </div>
      </div>
    </RouteTransition>
  );
};

export default AgentRankings;