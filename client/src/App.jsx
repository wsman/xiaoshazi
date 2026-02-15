import React, { Suspense, lazy, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import AgentRankings from './components/AgentRankings';
import ScrollingEconomicColumn from './components/library/ScrollingEconomicColumn';
import RouteTransition from './components/library/RouteTransition';
import './components/library/RouteTransition.css';

// Lazy load components for code splitting
const EntropyDashboard = lazy(() => import('./components/EntropyDashboard'));
const TopologyView = lazy(() => import('./components/TopologyView'));
const RollingNumber = lazy(() => import('./components/library/RollingNumber'));

// GPU-accelerated skeleton fallback with transform3d
const GPUAcceleratedSkeleton = () => (
  <div 
    className="flex items-center justify-center h-full" 
    style={{ 
      transform: 'translate3d(0,0,0)',
      backfaceVisibility: 'hidden'
    }}
  >
    <div 
      className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"
      style={{
        transform: 'translate3d(0,0,0)',
        willChange: 'transform'
      }}
    />
  </div>
);

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
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    // 使用 resolvedLanguage 获取当前真正被解析的语言，如果没有则回退到 language 或 'en'
    const currentLang = i18n.resolvedLanguage || i18n.language || 'en';
    const nextLang = currentLang.startsWith('en') ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#f1f4f9] text-slate-900 font-sans selection:bg-blue-200 relative">
      {/* Background Layer - Decoupled from content */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Global background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* Content Layer */}
      <div className="flex w-full h-full relative z-10">
        
        {/* Left Sidebar - Scrolling Down */}
        <aside className="hidden xl:block w-[300px] shrink-0 border-r border-slate-300/50 bg-[#f8fafc]/80 backdrop-blur-sm h-full relative overflow-hidden shadow-[10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
          <div className="sticky top-0 p-3 z-30 sticky-sidebar-header border-b border-slate-200 bg-[#f8fafc]/90 backdrop-blur-md">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600/80">{t('app.global_economy')}</h3>
          </div>
          <div className="h-[calc(100vh-45px)] overflow-hidden">
            <ScrollingEconomicColumn data={sidebarData} direction="down" speed={60} width="280px" />
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 bg-white shadow-[0_0_80px_rgba(0,0,0,0.08)] z-30 flex flex-col h-full overflow-hidden border-x border-slate-200/60">
          {/* Sticky Compact Premium Header */}
          <header className="py-3 shrink-0 border-b border-slate-100 bg-white/95 backdrop-blur-md z-40 shadow-[0_1px_10px_rgba(0,0,0,0.02)]">
            <div className="container mx-auto px-8 relative z-10 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <Link to="/" className="text-2xl font-black tracking-[calc(-0.05em)] text-slate-900 shrink-0 hover:text-blue-600 transition-colors">
                  AgentStats<span className="text-blue-600">.</span>
                </Link>
                
                <nav className="hidden md:flex items-center gap-4 ml-4">
                  <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Rankings</Link>
                  <Link to="/topology" className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">Topology</Link>
                </nav>

                <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 min-w-[100px] justify-center rounded-full bg-blue-50 border border-blue-100/50 text-blue-600 text-[8px] font-black uppercase tracking-widest animate-fade-in">
                  <span className="relative flex h-1 w-1 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1 w-1 bg-blue-600"></span>
                  </span>
                  <span className="truncate">{t('app.system_active')}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-10">
                {/* Language Toggle */}
                <button 
                  onClick={toggleLanguage}
                  className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm active:scale-95 group"
                  title="Toggle Language"
                >
                  <span className="text-[10px] font-black text-slate-600 group-hover:text-blue-600">
                    {t('common.language')}
                  </span>
                </button>

                <div className="grid grid-cols-3 divide-x divide-slate-100 shrink-0">
                  <div className="flex flex-col items-end text-right pr-5 w-32">
                    <span className="text-sm font-black text-slate-900 leading-none tabular-nums">154</span>
                    <span className="text-[7px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1 truncate w-full">{t('app.models')}</span>
                  </div>
                  <div className="flex flex-col items-end text-right px-5 w-32">
                    <span className="text-sm font-black text-slate-900 leading-none tabular-nums">1.2M</span>
                    <span className="text-[7px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1 truncate w-full">{t('app.queries')}</span>
                  </div>
                  <div className="flex flex-col items-end text-right pl-5 w-32">
                    <span className="text-sm font-black text-blue-600 leading-none tracking-tighter tabular-nums truncate w-full">{t('app.realtime')}</span>
                    <span className="text-[7px] uppercase tracking-[0.2em] text-slate-400 font-black mt-1 truncate w-full">{t('app.status')}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable Model Area - GPU Accelerated with Route Transition */}
          <div 
            className="flex-1 overflow-hidden bg-transparent relative"
            style={{
              transform: 'translate3d(0,0,0)',
              willChange: 'contents'
            }}
          >
            <RouteTransition animationType="slide-up" duration={300}>
              <Routes>
                <Route path="/" element={
                  <div className="h-full flex flex-col relative z-10 overflow-y-auto no-scrollbar scroll-smooth">
                    <main className="px-4 py-6">
                      <AgentRankings />
                    </main>

                    <footer className="mt-auto py-4 border-t border-slate-50 text-center text-slate-300 text-[10px] px-6">
                      <div className="flex justify-center gap-8 mb-2">
                        <Link to="/topology" className="hover:text-blue-500 transition-colors uppercase font-black tracking-[0.2em]">Topology</Link>
                        <Link to="/admin/dashboard" className="hover:text-blue-500 transition-colors uppercase font-black tracking-[0.2em]">Dashboard</Link>
                        <a href="#" className="hover:text-blue-500 transition-colors uppercase font-black tracking-[0.2em]">{t('app.protocol')}</a>
                        <a href="#" className="hover:text-blue-500 transition-colors uppercase font-black tracking-[0.2em]">{t('app.endpoint')}</a>
                      </div>
                      <p className="mt-1 opacity-30 uppercase tracking-[0.3em] font-black">{t('app.copyright')}</p>
                    </footer>
                  </div>
                } />

                <Route path="/topology" element={
                  <Suspense fallback={<GPUAcceleratedSkeleton />}>
                    <TopologyView />
                  </Suspense>
                } />
                
                <Route path="/admin/dashboard" element={
                  <Suspense fallback={<GPUAcceleratedSkeleton />}>
                    <div className="h-full overflow-y-auto">
                      <EntropyDashboard />
                    </div>
                  </Suspense>
                } />
              </Routes>
            </RouteTransition>
          </div>
        </div>

        {/* Right Sidebar - Scrolling Up */}
        <aside className="hidden xl:block w-[300px] shrink-0 border-l border-slate-300/50 bg-[#f8fafc]/80 backdrop-blur-sm h-full relative overflow-hidden shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)] z-20">
          <div className="sticky top-0 p-3 z-30 text-right sticky-sidebar-header border-b border-slate-200 bg-[#f8fafc]/90 backdrop-blur-md">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-600/80">{t('app.efficiency_matrix')}</h3>
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
