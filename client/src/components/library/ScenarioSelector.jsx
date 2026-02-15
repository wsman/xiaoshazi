// ScenarioSelector Component
// Select and filter by scenario (coding/reasoning/general/creative)

import React from 'react';
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

const scenarioConfigs = {
  all: {
    color: 'from-slate-500 to-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    hoverColor: 'hover:from-slate-400 hover:to-slate-500',
  },
  coding: {
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverColor: 'hover:from-blue-400 hover:to-blue-500',
  },
  reasoning: {
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    hoverColor: 'hover:from-purple-400 hover:to-purple-500',
  },
  general: {
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hoverColor: 'hover:from-emerald-400 hover:to-emerald-500',
  },
  creative: {
    color: 'from-orange-500 to-pink-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    hoverColor: 'hover:from-orange-400 hover:to-pink-400',
  },
};

const ScenarioSelector = ({ 
  activeScenario = 'all', 
  onScenarioChange, 
  scenarios = null,
  size = 'sm',
  showLabels = true,
  className = '',
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
      <MotionButtonGroup spacing={2} className="bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 backdrop-blur-xl shadow-sm w-fit">
        {scenarioList.map((scenario) => {
          const config = scenarioConfigs[scenario.id] || scenarioConfigs.general;
          const isActive = activeScenario === scenario.id;
          
          return (
            <MotionButton
              key={scenario.id}
              size={size}
              variant={isActive ? 'primary' : 'ghost'}
              className={`
                relative rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 overflow-hidden
                ${isActive 
                  ? `bg-gradient-to-r ${config.color} text-white shadow-md` 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                }
              `}
              onClick={() => onScenarioChange && onScenarioChange(scenario.id)}
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

export default ScenarioSelector;
