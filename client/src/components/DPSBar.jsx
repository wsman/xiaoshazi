import React from 'react';
import { formatNumber } from '../utils/classColors';

const DPSBar = ({ avgDps, topDps, maxDps, color }) => {
  const avgWidth = (avgDps / maxDps) * 100;
  const topWidth = (topDps / maxDps) * 100;

  return (
    <div className="w-full relative h-6 bg-gray-800 rounded-full overflow-hidden flex items-center">
      {/* Top 5% Layer (Background/Faded) */}
      <div
        className="absolute h-full opacity-30"
        style={{ width: `${topWidth}%`, backgroundColor: color }}
      />

      {/* Average Layer (Solid) */}
      <div
        className="h-full relative z-10 transition-all duration-500"
        style={{ width: `${avgWidth}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />

      {/* Labels */}
      <div className="absolute inset-0 flex items-center justify-between px-3 z-20">
        <span className="text-xs font-bold text-black drop-shadow-md">{formatNumber(avgDps)}</span>
        <span className="text-xs font-medium text-black/70">{formatNumber(topDps)}</span>
      </div>
    </div>
  );
};

export default DPSBar;
