// ScenarioSelector Component
// Select and filter by scenario (coding/reasoning/general/creative)
// 样式统一: 使用 nordic-minimal.css 主题变量

import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { MotionButton, MotionButtonGroup } from './MotionButton';

const scenarioIcons = {
  all: '📊',
  coding: '💻',
  reasoning: '🧠',
  general: '🎯',
  creative: '🎨',
};

// 使用 nordic-minimal.css 主题变量统一颜色
const scenarioConfigs = {
  all: {
    color: 'from-[var(--nordic-stone)] to-[var(--nordic-granite)]',
    bgColor: 'bg-[var(--bg-tertiary)]',
    borderColor: 'border-[var(--border-primary)]',
    hoverColor: 'hover:from-[var(--nordic-granite)] hover:to-[var(--nordic-slate)]',
  },
  coding: {
    color: 'from-[var(--nordic-fjord)] to-[var(--nordic-fjord-hover)]',
    bgColor: 'bg-[var(--nordic-fjord-light)]',
    borderColor: 'border-[var(--nordic-fjord)]',
    hoverColor: 'hover:from-[var(--nordic-fjord-hover)] hover:to-[var(--nordic-fjord)]',
  },
  reasoning: {
    color: 'from-[var(--nordic-aurora-purple)] to-[#7A6CA0]',
    bgColor: 'bg-[var(--nordic-aurora-purple)]/10',
    borderColor: 'border-[var(--nordic-aurora-purple)]/30',
    hoverColor: 'hover:from-[var(--nordic-aurora-purple)] hover:to-[var(--nordic-aurora-purple)]',
  },
  general: {
    color: 'from-[var(--nordic-pine)] to-[var(--nordic-pine-hover)]',
    bgColor: 'bg-[var(--nordic-pine-light)]',
    borderColor: 'border-[var(--nordic-pine)]',
    hoverColor: 'hover:from-[var(--nordic-pine-hover)] hover:to-[var(--nordic-pine)]',
  },
  creative: {
    color: 'from-[var(--nordic-aurora-amber)] to-[var(--nordic-aurora-rose)]',
    bgColor: 'bg-[var(--nordic-aurora-amber)]/10',
    borderColor: 'border-[var(--nordic-aurora-amber)]/30',
    hoverColor: 'hover:from-[var(--nordic-aurora-amber)] hover:to-[var(--nordic-aurora-rose)]',
  },
};

const ScenarioSelector = ({ 
  activeScenario = 'all', 
  onScenarioChange, 
  scenarios = null,
  size = 'sm',
  showLabels = true,
  className = '',
  onMouseEnter,
  onMouseLeave,
}) => {
  const { t } = useTranslation();
  
  // Default scenarios if not provided
  const defaultScenarios = [
    { id: 'all', label: t('rankings.scenarios.all') || 'All' },
    { id: 'coding', label: t('rankings.scenarios.coding') || 'Coding' },
    { id: 'reasoning', label: t('rankings.scenarios.reasoning') || 'Reasoning' },
    { id: 'general', label: t('rankings.scenarios.general') || 'General' },
    { id: 'creative', label: t('rankings.scenarios.creative') || 'Creative' },
  ];
  
  const scenarioList = scenarios || defaultScenarios;
  
  return (
    <div className={`scenario-selector ${className}`}>
      <MotionButtonGroup spacing={2} className="bg-[var(--bg-tertiary)]/80 p-1 rounded-[var(--radius-xl)] border border-[var(--border-primary)]/60 backdrop-blur-xl shadow-[var(--shadow-sm)] w-fit">
        {scenarioList.map((scenario) => {
          const config = scenarioConfigs[scenario.id] || scenarioConfigs.general;
          const isActive = activeScenario === scenario.id;
          
          return (
            <MotionButton
              key={scenario.id}
              size={size}
              variant={isActive ? 'primary' : 'ghost'}
              className={`
                relative rounded-[var(--radius-lg)] px-3 py-1.5 text-xs font-bold transition-all duration-300 overflow-hidden
                ${isActive 
                  ? `bg-gradient-to-r ${config.color} text-white shadow-[var(--shadow-md)]` 
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/60'
                }
              `}
              onClick={() => onScenarioChange && onScenarioChange(scenario.id)}
              onMouseEnter={() => onMouseEnter && onMouseEnter(scenario.id)}
              onMouseLeave={() => onMouseLeave && onMouseLeave(scenario.id)}
              showRipple={false}
            >
              <div className="flex items-center gap-1.5 relative z-10">
                {scenarioIcons[scenario.id] && (
                  <span className="text-[10px]">{scenarioIcons[scenario.id]}</span>
                )}
                {showLabels && (
                  <span className="whitespace-nowrap">{scenario.label}</span>
                )}
              </div>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </MotionButton>
          );
        })}
      </MotionButtonGroup>
    </div>
  );
};

// Export scenarios data for external use
export const SCENARIOS = [
  { id: 'all', label: 'All', icon: '📊', description: 'All models' },
  { id: 'coding', label: 'Coding', icon: '💻', description: 'Code generation & debugging' },
  { id: 'reasoning', label: 'Reasoning', icon: '🧠', description: 'Logical reasoning & analysis' },
  { id: 'general', label: 'General', icon: '🎯', description: 'General purpose tasks' },
  { id: 'creative', label: 'Creative', icon: '🎨', description: 'Creative writing & art' },
];

export default memo(ScenarioSelector);
