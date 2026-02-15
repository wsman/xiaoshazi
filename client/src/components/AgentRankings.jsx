import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import PerfBar from './PerfBar';
import VerticalPerfBar from './VerticalPerfBar';
import TierBadge from './TierBadge';
import AgentCard from './AgentCard';
import { PriceDisplay } from './PriceDisplay';
import { getProviderColor } from '../utils/providerColors';
import { PageSkeleton } from './library/PageSkeleton';
import RouteTransition from './library/RouteTransition';
import CostEfficiencyDashboard from './library/CostEfficiencyDashboard';
import { RollingNumber } from './library/RollingNumber';
import { MotionButton, MotionButtonGroup } from './library/MotionButton';
import ScenarioSelector from './library/ScenarioSelector';
import SearchBar from './library/SearchBar';
import FilterPanel from './library/FilterPanel';
import ChartWorkerManager from '../utils/ChartWorkerManager';
import { usePredictivePrefetch } from '../hooks/usePredictivePrefetch';
import { formatModelName } from '../utils/modelNameFormatter';
import { API_BASE_URL } from '../config';

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
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [maxPerf, setMaxPerf] = useState(0);
  const [activeScenario, setActiveScenario] = useState('all');
  const [activeTimeframe, setActiveTimeframe] = useState('current');
  const [viewMode, setViewMode] = useState('rankings'); // 'rankings' | 'agentcard'
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    provider: [],
    tier: [],
    status: [],
  });

  const TIER_CONFIG = {
    S: { label: t('rankings.tiers.S'), borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50', titleColor: 'text-yellow-700' },
    A: { label: t('rankings.tiers.A'), borderColor: 'border-purple-200', bgColor: 'bg-purple-50', titleColor: 'text-purple-700' },
    B: { label: t('rankings.tiers.B'), borderColor: 'border-blue-200', bgColor: 'bg-blue-50', titleColor: 'text-blue-700' },
    C: { label: t('rankings.tiers.C'), borderColor: 'border-emerald-200', bgColor: 'bg-emerald-50', titleColor: 'text-emerald-700' },
    D: { label: t('rankings.tiers.D'), borderColor: 'border-slate-200', bgColor: 'bg-slate-50', titleColor: 'text-slate-600' },
  };

  const scenarios = [
    { id: 'all', label: t('rankings.scenarios.all') },
    { id: 'coding', label: t('rankings.scenarios.coding') },
    { id: 'reasoning', label: t('rankings.scenarios.reasoning') },
    { id: 'creative', label: t('rankings.scenarios.creative') },
  ];

  const timeframes = [
    { id: 'current', label: t('rankings.timeframes.current') },
    { id: 'last', label: t('rankings.timeframes.last') },
    { id: 'alltime', label: t('rankings.timeframes.alltime') },
  ];

  const { handleMouseEnter, handleMouseLeave, getCachedResult } = usePredictivePrefetch(API_BASE_URL);

  // Initialize Worker Manager
  useEffect(() => {
    ChartWorkerManager.initialize();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setProcessing(true);
      try {
        // Zero-Latency UX: Check if we have pre-calculated data from hover prefetch
        const cachedResult = getCachedResult(activeScenario);
        
        if (cachedResult) {
          setData(cachedResult);
          const max = Math.max(...cachedResult.map(item => item.peakPerf), 1);
          setMaxPerf(max);
          setProcessing(false);
          setLoading(false);
          return; // Instant update from cache
        }

        // Fallback: Normal fetch and process
        const response = await axios.get(`${API_BASE_URL}/api/agents?scenario=${activeScenario}`);
        if (response.data.success) {
          const rawData = response.data.data;
          
          // Offload sorting, weighting and rank update to Web Worker
          let processedData;
          try {
            const workerResult = await ChartWorkerManager.processData(rawData, activeScenario);
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
  }, [activeScenario, activeTimeframe, getCachedResult]);

  // Use the data directly from state (processed by worker)
  let finalData = data;

  // Apply search and filters
  if (searchQuery || activeFilters.provider.length > 0 || activeFilters.tier.length > 0 || activeFilters.status.length > 0) {
    finalData = finalData.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchModel = item.model.toLowerCase().includes(query);
        const matchProvider = item.provider.toLowerCase().includes(query);
        if (!matchModel && !matchProvider) return false;
      }
      
      // Provider filter
      if (activeFilters.provider.length > 0) {
        if (!activeFilters.provider.includes(item.provider.toLowerCase())) return false;
      }
      
      // Tier filter
      if (activeFilters.tier.length > 0) {
        const tier = item.tier || 'D';
        if (!activeFilters.tier.includes(tier)) return false;
      }
      
      // Status filter
      if (activeFilters.status.length > 0) {
        if (!activeFilters.status.includes(item.status)) return false;
      }
      
      return true;
    });
  }

  // Group data by Tier
  const groupedData = finalData.reduce((acc, item) => {
    const tier = item.tier || 'D';
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(item);
    return acc;
  }, {});

  const orderedTiers = ['S', 'A', 'B', 'C', 'D'];

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-2">
        <PageSkeleton type="rankings" showHeader={true} />
      </div>
    );
  }

  return (
    <RouteTransition animationType="slide-up" duration={300}>
      <div className={`w-full max-w-6xl mx-auto px-2 transition-opacity duration-300 relative z-10 ${processing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {/* Control Bar with ScenarioSelector, SearchBar, and Filters */}
        <div className="mb-6 flex flex-col items-center gap-4">
          {/* Top Row: Scenario and Timeframe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
             <div className="flex flex-col gap-1.5 items-center md:items-start">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1 h-4 flex items-center">{t('rankings.workload_scenario')}</span>
               <ScenarioSelector 
                 activeScenario={activeScenario}
                 onScenarioChange={setActiveScenario}
               />
             </div>
            
            <div className="flex flex-col gap-1.5 items-center md:items-end">
               <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mr-1 h-4 flex items-center">{t('rankings.timeframe')}</span>
               <MotionButtonGroup spacing={2} className="bg-slate-200/50 p-1 rounded-xl border border-slate-200 backdrop-blur-xl w-fit">
                {timeframes.map(tf => (
                  <MotionButton
                    key={tf.id}
                    size="sm"
                    variant={activeTimeframe === tf.id ? 'primary' : 'ghost'}
                    className={`rounded-xl w-[90px] py-2 text-sm font-bold transition-all duration-300 ${activeTimeframe === tf.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                    onClick={() => setActiveTimeframe(tf.id)}
                  >
                    {tf.label}
                  </MotionButton>
                ))}
              </MotionButtonGroup>
            </div>
          </div>
          
          {/* View Mode Toggle (AgentCard Integration) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{t('rankings.view') || 'View'}</span>
            <MotionButtonGroup spacing={1} className="bg-slate-200/50 p-1 rounded-lg border border-slate-200">
              <MotionButton
                size="sm"
                variant={viewMode === 'rankings' ? 'primary' : 'ghost'}
                className="rounded-md px-3 py-1 text-xs font-bold"
                onClick={() => setViewMode('rankings')}
              >
                {t('rankings.view_rankings') || 'Rankings'}
              </MotionButton>
              <MotionButton
                size="sm"
                variant={viewMode === 'agentcard' ? 'primary' : 'ghost'}
                className="rounded-md px-3 py-1 text-xs font-bold"
                onClick={() => setViewMode('agentcard')}
              >
                {t('rankings.view_agentcard') || 'Agent Cards'}
              </MotionButton>
            </MotionButtonGroup>
          </div>
          
          {/* Search and Filter Row */}
          <div className="flex items-center justify-between gap-4 w-full max-w-4xl mx-auto">
            <div className="flex-1 max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search models..."
                size="sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <MotionButton
                size="sm"
                variant={showFilters ? 'primary' : 'ghost'}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${showFilters ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span>Filters</span>
                {(activeFilters.provider.length > 0 || activeFilters.tier.length > 0 || activeFilters.status.length > 0) && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">
                    {activeFilters.provider.length + activeFilters.tier.length + activeFilters.status.length}
                  </span>
                )}
              </MotionButton>
            </div>
          </div>
          
          {/* Filter Panel (Collapsible) */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 w-full max-w-md mx-auto"
            >
              <FilterPanel
                filters={activeFilters}
                onFilterChange={setActiveFilters}
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </motion.div>
          )}
        </div>

        {/* Render based on viewMode */}
        {viewMode === 'agentcard' ? (
          // AgentCard View Mode
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
                    <div className="absolute right-[-10px] bottom-[-15px] text-5xl font-black opacity-[0.03] italic pointer-events-none select-none uppercase">
                      {tier}
                    </div>
                  </div>

                  {/* AgentCard Grid */}
                  <div className="bg-white p-4">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-2 px-1">
                      <AnimatePresence mode="popLayout">
                        {tierGroup.map((item) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            key={item.id}
                            className="flex-none"
                          >
                            <AgentCard
                              agent={{
                                id: item.id,
                                name: item.model,
                                role: item.provider,
                                status: item.avgPerf > 80 ? 'thinking' : item.avgPerf > 50 ? 'idle' : 'offline',
                                metadata: {
                                  rank: item.rank,
                                  avgPerf: item.avgPerf,
                                  tier: item.tier
                                }
                              }}
                              isLarge={true}
                              showStatusLabel={true}
                              clickable={true}
                              onClick={(agent) => console.log('Agent clicked:', agent)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Original Rankings View Mode
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
                    <AnimatePresence mode="popLayout">
                      {tierGroup.map((item) => {
                        const providerColor = getProviderColor(item.provider);
                        return (
                          <motion.div 
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ scale: 1.05, zIndex: 50 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                            key={item.id} 
                            className="flex-none w-[190px] flex bg-[#fcfdfe] rounded-xl border border-[#edf2f7] p-3 hover:bg-white hover:border-blue-300/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-colors duration-300 group/card relative overflow-visible cursor-pointer"
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
                              <div className="flex justify-between items-center mb-1.5 h-5">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-black text-slate-700 leading-none group-hover/card:text-blue-600 transition-colors w-8">#{item.rank}</span>
                                    <div className="flex items-center min-w-[30px]">
                                      {item.diff > 0 && <span className="text-emerald-600 text-[8px] font-black bg-emerald-100 px-1 py-0.5 rounded shadow-sm">↑{item.diff}</span>}
                                      {item.diff < 0 && <span className="text-rose-600 text-[8px] font-black bg-rose-100 px-1.5 py-0.5 rounded shadow-sm">↓{Math.abs(item.diff)}</span>}
                                    </div>
                                  </div>
                                  <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 shrink-0">
                                     <span className="text-[12px] font-black italic uppercase tracking-tighter opacity-20" style={{ color: config.titleColor.includes('yellow') ? '#d4af37' : config.titleColor.includes('purple') ? '#9333ea' : config.titleColor.includes('blue') ? '#2563eb' : config.titleColor.includes('emerald') ? '#059669' : '#475569' }}>{tier}</span>
                                  </div>
                              </div>

                              {/* Model and Provider */}
                              <div className="mb-auto min-h-[32px]">
                                <span className="font-black text-[11px] text-slate-800 group-hover/card:text-slate-950 group-hover/card:whitespace-normal transition-all duration-300 truncate block leading-tight">
                                  {formatModelName(item.model)}
                                </span>
                                <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 group-hover/card:opacity-100 transition-opacity block mt-0.5 truncate" style={{ color: providerColor }}>
                                  {item.provider}
                                </span>
                              </div>

                              {/* Bottom: Score Summary */}
                              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                 <div className="flex flex-col w-[50%]">
                                    <div className="h-2 flex items-center">
                                      <span className="text-[6px] uppercase font-black text-slate-300 leading-none opacity-0 group-hover/card:opacity-100 transition-opacity truncate w-full" style={{ color: config.titleColor.includes('yellow') ? '#d4af37' : config.titleColor.includes('purple') ? '#9333ea' : config.titleColor.includes('blue') ? '#2563eb' : config.titleColor.includes('emerald') ? '#059669' : '#475569' }}>{t('rankings.dataset')}</span>
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-400 font-mono mt-0.5">
                                      <RollingNumber value={item.samples} duration={800} />
                                    </span>
                                 </div>
                                 <div className="flex flex-col items-end text-right w-[50%]">
                                    <div className="h-2 flex items-center justify-end">
                                      <span className="text-[6px] uppercase font-black text-slate-300 leading-none opacity-0 group-hover/card:opacity-100 transition-opacity truncate w-full" style={{ color: config.titleColor.includes('yellow') ? '#d4af37' : config.titleColor.includes('purple') ? '#9333ea' : config.titleColor.includes('blue') ? '#2563eb' : config.titleColor.includes('emerald') ? '#059669' : '#475569' }}>{t('rankings.score')}</span>
                                    </div>
                                    <PriceDisplay 
                                      value={item.avgPerf} 
                                      decimals={0}
                                      showChange={false}
                                      showFlash={true}
                                      currency=""
                                    />
                                 </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </DraggableScrollContainer>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </RouteTransition>
  );
};

export default AgentRankings;
