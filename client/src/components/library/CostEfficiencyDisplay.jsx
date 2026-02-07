// CostEfficiencyDisplay.jsx
// Original: EntropyPriceDisplay.tsx
// Refactored for Token Cost Efficiency Display

import React, { useEffect, useRef, useState } from 'react';
import './CostEfficiencyDisplay.css';

export const CostEfficiencyDisplay = ({
  data,
  showDetailsOnHover = true,
  size = 'medium',
  variant = 'standard',
  onClick,
}) => {
  const [flash, setFlash] = useState(null);
  const prevDataRef = useRef(data);
  const [isHovering, setIsHovering] = useState(false);

  // Flash animation on change
  useEffect(() => {
    if (prevDataRef.current.efficiencyScore !== data.efficiencyScore) {
      const trend = data.efficiencyScore > prevDataRef.current.efficiencyScore 
        ? 'improving' 
        : 'worsening';
      setFlash(trend);
      prevDataRef.current = data;
      
      const timer = setTimeout(() => setFlash(null), 300);
      return () => clearTimeout(timer);
    }
  }, [data.efficiencyScore]);

  // Color classes based on tier
  const getTierClass = () => {
    switch (data.status) {
      case 'excellent': return 'efficiency-tier--excellent';
      case 'good': return 'efficiency-tier--good';
      case 'average': return 'efficiency-tier--average';
      case 'poor': return 'efficiency-tier--poor';
      default: return 'efficiency-tier--average';
    }
  };

  const getFlashClass = () => {
    if (!flash) return '';
    return flash === 'improving' ? 'flash-improving' : 'flash-worsening';
  };

  const handleClick = () => {
    if (onClick) onClick(data);
  };

  const renderContent = () => {
    const baseClasses = [
      'cost-efficiency-display',
      `size-${size}`,
      `variant-${variant}`,
      getTierClass(),
      getFlashClass(),
    ].filter(Boolean).join(' ');

    const costString = `$${data.inputCost.toFixed(2)} / $${data.outputCost.toFixed(2)}`;
    
    switch (variant) {
      case 'minimal':
        return (
          <div 
            className={baseClasses}
            onClick={handleClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span className="cost-value">{data.efficiencyScore}</span>
            <span className="cost-sub">Eff.</span>
          </div>
        );

      case 'detailed':
        return (
          <div 
            className={baseClasses}
            onClick={handleClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <div className="cost-header">
              <span className="font-bold">{data.model}</span>
              <span className="opacity-75">{data.provider}</span>
            </div>
            <div className="cost-main">
              <span className="cost-value">{data.efficiencyScore}/100</span>
              <span className="cost-sub">{data.latency}ms/tok</span>
            </div>
            <div className="text-xs opacity-60 mt-1">
              In: ${data.inputCost} | Out: ${data.outputCost}
            </div>
            {isHovering && showDetailsOnHover && (
              <div className="cost-tooltip">
                <div className="tooltip-row">
                  <span>Input (1M):</span>
                  <span className="font-mono">${data.inputCost.toFixed(2)}</span>
                </div>
                <div className="tooltip-row">
                  <span>Output (1M):</span>
                  <span className="font-mono">${data.outputCost.toFixed(2)}</span>
                </div>
                <div className="tooltip-row">
                  <span>Latency:</span>
                  <span className="font-mono">{data.latency}ms</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'standard':
      default:
        return (
          <div 
            className={baseClasses}
            onClick={handleClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span className="cost-value">{data.efficiencyScore}</span>
            <span className="cost-sub text-xs ml-2">{costString}</span>
            {isHovering && showDetailsOnHover && (
              <div className="cost-tooltip">
                <div className="tooltip-row">
                  <span>Provider:</span>
                  <span>{data.provider}</span>
                </div>
                <div className="tooltip-row">
                  <span>Model:</span>
                  <span>{data.model}</span>
                </div>
                <div className="tooltip-row">
                  <span>Status:</span>
                  <span className="capitalize">{data.status}</span>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return renderContent();
};

export default CostEfficiencyDisplay;
