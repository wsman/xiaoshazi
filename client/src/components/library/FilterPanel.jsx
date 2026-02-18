// FilterPanel Component
// Advanced filtering panel with multiple filter options
// 样式统一: 使用 nordic-minimal.css 主题变量

import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
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
  // 使用 nordic-minimal.css 主题变量统一颜色
  const colorClasses = {
    blue: 'bg-[var(--nordic-fjord-light)] border-[var(--border-primary)] text-[var(--nordic-fjord)] hover:bg-[var(--nordic-fjord)]/10',
    purple: 'bg-[var(--nordic-aurora-purple)]/10 border-[var(--nordic-aurora-purple)]/30 text-[var(--nordic-aurora-purple)] hover:bg-[var(--nordic-aurora-purple)]/20',
    emerald: 'bg-[var(--nordic-pine-light)] border-[var(--border-primary)] text-[var(--nordic-pine)] hover:bg-[var(--nordic-pine)]/10',
    orange: 'bg-[var(--nordic-aurora-amber)]/10 border-[var(--nordic-aurora-amber)]/30 text-[var(--nordic-aurora-amber)] hover:bg-[var(--nordic-aurora-amber)]/20',
    slate: 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
  };
  
  const activeClasses = {
    blue: 'bg-[var(--nordic-fjord)] border-[var(--nordic-fjord)] text-white',
    purple: 'bg-[var(--nordic-aurora-purple)] border-[var(--nordic-aurora-purple)] text-white',
    emerald: 'bg-[var(--nordic-pine)] border-[var(--nordic-pine)] text-white',
    orange: 'bg-[var(--nordic-aurora-amber)] border-[var(--nordic-aurora-amber)] text-white',
    slate: 'bg-[var(--nordic-charcoal)] border-[var(--nordic-charcoal)] text-white',
  };
  
  return (
    <motion.button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 
        text-xs font-bold rounded-[var(--radius-full)] border transition-all duration-200
        ${active ? activeClasses[color] : colorClasses[color]}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-[var(--bg-tertiary)]'}`}>
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
    <div className="filter-section border-b border-[var(--border-primary)] pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
          {title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-[var(--text-tertiary)]"
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
  const hasActiveFilters = filters && Object.values(filters).some(
    (value) => Array.isArray(value) ? value.length > 0 : value
  );
  
  // 确保filters是一个对象，即使为空
  const safeFilters = filters || {};
  
  // Handle filter toggle
  const handleFilterToggle = (filterKey, optionId) => {
    if (!filters) return;
    
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
    if (!filters) return;
    
    const emptyFilters = {};
    // 安全地获取filters的键
    const filterKeys = Object.keys(filters || {});
    filterKeys.forEach((key) => {
      emptyFilters[key] = [];
    });
    onFilterChange(emptyFilters);
    onSearchChange('');
  };
  
  // Get active filter count
  const getActiveFilterCount = () => {
    if (!filters) return 0;
    
    return Object.values(filters).reduce((acc, val) => {
      return acc + (Array.isArray(val) ? val.length : 0);
    }, 0);
  };
  
  return (
    <div className={`filter-panel bg-[var(--bg-elevated)] rounded-[var(--radius-xl)] border border-[var(--border-primary)] shadow-[var(--shadow-sm)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-[var(--text-primary)]">Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-bold bg-[var(--accent-primary)] text-white rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </div>
        
        {hasActiveFilters && showClearAll && (
          <button
            onClick={handleClearAll}
            className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b border-[var(--border-primary)]">
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

export { FilterBar, FilterChip, FilterPanel, memo };
export default memo(FilterPanel);
