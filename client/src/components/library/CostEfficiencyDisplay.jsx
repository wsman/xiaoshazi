// CostEfficiencyDisplay.jsx
// Original: EntropyPriceDisplay.tsx
// Refactored for Token Cost Efficiency Display

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './CostEfficiencyDisplay.css';

export const CostEfficiencyDisplay = ({
  data,
  showDetailsOnHover = true,
  size = 'medium',
  variant = 'standard',
  onClick,
}) => {
  const { t } = useTranslation();
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
            <span className="cost-sub">{t('efficiency.eff')}</span>
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
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <span className="font-black text-sm tracking-tight leading-tight max-w-[160px] truncate">{data.model}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/5 uppercase tracking-tighter">{t(`efficiency.status.${data.status}`)}</span>
              </div>
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{data.provider}</span>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.03]">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5">{t('efficiency.efficiency')}</span>
                <span className="text-xl font-black tracking-tighter leading-none">{data.efficiencyScore}</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5">{t('efficiency.latency')}</span>
                <span className="text-sm font-bold tracking-tighter leading-none">{data.latency}ms</span>
              </div>
            </div>
            
            {isHovering && showDetailsOnHover && (
              <div className="cost-tooltip">
                <div className="tooltip-row">
                  <span>{t('efficiency.input')}:</span>
                  <span className="font-mono">${data.inputCost.toFixed(2)}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.output')}:</span>
                  <span className="font-mono">${data.outputCost.toFixed(2)}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.latency')}:</span>
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
                  <span>{t('efficiency.provider')}:</span>
                  <span>{data.provider}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.model')}:</span>
                  <span>{data.model}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.status_label')}:</span>
                  <span className="capitalize">{t(`efficiency.status.${data.status}`)}</span>
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
