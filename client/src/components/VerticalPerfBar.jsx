import React from 'react';
import { RollingNumber } from './library/RollingNumber';

const VerticalPerfBar = ({ avgPerf, peakPerf, maxPerf, color }) => {
  const avgHeight = (avgPerf / maxPerf) * 100;
  const peakHeight = (peakPerf / maxPerf) * 100;

  return (
    <div className="h-full w-3.5 relative bg-slate-100 rounded-full overflow-hidden flex flex-col justify-end shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)]">
      {/* Peak Capability Layer (Background/Faded) - Growing from bottom */}
      <div
        className="absolute bottom-0 w-full opacity-10"
        style={{ height: `${peakHeight}%`, backgroundColor: color }}
      />

      {/* Average Layer (Solid) - Growing from bottom */}
      <div
        className="relative z-10 transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) w-full rounded-t-sm"
        style={{ 
          height: `${avgHeight}%`, 
          backgroundColor: color, 
          boxShadow: `0 -2px 10px ${color}33`,
          backgroundImage: 'linear-gradient(to top, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 100%)'
        }}
      />
      
      {/* Subtle shine effect */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/10 to-white/0 pointer-events-none z-20"></div>
    </div>
  );
};

export default VerticalPerfBar;
