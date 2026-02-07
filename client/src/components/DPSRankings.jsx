import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DPSBar from './DPSBar';
import TierBadge from './TierBadge';
import { getClassColor } from '../utils/classColors';

const DPSRankings = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maxDps, setMaxDps] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/dps');
        if (response.data.success) {
          setData(response.data.data);
          // Calculate max DPS for bar scaling (Top 5% value)
          const max = Math.max(...response.data.data.map(item => item.topDps));
          setMaxDps(max);
        }
      } catch (error) {
        console.error('Error fetching DPS data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-white">Mythic+ DPS Rankings</h2>
        <div className="flex gap-2">
           <select className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none">
             <option value="all">All Dungeons</option>
             <option value="necrotic">Necrotic Wake</option>
             <option value="mists">Mists of Tirna Scithe</option>
           </select>
           <select className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none">
             <option value="current">Current Season</option>
             <option value="last">Last Season</option>
             <option value="alltime">All Time</option>
           </select>
        </div>
      </div>

      <p className="text-gray-400 text-sm mb-4">
        Rankings are based on average DPS performance across all Mythic+ keystone levels.
        "Top 5%" represents the performance of the top-performing runs for each specialization.
      </p>

      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-800/50 text-gray-400 text-sm font-medium border-b border-gray-800">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-1 text-center">Diff</div>
          <div className="col-span-1 text-center">Tier</div>
          <div className="col-span-3">Spec / Class</div>
          <div className="col-span-5">DPS (Avg / Top 5%)</div>
          <div className="col-span-1 text-right">Runs</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-800">
          {data.map((item) => {
            const classColor = getClassColor(item.class);
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
                    <span className="font-bold text-white">{item.spec}</span>
                  </div>
                  <span className="text-xs text-gray-500" style={{ color: classColor }}>{item.class}</span>
                </div>
                <div className="col-span-5">
                  <DPSBar
                    avgDps={item.avgDps}
                    topDps={item.topDps}
                    maxDps={maxDps}
                    color={classColor}
                  />
                </div>
                <div className="col-span-1 text-right text-gray-400 text-sm">
                  {item.runs.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DPSRankings;
