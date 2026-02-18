// CostEfficiencyDisplay.jsx
// Original: EntropyPriceDisplay.tsx
// Refactored for Token Cost Efficiency Display

import { useEffect, useRef, useState } from 'react';
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
  // 防御性编程：确保data有默认值
  const safeData = data && typeof data === 'object' ? data : {
    model: 'Unknown',
    provider: 'Unknown',
    inputCost: 0,
    outputCost: 0,
    efficiencyScore: 0,
    latency: 0,
    status: 'average'
  };
  const prevDataRef = useRef(safeData);
  const [isHovering, setIsHovering] = useState(false);

  // Flash animation on change
  useEffect(() => {
    if (prevDataRef.current.efficiencyScore !== safeData.efficiencyScore) {
      const trend = safeData.efficiencyScore > prevDataRef.current.efficiencyScore 
        ? 'improving' 
        : 'worsening';
      setFlash(trend);
      prevDataRef.current = safeData;
      
      const timer = setTimeout(() => setFlash(null), 300);
      return () => clearTimeout(timer);
    }
  }, [safeData.efficiencyScore]);

  // Color classes based on tier
  const getTierClass = () => {
    switch (safeData.status) {
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
    if (onClick) onClick(safeData);
  };

  const renderContent = () => {
    const baseClasses = [
      'cost-efficiency-display',
      `size-${size}`,
      `variant-${variant}`,
      getTierClass(),
      getFlashClass(),
    ].filter(Boolean).join(' ');

    // 安全地获取成本数据，提供默认值
    const inputCost = typeof safeData.inputCost === 'number' ? safeData.inputCost : 0;
    const outputCost = typeof safeData.outputCost === 'number' ? safeData.outputCost : 0;
    const efficiencyScore = typeof safeData.efficiencyScore === 'number' ? safeData.efficiencyScore : 0;
    const latency = typeof safeData.latency === 'number' ? safeData.latency : 0;
    const model = safeData.model || 'Unknown';
    const provider = safeData.provider || 'Unknown';
    const status = safeData.status || 'average';
    
    const costString = `$${inputCost.toFixed(2)} / $${outputCost.toFixed(2)}`;
    
    switch (variant) {
      case 'minimal':
        return (
          <div 
            className={baseClasses}
            onClick={handleClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <span className="cost-value">{efficiencyScore}</span>
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
                <span className="font-black text-sm tracking-tight leading-tight max-w-[160px] truncate">{model}</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/5 uppercase tracking-tighter">{t(`efficiency.status.${status}`)}</span>
              </div>
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{provider}</span>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-black/[0.03]">
              <div className="flex flex-col">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5">{t('efficiency.efficiency')}</span>
                <span className="text-xl font-black tracking-tighter leading-none">{efficiencyScore}</span>
              </div>
              <div className="flex flex-col items-end text-right">
                <span className="text-[8px] font-black uppercase tracking-widest opacity-30 mb-0.5">{t('efficiency.latency')}</span>
                <span className="text-sm font-bold tracking-tighter leading-none">{latency}ms</span>
              </div>
            </div>
            
            {isHovering && showDetailsOnHover && (
              <div className="cost-tooltip">
                <div className="tooltip-row">
                  <span>{t('efficiency.input')}:</span>
                  <span className="font-mono">${inputCost.toFixed(2)}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.output')}:</span>
                  <span className="font-mono">${outputCost.toFixed(2)}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.latency')}:</span>
                  <span className="font-mono">{latency}ms</span>
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
            <span className="cost-value">{efficiencyScore}</span>
            <span className="cost-sub text-xs ml-2">{costString}</span>
            {isHovering && showDetailsOnHover && (
              <div className="cost-tooltip">
                <div className="tooltip-row">
                  <span>{t('efficiency.provider')}:</span>
                  <span>{provider}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.model')}:</span>
                  <span>{model}</span>
                </div>
                <div className="tooltip-row">
                  <span>{t('efficiency.status_label')}:</span>
                  <span className="capitalize">{t(`efficiency.status.${status}`)}</span>
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
