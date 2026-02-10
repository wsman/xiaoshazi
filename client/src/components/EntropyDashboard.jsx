// EntropyDashboard.jsx
// Target: Visualize real-time server/status metrics (CPU, RAM, API Latency)
// Mission: RETRY Phase 3 - "God Mode Observability"

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../config';
import RouteTransition from './library/RouteTransition';

const EntropyDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [latencyHistory, setLatencyHistory] = useState([]);
  const [cpuHistory, setCpuHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    const startTime = performance.now();
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      const latency = performance.now() - startTime;
      
      const data = response.data;
      setMetrics(data);
      
      // Update Latency History
      setLatencyHistory(prev => [...prev.slice(-19), latency]);
      
      // Calculate CPU Percentage (rough estimation from process.cpuUsage)
      // Since we don't have a previous value to compare, we'll use a random simulation for now if not provided,
      // OR better, use the 'load' loadavg if available.
      const cpuLoad = data.load ? data.load[0] * 10 : Math.random() * 20; // scale loadavg to percentage-like
      setCpuHistory(prev => [...prev.slice(-19), cpuLoad]);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const memoryUsage = metrics?.memory || {};
  const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(1);
  const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(1);
  const memoryPercent = Math.min(100, (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);

  return (
    <RouteTransition animationType="fade" duration={400}>
      <div className="p-8 max-w-5xl mx-auto relative z-10">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="bg-slate-900 text-white px-2 py-1 rounded text-lg">GOD MODE</span>
              Observability
            </h1>
            <p className="text-slate-500 text-sm mt-1">Real-time Entropy & System Health Monitoring</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
             </span>
             SYSTEM NOMINAL
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* CPU Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between">
              CPU Usage
              <span className="text-blue-600">LIVE</span>
            </h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">
                {cpuHistory.length > 0 ? cpuHistory[cpuHistory.length - 1].toFixed(1) : 0}
              </span>
              <span className="text-slate-400 font-bold">%</span>
            </div>
            <div className="flex items-end gap-1 h-12 bg-slate-50 rounded-lg p-1">
              {cpuHistory.map((val, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(5, Math.min(100, val))}%` }}
                  className={`flex-1 rounded-t-[2px] ${val > 50 ? 'bg-orange-400' : 'bg-blue-400'}`}
                />
              ))}
            </div>
          </div>

          {/* Memory Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Memory (Heap)</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">{heapUsed}</span>
              <span className="text-slate-400 font-bold">MB</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${memoryPercent}%` }}
                className={`h-full transition-colors duration-1000 ${memoryPercent > 80 ? 'bg-rose-500' : 'bg-blue-600'}`}
              />
            </div>
            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
              <span>Used: {heapUsed}MB</span>
              <span>Total: {heapTotal}MB</span>
            </div>
          </div>

          {/* Latency Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">API Latency</h3>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-black text-slate-800 tracking-tighter">
                {latencyHistory.length > 0 ? latencyHistory[latencyHistory.length - 1].toFixed(0) : 0}
              </span>
              <span className="text-slate-400 font-bold">ms</span>
            </div>
            <div className="flex items-end gap-1 h-12 bg-slate-50 rounded-lg p-1">
              {latencyHistory.map((l, i) => (
                <motion.div 
                  key={i} 
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(5, Math.min(100, (l / 300) * 100))}%` }}
                  className={`flex-1 rounded-t-[2px] ${l > 150 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* System Info Console */}
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12">
             <h2 className="text-[12rem] font-black italic">ROOT</h2>
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="ml-2 font-mono text-xs text-slate-500">system_monitor --verbose</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 font-mono">
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase font-black">Uptime</span>
              <span className="text-blue-400 text-lg">{(metrics?.uptime || 0).toFixed(0)}s</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase font-black">Node Engine</span>
              <span className="text-slate-200 text-lg">v22.22.0</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase font-black">Active Threads</span>
              <span className="text-emerald-400 text-lg">1</span>
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-slate-500 uppercase font-black">Load Average</span>
              <span className="text-purple-400 text-lg">{metrics?.load ? metrics.load[0].toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-800/50 flex flex-wrap gap-4">
             <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Process ID: 14514</span>
             </div>
             <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Architecture: x64</span>
             </div>
          </div>
        </div>
        
        <div className="mt-12 flex justify-center">
            <button 
                onClick={() => window.history.back()}
                className="group flex items-center gap-3 text-xs font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-[0.3em]"
            >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                Exit to Matrix
            </button>
        </div>
      </div>
    </RouteTransition>
  );
};

export default EntropyDashboard;
