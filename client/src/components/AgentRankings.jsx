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
import ChartWorkerManager from '../utils/ChartWorkerManager';

const TIER_CONFIG = {
  S: { label: 'S-Tier: State of the Art', borderColor: 'border-yellow-500/50', bgColor: 'bg-yellow-900/10', titleColor: 'text-yellow-400' },
  A: { label: 'A-Tier: High Performance', borderColor: 'border-purple-500/50', bgColor: 'bg-purple-900/10', titleColor: 'text-purple-400' },
  B: { label: 'B-Tier: Competent', borderColor: 'border-blue-500/50', bgColor: 'bg-blue-900/10', titleColor: 'text-blue-400' },
  C: { label: 'C-Tier: Average', borderColor: 'border-green-500/50', bgColor: 'bg-green-900/10', titleColor: 'text-green-400' },
  D: { label: 'D-Tier: Basic', borderColor: 'border-gray-500/50', bgColor: 'bg-gray-800/30', titleColor: 'text-gray-400' },
};

const AgentRankings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
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

  // Initialize Worker Manager
  useEffect(() => {
    ChartWorkerManager.initialize();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setProcessing(true);
      try {
        const response = await axios.get(`/api/agents?scenario=${activeScenario}`);
        if (response.data.success) {
          const rawData = response.data.data;
          
          // Offload sorting and rank update to Web Worker
          let processedData;
          try {
            const workerResult = await ChartWorkerManager.calculateIndicators(rawData, [], 0);
            processedData = workerResult;
          } catch (workerError) {
            console.warn('Worker failed, falling back to main thread:', workerError);
            processedData = rawData.sort((a, b) => b.avgPerf - a.avgPerf).map((item, index) => ({
              ...item,
              rank: index + 1
            }));
          }

          setData(processedData);
          const max = Math.max(...processedData.map(item => item.peakPerf), 1);
          setMaxPerf(max);
        }
      } catch (error) {
        console.error('Error fetching Agent data:', error);
      } finally {
        setLoading(false);
        setProcessing(false);
      }
    };

    fetchData();
  }, [activeScenario, activeTimeframe]);

  // Group data by Tier
  const groupedData = data.reduce((acc, item) => {
    const tier = item.tier || 'D';
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(item);
    return acc;
  }, {});

  const orderedTiers = ['S', 'A', 'B', 'C', 'D'];

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4">
        <PageSkeleton type="market" showHeader={false} />
      </div>
    );
  }

  return (
    <RouteTransition animationType="slide-up" duration={300}>
      <div className={`w-full max-w-5xl mx-auto p-4 transition-opacity duration-300 ${processing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full">
             <div className="flex flex-col gap-2 flex-1">
               <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Workload Scenario</span>
               <MotionButtonGroup spacing={2} className="bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
                {scenarios.map(scenario => (
                  <MotionButton
                    key={scenario.id}
                    size="sm"
                    variant={activeScenario === scenario.id ? 'primary' : 'ghost'}
                    className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 ${activeScenario === scenario.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    onClick={() => setActiveScenario(scenario.id)}
                  >
                    {scenario.label}
                  </MotionButton>
                ))}
              </MotionButtonGroup>
             </div>
            
            <div className="flex flex-col gap-2">
               <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Timeframe</span>
               <MotionButtonGroup spacing={2} className="bg-white/5 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                {timeframes.map(tf => (
                  <MotionButton
                    key={tf.id}
                    size="sm"
                    variant={activeTimeframe === tf.id ? 'primary' : 'ghost'}
                    className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 ${activeTimeframe === tf.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    onClick={() => setActiveTimeframe(tf.id)}
                  >
                    {tf.label}
                  </MotionButton>
                ))}
              </MotionButtonGroup>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 mb-16">
          {orderedTiers.map(tier => {
            const tierGroup = groupedData[tier];
            if (!tierGroup || tierGroup.length === 0) return null;

            const config = TIER_CONFIG[tier] || TIER_CONFIG.D;

            return (
              <div key={tier} className={`group/tier rounded-3xl border ${config.borderColor} bg-white/[0.02] overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-500 hover:bg-white/[0.04] hover:scale-[1.01]`}>
                {/* Tier Header */}
                <div className={`px-8 py-5 border-b border-white/5 ${config.bgColor} flex justify-between items-center relative overflow-hidden`}>
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-current to-transparent opacity-50" style={{ color: config.titleColor.replace('text-', '') }}></div>
                  <div className="flex items-center gap-4">
                    <h3 className={`text-2xl font-black tracking-tight ${config.titleColor}`}>{config.label}</h3>
                    <span className="px-3 py-1 rounded-full bg-black/40 text-[10px] font-black uppercase tracking-tighter text-gray-400 border border-white/5">
                      {tierGroup.length} Models
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="bg-transparent p-6">
                  {/* Grid Container for Agents in the same Tier - Horizontal Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tierGroup.map((item) => {
                       const providerColor = getProviderColor(item.provider);
                       return (
                        <div 
                          key={item.id} 
                          className="flex flex-col bg-white/[0.03] rounded-2xl border border-white/5 p-5 hover:bg-white/[0.06] transition-all duration-300 group/card relative overflow-hidden"
                        >
                          {/* Rank/Tier Indicator & Trend */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                               <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-black/40 border border-white/5">
                                 <span className="text-sm font-black text-white">{tier}</span>
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500">Global Rank</span>
                                 <span className="text-xs font-black text-gray-300">#{item.rank}</span>
                               </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-[10px] font-black uppercase tracking-tighter text-gray-500 mb-1">Momentum</span>
                              {item.diff > 0 && <span className="text-emerald-400 text-[10px] font-black bg-emerald-400/10 px-1.5 py-0.5 rounded">↑ {item.diff}</span>}
                              {item.diff < 0 && <span className="text-rose-500 text-[10px] font-black bg-rose-500/10 px-1.5 py-0.5 rounded">↓ {Math.abs(item.diff)}</span>}
                              {item.diff === 0 && <span className="text-gray-700 font-black text-[10px]">-</span>}
                            </div>
                          </div>

                          {/* Model and Provider */}
                          <div className="mb-6">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-base text-gray-100 group-hover/card:text-white transition-colors truncate">{item.model}</span>
                              {item.rank <= 3 && <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                               <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover/card:opacity-100 transition-opacity" style={{ color: providerColor }}>
                                {item.provider}
                               </span>
                               <span className="text-[10px] font-bold text-gray-600 font-mono">
                                 <RollingNumber value={item.samples} duration={800} /> samples
                               </span>
                            </div>
                          </div>

                          {/* Performance Visualization */}
                          <div className="mt-auto">
                            <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-gray-500 mb-2">
                               <span>Efficiency Matrix</span>
                               <span className="text-gray-400">{item.avgPerf}%</span>
                            </div>
                            <PerfBar
                              avgPerf={item.avgPerf}
                              peakPerf={item.peakPerf}
                              maxPerf={maxPerf}
                              color={providerColor}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </RouteTransition>
  );
};

export default AgentRankings;