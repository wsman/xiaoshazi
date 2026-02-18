import axios from 'axios';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { List } from 'react-window';
import { API_BASE_URL } from '../config';
import { usePredictivePrefetch } from '../hooks/usePredictivePrefetch';
import { useUserBehaviorPredictor } from '../hooks/useUserBehaviorPredictor';
import { useWorker } from '../hooks/useWorker';
import { formatModelName } from '../utils/modelNameFormatter';
import { getProviderColor } from '../utils/providerColors';
import AgentCard from './AgentCard';
import FilterPanel from './library/FilterPanel';
import { MotionButton, MotionButtonGroup } from './library/MotionButton';
import { PageSkeleton } from './library/PageSkeleton';
import { RollingNumber } from './library/RollingNumber';
import RouteTransition from './library/RouteTransition';
import ScenarioSelector from './library/ScenarioSelector';
import SearchBar from './library/SearchBar';
import { PriceDisplay } from './PriceDisplay';
import VerticalPerfBar from './VerticalPerfBar';

// Memoized Card Component for virtual list
const RankingCard = React.memo(({ item, maxPerf, providerColor, config, tier, t, formatModelName }) => {
  // 防御性编程：如果item为null或undefined，渲染占位符
  if (!item || typeof item !== 'object') {
    return (
      <div className="flex-none w-[190px] flex bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] border border-[var(--border-primary)] p-3 animate-pulse">
        <div className="mr-3 h-28 w-3.5 bg-[var(--bg-tertiary)] rounded-full"></div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-5 mb-1.5 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
          <div className="flex-1 bg-[var(--bg-tertiary)] rounded mb-3"></div>
          <div className="pt-2 flex justify-between">
            <div className="w-1/2 h-4 bg-[var(--bg-tertiary)] rounded"></div>
            <div className="w-1/2 h-4 bg-[var(--bg-tertiary)] rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // 安全地获取item属性，提供默认值
  const safeAvgPerf = typeof item.avgPerf === 'number' ? item.avgPerf : 0;
  const safePeakPerf = typeof item.peakPerf === 'number' ? item.peakPerf : 0;
  const safeRank = item.rank || 0;
  const safeDiff = typeof item.diff === 'number' ? item.diff : 0;
  const safeModel = item.model || 'Unknown Model';
  const safeProvider = item.provider || 'Unknown Provider';
  const safeSamples = item.samples || 0;

  return (
    <div className="flex-none w-[190px] flex bg-[var(--bg-secondary)] rounded-[var(--radius-lg)] border border-[var(--border-primary)] p-3 hover:bg-[var(--bg-elevated)] hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-lg)] transition-colors duration-300 group/card relative overflow-visible cursor-pointer">
      {/* Subtle top glow on hover */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-primary)]/0 to-transparent group-hover/card:via-[var(--accent-primary)]/50 transition-all duration-700"></div>

      {/* Left: Water Level PerfBar (Compressed) */}
      <div className="mr-3 h-28 relative shrink-0">
         <VerticalPerfBar 
            avgPerf={safeAvgPerf}
            peakPerf={safePeakPerf}
            maxPerf={maxPerf}
            color={providerColor}
         />
      </div>

      {/* Right: Info Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Rank and Momentum */}
        <div className="flex justify-between items-center mb-1.5 h-5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-[var(--text-primary)] leading-none group-hover/card:text-[var(--accent-primary)] transition-colors w-8">#{safeRank}</span>
              <div className="flex items-center min-w-[30px]">
                {safeDiff > 0 && <span className="text-[var(--status-success)] text-[8px] font-black bg-[var(--status-success)]/10 px-1 py-0.5 rounded shadow-sm">↑{safeDiff}</span>}
                {safeDiff < 0 && <span className="text-[var(--status-error)] text-[8px] font-black bg-[var(--status-error)]/10 px-1.5 py-0.5 rounded shadow-sm">↓{Math.abs(safeDiff)}</span>}
              </div>
            </div>
            <div className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 shrink-0">
               <span className="text-[12px] font-black italic uppercase tracking-tighter opacity-20" style={{ color: config.titleColor.includes('var') ? 'var(--nordic-aurora-amber)' : config.titleColor }}>{tier}</span>
            </div>
        </div>

        {/* Model and Provider */}
        <div className="mb-auto min-h-[32px]">
          <span className="font-black text-[11px] text-[var(--text-primary)] group-hover/card:text-[var(--text-primary)] group-hover/card:whitespace-normal transition-all duration-300 truncate block leading-tight">
            {formatModelName(safeModel)}
          </span>
          <span className="text-[8px] font-black uppercase tracking-tighter opacity-60 group-hover/card:opacity-100 transition-opacity block mt-0.5 truncate" style={{ color: providerColor }}>
            {safeProvider}
          </span>
        </div>

        {/* Bottom: Score Summary */}
        <div className="mt-3 pt-2 border-t border-[var(--border-primary)] flex items-center justify-between">
           <div className="flex flex-col w-[50%]">
              <div className="h-2 flex items-center">
                <span className="text-[6px] uppercase font-black text-[var(--text-tertiary)] leading-none opacity-0 group-hover/card:opacity-100 transition-opacity truncate w-full" style={{ color: config.titleColor.includes('var') ? 'var(--nordic-aurora-amber)' : config.titleColor }}>{t('rankings.dataset')}</span>
              </div>
              <span className="text-[8px] font-bold text-[var(--text-tertiary)] font-mono mt-0.5">
                <RollingNumber value={safeSamples} duration={800} />
              </span>
           </div>
           <div className="flex flex-col items-end text-right w-[50%]">
              <div className="h-2 flex items-center justify-end">
                <span className="text-[6px] uppercase font-black text-[var(--text-tertiary)] leading-none opacity-0 group-hover/card:opacity-100 transition-opacity truncate w-full" style={{ color: config.titleColor.includes('var') ? 'var(--nordic-aurora-amber)' : config.titleColor }}>{t('rankings.score')}</span>
              </div>
              <PriceDisplay 
                value={safeAvgPerf} 
                decimals={0}
                showChange={false}
                showFlash={true}
                currency=""
              />
           </div>
        </div>
      </div>
    </div>
  );
});

RankingCard.displayName = 'RankingCard';

// Memoized AgentCard wrapper
const AgentCardWrapper = React.memo(({ item }) => {
  // 防御性编程：如果 item 为 null 或 undefined，渲染一个占位符
  if (!item) {
    return (
      <div className="w-48 p-4 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-[var(--radius-lg)] flex flex-col items-center justify-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] animate-pulse"></div>
        <div className="w-full h-4 bg-[var(--bg-tertiary)] rounded animate-pulse"></div>
        <div className="w-2/3 h-3 bg-[var(--bg-tertiary)] rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <AgentCard
      agent={{
        id: item.id || '',
        name: item.model || 'Unknown Model',
        role: item.provider || 'Unknown Provider',
        status: item.avgPerf > 80 ? 'thinking' : item.avgPerf > 50 ? 'idle' : 'offline',
        metadata: {
          rank: item.rank || 0,
          avgPerf: item.avgPerf || 0,
          tier: item.tier || 'D'
        }
      }}
      isLarge={true}
      showStatusLabel={true}
      clickable={true}
      onClick={(agent) => console.log('Agent clicked:', agent)}
    />
  );
});

AgentCardWrapper.displayName = 'AgentCardWrapper';

// Virtualized Row for react-window - defined as regular function
const VirtualizedRow = ({ index, items, maxPerf, t, formatModelName }) => {
  // 防御性编程：确保 items 是有效的数组
  if (!Array.isArray(items) || items.length === 0) {
    return <div className="px-1 w-[190px] h-[180px] flex items-center justify-center text-gray-400 text-xs">
      <span>Loading...</span>
    </div>;
  }
  
  // 确保索引在有效范围内
  const item = index >= 0 && index < items.length ? items[index] : null;
  
  // 防御性编程：如果 item 为 null 或 undefined，渲染空项
  if (!item || typeof item !== 'object') {
    return <div className="px-1 w-[190px] h-[180px] flex items-center justify-center text-gray-400 text-xs">
      <span>Loading...</span>
    </div>;
  }
  
  const providerColor = getProviderColor(item.provider || 'Unknown');
  
  // Get tier config
  const tier = item.tier || 'D';
  const TIER_CONFIG = {
    S: { titleColor: 'text-[var(--nordic-aurora-amber)]' },
    A: { titleColor: 'text-[var(--nordic-aurora-purple)]' },
    B: { titleColor: 'text-[var(--nordic-fjord)]' },
    C: { titleColor: 'text-[var(--nordic-pine)]' },
    D: { titleColor: 'text-[var(--nordic-stone)]' },
  };
  const config = TIER_CONFIG[tier] || TIER_CONFIG.D;

  return (
    <RankingCard 
      item={item}
      maxPerf={maxPerf}
      providerColor={providerColor}
      config={config}
      tier={tier}
      t={t}
      formatModelName={formatModelName}
    />
  );
};

// Helper Component for Drag-to-Scroll functionality
const DraggableScrollContainer = ({ children, virtualized, items, maxPerf, t, formatModelName }) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = useCallback((e) => {
    setIsDragging(true);
    setStartX(e.pageX - containerRef.current.offsetLeft);
    setScrollLeft(containerRef.current.scrollLeft);
  }, []);

  const onMouseLeave = useCallback(() => setIsDragging(false), []);
  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onMouseMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    containerRef.current.scrollLeft = scrollLeft - walk;
  }, [isDragging, startX, scrollLeft]);

  // Use virtual list if enabled and items exist
  if (virtualized && items && Array.isArray(items) && items.length > 0) {
    const itemWidth = 198; // Card width + gap
    const containerWidth = containerRef.current?.clientWidth || 800;
    const safeContainerWidth = containerWidth > 0 ? containerWidth : 800;

    // 防御性编程：确保items是有效的数组
    const safeItems = Array.isArray(items) ? items : [];
    const safeT = t || (() => '');
    const safeFormatModelName = formatModelName || ((name) => name || '');

    // 确保有有效的itemCount
    const itemCount = safeItems.length > 0 ? safeItems.length : 1;

    return (
      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseLeave={onMouseLeave}
        onMouseUp={onMouseUp}
        onMouseMove={onMouseMove}
        className="flex gap-4 overflow-x-hidden no-scrollbar cursor-grab active:cursor-grabbing select-none pb-2 pt-2 px-1"
        style={{ width: '100%', overflowX: 'auto' }}
      >
        <List
          height={180}
          width={safeContainerWidth}
          itemCount={itemCount}
          itemSize={198}
          overscanCount={3}
        >
          {({ index, style }) => {
            // 防御性编程：确保索引在有效范围内
            const item = index < safeItems.length ? safeItems[index] : null;
            return (
              <div style={style} className="px-1">
                <VirtualizedRow 
                  index={index}
                  items={safeItems}
                  maxPerf={maxPerf}
                  t={safeT}
                  formatModelName={safeFormatModelName}
                />
              </div>
            );
          }}
        </List>
      </div>
    );
  }

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
  const [viewMode, setViewMode] = useState('rankings');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    provider: [],
    tier: [],
    status: [],
  });

  // useCallback for handlers to prevent unnecessary re-renders
  const handleScenarioChange = useCallback((scenario) => {
    setActiveScenario(scenario);
  }, []);

  const handleTimeframeChange = useCallback((timeframe) => {
    setActiveTimeframe(timeframe);
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  const TIER_CONFIG = {
    S: { 
      label: t('rankings.tiers.S'), 
      borderColor: 'border-[var(--nordic-aurora-amber)]', 
      bgColor: 'bg-[var(--nordic-aurora-amber)]/10', 
      titleColor: 'text-[var(--nordic-aurora-amber)]' 
    },
    A: { 
      label: t('rankings.tiers.A'), 
      borderColor: 'border-[var(--nordic-aurora-purple)]', 
      bgColor: 'bg-[var(--nordic-aurora-purple)]/10', 
      titleColor: 'text-[var(--nordic-aurora-purple)]' 
    },
    B: { 
      label: t('rankings.tiers.B'), 
      borderColor: 'border-[var(--nordic-fjord)]', 
      bgColor: 'bg-[var(--nordic-fjord)]/10', 
      titleColor: 'text-[var(--nordic-fjord)]' 
    },
    C: { 
      label: t('rankings.tiers.C'), 
      borderColor: 'border-[var(--nordic-pine)]', 
      bgColor: 'bg-[var(--nordic-pine)]/10', 
      titleColor: 'text-[var(--nordic-pine)]' 
    },
    D: { 
      label: t('rankings.tiers.D'), 
      borderColor: 'border-[var(--nordic-stone)]', 
      bgColor: 'bg-[var(--nordic-stone)]/10', 
      titleColor: 'text-[var(--nordic-stone)]' 
    },
  };

  const timeframes = [
    { id: 'current', label: t('rankings.timeframes.current') },
    { id: 'last', label: t('rankings.timeframes.last') },
    { id: 'alltime', label: t('rankings.timeframes.alltime') },
  ];

  const { handleMouseEnter, handleMouseLeave, getCachedResult } = usePredictivePrefetch(API_BASE_URL);
  
  // 使用 UserBehaviorPredictor 进行 hover intent 预加载
  const { 
    handleMouseEnter: predictHoverEnter, 
    handleMouseLeave: predictHoverLeave,
    getCachedResult: getPredictedResult,
  } = useUserBehaviorPredictor({
    baseUrl: API_BASE_URL,
    hoverDelay: 80,
    onPrefetchStart: (scenario) => console.log(`[HoverIntent] Starting prefetch for: ${scenario}`),
    onPrefetchComplete: (scenario) => console.log(`[HoverIntent] Prefetch complete for: ${scenario}`),
  });

  // Use worker hook for scoring and sorting
  const { isReady: workerReady, isProcessing: workerProcessing, processData: processWithWorker } = useWorker({
    scenario: activeScenario,
    autoInitialize: true
  });

  // Memoized filtered data - only recalculate when dependencies change
  const finalData = useMemo(() => {
    // Ensure data is always an array
    if (!Array.isArray(data)) return [];
    
    let filtered = data;

    // Apply search and filters
    if (searchQuery || activeFilters.provider.length > 0 || activeFilters.tier.length > 0 || activeFilters.status.length > 0) {
      filtered = filtered.filter(item => {
        // Defensive check for item existence
        if (!item || typeof item !== 'object') return false;
        
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchModel = item.model?.toLowerCase().includes(query) || false;
          const matchProvider = item.provider?.toLowerCase().includes(query) || false;
          if (!matchModel && !matchProvider) return false;
        }
        
        // Provider filter
        if (activeFilters.provider.length > 0) {
          const provider = item.provider || '';
          if (!provider || !activeFilters.provider.includes(provider.toLowerCase())) return false;
        }
        
        // Tier filter
        if (activeFilters.tier.length > 0) {
          const tier = item.tier || 'D';
          if (!activeFilters.tier.includes(tier)) return false;
        }
        
        // Status filter
        if (activeFilters.status.length > 0) {
          const status = item.status || '';
          if (!status || !activeFilters.status.includes(status)) return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [data, searchQuery, activeFilters.provider, activeFilters.tier, activeFilters.status]);

  // Memoized grouped data
  const groupedData = useMemo(() => {
    // Ensure finalData is always an array
    if (!Array.isArray(finalData)) return {};
    
    return finalData.reduce((acc, item) => {
      if (!item) return acc; // Skip null items
      const tier = item.tier || 'D';
      if (!acc[tier]) acc[tier] = [];
      acc[tier].push(item);
      return acc;
    }, {});
  }, [finalData]);
  
  // 确保groupedData总是对象
  const safeGroupedData = groupedData || {};

  useEffect(() => {
    const fetchData = async () => {
      setProcessing(true);
      try {
        // Zero-Latency UX: Check if we have pre-calculated data from hover prefetch
        const cachedResult = getCachedResult(activeScenario);
        
        if (cachedResult && Array.isArray(cachedResult) && cachedResult.length > 0) {
          setData(cachedResult);
          const max = Math.max(...cachedResult.map(item => item.peakPerf), 1);
          setMaxPerf(max);
          setProcessing(false);
          setLoading(false);
          return; // Instant update from cache
        }

        // Fallback: Normal fetch and process
        const response = await axios.get(`${API_BASE_URL}/api/agents?scenario=${activeScenario}`);
        if (response && response.data && response.data.success) {
          const rawData = response.data.data || [];
          
          // Offload sorting, weighting and rank update to Web Worker via hook
          const processedData = await processWithWorker(rawData);

          setData(processedData || []);
          const max = processedData && processedData.length > 0 ? 
            Math.max(...processedData.map(item => item.peakPerf), 1) : 1;
          setMaxPerf(max);
        } else {
          // Ensure data is always an array even if API returns failure
          setData([]);
        }
      } catch (error) {
        console.error('Error fetching Agent data:', error);
        // Ensure data is always an array on error
        setData([]);
      } finally {
        setLoading(false);
        setProcessing(false);
      }
    };

    fetchData();
  }, [activeScenario, activeTimeframe, getCachedResult, processWithWorker]);

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
               <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold ml-1 h-4 flex items-center">{t('rankings.workload_scenario')}</span>
               <ScenarioSelector 
                 activeScenario={activeScenario}
                 onScenarioChange={handleScenarioChange}
                 onMouseEnter={predictHoverEnter}
                 onMouseLeave={predictHoverLeave}
               />
             </div>
            
            <div className="flex flex-col gap-1.5 items-center md:items-end">
               <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold mr-1 h-4 flex items-center">{t('rankings.timeframe')}</span>
               <MotionButtonGroup spacing={2} className="bg-[var(--bg-tertiary)] p-1 rounded-[var(--radius-xl)] border border-[var(--border-primary)]  w-fit">
                {timeframes.map(tf => (
                  <MotionButton
                    key={tf.id}
                    size="sm"
                    variant={activeTimeframe === tf.id ? 'primary' : 'ghost'}
                    className={`rounded-[var(--radius-lg)] w-[90px] py-2 text-sm font-bold transition-all duration-300 ${activeTimeframe === tf.id ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => handleTimeframeChange(tf.id)}
                  >
                    {tf.label}
                  </MotionButton>
                ))}
              </MotionButtonGroup>
            </div>
          </div>
          
          {/* View Mode Toggle (AgentCard Integration) */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">{t('rankings.view') || 'View'}</span>
            <MotionButtonGroup spacing={1} className="bg-[var(--bg-tertiary)] p-1 rounded-[var(--radius-lg)] border border-[var(--border-primary)]">
              <MotionButton
                size="sm"
                variant={viewMode === 'rankings' ? 'primary' : 'ghost'}
                className="rounded-[var(--radius-md)] px-3 py-1 text-xs font-bold"
                onClick={() => handleViewModeChange('rankings')}
              >
                {t('rankings.view_rankings') || 'Rankings'}
              </MotionButton>
              <MotionButton
                size="sm"
                variant={viewMode === 'agentcard' ? 'primary' : 'ghost'}
                className="rounded-[var(--radius-md)] px-3 py-1 text-xs font-bold"
                onClick={() => handleViewModeChange('agentcard')}
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
                onChange={handleSearchChange}
                placeholder="Search models..."
                size="sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <MotionButton
                size="sm"
                variant={showFilters ? 'primary' : 'ghost'}
                className={`rounded-[var(--radius-lg)] px-3 py-1.5 text-xs font-bold ${showFilters ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                onClick={handleToggleFilters}
              >
                <span>Filters</span>
                {(activeFilters.provider.length > 0 || activeFilters.tier.length > 0 || activeFilters.status.length > 0) && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-[var(--accent-primary)]/20 rounded-full">
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
                onFilterChange={handleFilterChange}
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
              />
            </motion.div>
          )}
        </div>

        {/* Render based on viewMode */}
        {viewMode === 'agentcard' ? (
          // AgentCard View Mode
          <div className="flex flex-col gap-4 mb-8">
            {orderedTiers.map(tier => {
              const tierGroup = safeGroupedData[tier];
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

                  {/* AgentCard Grid - with CSS transition instead of AnimatePresence */}
                  <div className="bg-white p-4">
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-2 px-1">
                      {tierGroup.map((item) => (
                        <div
                          key={item.id}
                          className="flex-none transition-opacity duration-300 opacity-100"
                        >
                          <AgentCardWrapper item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // Original Rankings View Mode - with virtual scrolling
          <div className="flex flex-col gap-4 mb-8">
          {orderedTiers.map(tier => {
            const tierGroup = safeGroupedData[tier];
            if (!tierGroup || tierGroup.length === 0) return null;

            const config = TIER_CONFIG[tier] || TIER_CONFIG.D;

            return (
              <div key={tier} className={`group/tier rounded-[var(--radius-xl)] border ${config.borderColor} bg-[var(--bg-elevated)] overflow-hidden shadow-[var(--shadow-sm)] transition-all duration-700 hover:shadow-[var(--shadow-lg)]`}>
                {/* Tier Header */}
                <div className={`px-6 py-2.5 border-b ${config.borderColor} ${config.bgColor} flex justify-between items-center relative overflow-hidden`}>
                  <div className="flex items-center gap-3 relative z-10">
                    <h3 className={`text-base font-black tracking-tight ${config.titleColor}`}>{config.label}</h3>
                  </div>
                  <div className="absolute right-[-10px] bottom-[-15px] text-5xl font-black opacity-[0.03] italic pointer-events-none select-none uppercase">
                    {tier}
                  </div>
                </div>

                {/* Content Area - Virtualized Horizontal Scroll */}
                <div className="bg-[var(--bg-elevated)] p-4">
                  <DraggableScrollContainer 
                    virtualized={true} 
                    items={tierGroup}
                    maxPerf={maxPerf}
                    t={t}
                    formatModelName={formatModelName}
                  />
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
