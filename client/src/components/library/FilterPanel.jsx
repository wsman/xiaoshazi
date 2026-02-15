// FilterPanel Component
// Advanced filtering panel with multiple filter options

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SearchBar } from './SearchBar';

// Filter Chip Component
const FilterChip = ({ 
  label, 
  active = false, 
  onClick,
  count,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    orange: 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
    slate: 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200',
  };
  
  const activeClasses = {
    blue: 'bg-blue-600 border-blue-600 text-white',
    purple: 'bg-purple-600 border-purple-600 text-white',
    emerald: 'bg-emerald-600 border-emerald-600 text-white',
    orange: 'bg-orange-500 border-orange-500 text-white',
    slate: 'bg-slate-800 border-slate-800 text-white',
  };
  
  return (
    <motion.button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 
        text-xs font-bold rounded-full border transition-all duration-200
        ${active ? activeClasses[color] : colorClasses[color]}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-200'}`}>
          {count}
        </span>
      )}
    </motion.button>
  );
};

// Filter Section Component
const FilterSection = ({ 
  title, 
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="filter-section border-b border-slate-100 pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-slate-400"
        >
          ▼
        </motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main FilterPanel Component
const FilterPanel = ({
  searchValue = '',
  onSearchChange = () => {},
  onSearch = () => {},
  filters = {},
  onFilterChange = () => {},
  availableFilters = {},
  showSearch = true,
  showClearAll = true,
  className = '',
}) => {
  const { t } = useTranslation();
  
  // Default filter options
  const defaultFilters = {
    provider: {
      label: t('filters.provider') || 'Provider',
      options: [
        { id: 'openai', label: 'OpenAI', color: 'blue' },
        { id: 'anthropic', label: 'Anthropic', color: 'purple' },
        { id: 'google', label: 'Google', color: 'emerald' },
        { id: 'meta', label: 'Meta', color: 'orange' },
        { id: 'deepseek', label: 'DeepSeek', color: 'blue' },
        { id: 'cohere', label: 'Cohere', color: 'purple' },
      ],
    },
    tier: {
      label: t('filters.tier') || 'Tier',
      options: [
        { id: 'S', label: 'S Tier', color: 'orange' },
        { id: 'A', label: 'A Tier', color: 'purple' },
        { id: 'B', label: 'B Tier', color: 'blue' },
        { id: 'C', label: 'C Tier', color: 'emerald' },
        { id: 'D', label: 'D Tier', color: 'slate' },
      ],
    },
    status: {
      label: t('filters.status') || 'Status',
      options: [
        { id: 'excellent', label: 'Excellent', color: 'emerald' },
        { id: 'good', label: 'Good', color: 'blue' },
        { id: 'average', label: 'Average', color: 'orange' },
        { id: 'poor', label: 'Poor', color: 'slate' },
      ],
    },
  };
  
  const filterConfig = { ...defaultFilters, ...availableFilters };
  
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(
    (value) => Array.isArray(value) ? value.length > 0 : value
  );
  
  // Handle filter toggle
  const handleFilterToggle = (filterKey, optionId) => {
    const currentValues = filters[filterKey] || [];
    let newValues;
    
    if (currentValues.includes(optionId)) {
      newValues = currentValues.filter((id) => id !== optionId);
    } else {
      newValues = [...currentValues, optionId];
    }
    
    onFilterChange({
      ...filters,
      [filterKey]: newValues,
    });
  };
  
  // Clear all filters
  const handleClearAll = () => {
    const emptyFilters = {};
    Object.keys(filters).forEach((key) => {
      emptyFilters[key] = [];
    });
    onFilterChange(emptyFilters);
    onSearchChange('');
  };
  
  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((acc, val) => {
      return acc + (Array.isArray(val) ? val.length : 0);
    }, 0);
  };
  
  return (
    <div className={`filter-panel bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-700">Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        
        {hasActiveFilters && showClearAll && (
          <button
            onClick={handleClearAll}
            className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b border-slate-100">
          <SearchBar
            value={searchValue}
            onChange={onSearchChange}
            onSearch={onSearch}
            placeholder="Search models..."
            size="sm"
          />
        </div>
      )}
      
      {/* Filter Sections */}
      <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
        {Object.entries(filterConfig).map(([key, config]) => (
          <FilterSection key={key} title={config.label}>
            <div className="flex flex-wrap gap-2">
              {config.options.map((option) => {
                const isActive = (filters[key] || []).includes(option.id);
                return (
                  <FilterChip
                    key={option.id}
                    label={option.label}
                    active={isActive}
                    onClick={() => handleFilterToggle(key, option.id)}
                    color={option.color || 'blue'}
                  />
                );
              })}
            </div>
          </FilterSection>
        ))}
      </div>
    </div>
  );
};

// Compact Filter Bar (horizontal)
const FilterBar = ({
  filters = {},
  onFilterChange = () => {},
  className = '',
}) => {
  const { t } = useTranslation();
  
  const quickFilters = [
    { id: 'all', label: t('filters.all') || 'All' },
    { id: 'coding', label: t('rankings.scenarios.coding') || 'Coding' },
    { id: 'reasoning', label: t('rankings.scenarios.reasoning') || 'Reasoning' },
    { id: 'creative', label: t('rankings.scenarios.creative') || 'Creative' },
  ];
  
  return (
    <div className={`filter-bar flex items-center gap-2 ${className}`}>
      {quickFilters.map((filter) => {
        const isActive = filters.scenario === filter.id;
        return (
          <FilterChip
            key={filter.id}
            label={filter.label}
            active={isActive}
            onClick={() => onFilterChange({ ...filters, scenario: filter.id })}
            color={isActive ? 'blue' : 'slate'}
          />
        );
      })}
    </div>
  );
};

export { FilterPanel, FilterBar, FilterChip };
export default FilterPanel;
