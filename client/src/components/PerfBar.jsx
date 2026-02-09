import React from 'react';
import { RollingNumber } from './library/RollingNumber';

const PerfBar = ({ avgPerf, peakPerf, maxPerf, color }) => {
  const avgWidth = (avgPerf / maxPerf) * 100;
  const peakWidth = (peakPerf / maxPerf) * 100;

  return (
    <div className="w-full relative h-6 bg-slate-200 rounded-full overflow-hidden flex items-center">
      {/* Peak Capability Layer (Background/Faded) */}
      <div
        className="absolute h-full opacity-30"
        style={{ width: `${peakWidth}%`, backgroundColor: color }}
      />

      {/* Average Layer (Solid) */}
      <div
        className="h-full relative z-10 transition-all duration-500"
        style={{ width: `${avgWidth}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      />

      {/* Labels */}
      <div className="absolute inset-0 flex items-center justify-between px-3 z-20">
        <span className="text-xs font-bold text-black drop-shadow-md">
            <RollingNumber value={avgPerf} duration={500} decimals={1} suffix="%" />
        </span>
        <span className="text-xs font-medium text-black/70">
            <RollingNumber value={peakPerf} duration={500} decimals={1} suffix="%" />
        </span>
      </div>
    </div>
  );
};

export default PerfBar;
