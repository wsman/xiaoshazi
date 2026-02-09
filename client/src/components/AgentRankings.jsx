import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import PerfBar from './PerfBar';
import VerticalPerfBar from './VerticalPerfBar';
import TierBadge from './TierBadge';
import { getProviderColor } from '../utils/providerColors';
import { PageSkeleton } from './library/PageSkeleton';
import RouteTransition from './library/RouteTransition';
import CostEfficiencyDashboard from './library/CostEfficiencyDashboard';
import { RollingNumber } from './library/RollingNumber';
import { MotionButton, MotionButtonGroup } from './library/MotionButton';
import ChartWorkerManager from '../utils/ChartWorkerManager';

const TIER_CONFIG = {
  S: { label: 'S-Tier: State of the Art', borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50', titleColor: 'text-yellow-700' },
  A: { label: 'A-Tier: High Performance', borderColor: 'border-purple-200', bgColor: 'bg-purple-50', titleColor: 'text-purple-700' },
  B: { label: 'B-Tier: Competent', borderColor: 'border-blue-200', bgColor: 'bg-blue-50', titleColor: 'text-blue-700' },
  C: { label: 'C-Tier: Average', borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50', titleColor: 'text-emerald-700' },
  D: { label: 'D-Tier: Basic', borderColor: 'border-slate-200', bgColor: 'bg-slate-50', titleColor: 'text-slate-600' },
};

// Helper Component for Drag-to-Scroll functionality
const DraggableScrollContainer = ({ children }) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  };

  const onMouseLeave = () => setIsDragging(false);
  const onMouseUp = () => setIsDragging(false);

  const onMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    containerRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div 
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
      className="flex gap-4 overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none pb-2 pt-2 px-1"
    >
      {children}
    </div>
  );
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
            const workerResult = await ChartWorkerManager.calculateIndicators(rawData, [], 50, activeScenario);
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
      <div className={`w-full max-w-6xl mx-auto px-2 transition-opacity duration-300 ${processing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="mb-6 flex flex-col items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full">
             <div className="flex flex-col gap-1.5 flex-1">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1">Workload Scenario</span>
               <MotionButtonGroup spacing={2} className="bg-slate-200/50 p-1 rounded-xl border border-slate-200 backdrop-blur-xl shadow-sm">
                {scenarios.map(scenario => (
                  <MotionButton
                    key={scenario.id}
                    size="sm"
                    variant={activeScenario === scenario.id ? 'primary' : 'ghost'}
                    className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-300 ${activeScenario === scenario.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'}`}
                    onClick={() => setActiveScenario(scenario.id)}
                  >
                    {scenario.label}
                  </MotionButton>
                ))}
              </MotionButtonGroup>
             </div>
            
            <div className="flex flex-col gap-1.5">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1">Timeframe</span>
               <MotionButtonGroup spacing={2} className="bg-slate-200/50 p-1 rounded-xl border border-slate-200 backdrop-blur-xl">
                {timeframes.map(tf => (
                  <MotionButton
                    key={tf.id}
                    size="sm"
                    variant={activeTimeframe === tf.id ? 'primary' : 'ghost'}
                    className={`rounded-xl px-5 py-2 text-sm font-bold transition-all duration-300 ${activeTimeframe === tf.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => setActiveTimeframe(tf.id)}
                  >
                    {tf.label}
                  </MotionButton>
                ))}
              </MotionButtonGroup>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          {orderedTiers.map(tier => {
            const tierGroup = groupedData[tier];
            if (!tierGroup || tierGroup.length === 0) return null;

            const config = TIER_CONFIG[tier] || TIER_CONFIG.D;

            return (
              <div key={tier} className={`group/tier rounded-2xl border ${config.borderColor} bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]`}>
                {/* Tier Header */}
                <div className={`px-6 py-2.5 border-b ${config.borderColor} ${config.bgColor} flex justify-between items-center relative overflow-hidden`}>
                  <div className="flex items-center gap-3 relative z-10">
                    <h3 className={`text-base font-black tracking-tight ${config.titleColor}`}>{config.label}</h3>
                  </div>
                  {/* Decorative faint background text */}
                  <div className="absolute right-[-10px] bottom-[-15px] text-5xl font-black opacity-[0.03] italic pointer-events-none select-none uppercase">
                    {tier}
                  </div>
                </div>

                {/* Content Area - Draggable Horizontal Scroll */}
                <div className="bg-white p-4">
                  <DraggableScrollContainer>
                    {tierGroup.map((item) => {
                       const providerColor = getProviderColor(item.provider);
                       return (
                        <div 
                          key={item.id} 
                          className="flex-none w-[190px] flex bg-[#fcfdfe] rounded-xl border border-[#edf2f7] p-3 hover:bg-white hover:border-blue-300/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:scale-[1.05] hover:z-50 transition-all duration-500 ease-out group/card relative overflow-visible cursor-pointer"
                        >
                          {/* Subtle top glow on hover */}
                          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/0 to-transparent group-hover/card:via-blue-500/50 transition-all duration-700"></div>

                          {/* Left: Water Level PerfBar (Compressed) */}
                          <div className="mr-3 h-28 relative shrink-0">
                             <VerticalPerfBar 
                                avgPerf={item.avgPerf}
                                peakPerf={item.peakPerf}
                                maxPerf={maxPerf}
                                color={providerColor}
                             />
                          </div>

                          {/* Right: Info Section */}
                          <div className="flex-1 flex flex-col min-w-0">
                            {/* Rank and Momentum */}
                            <div className="flex justify-between items-center mb-1.5">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-lg font-black text-slate-700 leading-none group-hover/card:text-blue-600 transition-colors">#{item.rank}</span>
                                  <div className="flex items-center">
                                    {item.diff > 0 && <span className="text-emerald-600 text-[8px] font-black bg-emerald-100 px-1 py-0.5 rounded shadow-sm">↑{item.diff}</span>}
                                    {item.diff < 0 && <span className="text-rose-600 text-[8px] font-black bg-rose-100 px-1.5 py-0.5 rounded shadow-sm">↓{Math.abs(item.diff)}</span>}
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-300">
                                   <span className="text-[12px] font-black italic uppercase tracking-tighter opacity-20" style={{ color: config.titleColor.includes('yellow') ? '#d4af37' : config.titleColor.includes('purple') ? '#9333ea' : config.titleColor.includes('blue') ? '#2563eb' : config.titleColor.includes('emerald') ? '#059669' : '#475569' }}>{tier}</span>
                                </div>
                            </div>

                            {/* Model and Provider */}
                            <div className="mb-auto">
                              <span className="font-black text-[11px] text-slate-800 group-hover/card:text-slate-950 group-hover/card:whitespace-normal transition-all duration-300 truncate block leading-tight">{item.model}</span>
                              <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 group-hover/card:opacity-100 transition-opacity block mt-0.5" style={{ color: providerColor }}>
                                {item.provider}
                              </span>
                            </div>

                            {/* Bottom: Score Summary */}
                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                               <div className="flex flex-col">
                                  <span className="text-[6px] uppercase font-black text-slate-300 leading-none mb-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity" style={{ color: config.titleColor.includes('yellow') ? '#d4af37' : config.titleColor.includes('purple') ? '#9333ea' : config.titleColor.includes('blue') ? '#2563eb' : config.titleColor.includes('emerald') ? '#059669' : '#475569' }}>Dataset</span>
                                  <span className="text-[8px] font-bold text-slate-400 font-mono">
                                    <RollingNumber value={item.samples} duration={800} />
                                  </span>
                               </div>
                               <div className="flex flex-col items-end text-right">
                                  <span className="text-[6px] uppercase font-black text-slate-300 leading-none mb-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity" style={{ color: config.titleColor.includes('yellow') ? '#d4af37' : config.titleColor.includes('purple') ? '#9333ea' : config.titleColor.includes('blue') ? '#2563eb' : config.titleColor.includes('emerald') ? '#059669' : '#475569' }}>Score</span>
                                  <span className="text-sm font-black text-slate-700 leading-none group-hover/card:text-blue-600 transition-all">{item.avgPerf.toFixed(0)}%</span>
                               </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </DraggableScrollContainer>
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
