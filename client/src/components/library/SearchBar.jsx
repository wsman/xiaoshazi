// SearchBar Component
// Search input with optional suggestions dropdown

import React, { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple SVG Icons (inline)
const SearchIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
);

const CloseIcon = ({ size = 16, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="currentColor"
    className={className}
  >
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

// SearchBar Component
const SearchBar = ({
  value = '',
  onChange = () => {},
  placeholder = 'Search...',
  size = 'md',
  disabled = false,
  autoFocus = false,
  onSearch,
  showClear = true,
  className = '',
}) => {
  const sizeConfig = {
    sm: { height: 'h-8', fontSize: 'text-xs', iconSize: 14, padding: 'px-3' },
    md: { height: 'h-10', fontSize: 'text-sm', iconSize: 16, padding: 'px-4' },
    lg: { height: 'h-12', fontSize: 'text-base', iconSize: 18, padding: 'px-5' },
  };
  
  const config = sizeConfig[size] || sizeConfig.md;
  
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);
  
  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value);
    }
  }, [value, onSearch]);
  
  const handleSubmit = useCallback(() => {
    if (onSearch) {
      onSearch(value);
    }
  }, [value, onSearch]);
  
  return (
    <div className={`search-bar flex items-center gap-1 ${className}`}>
      <div className={`flex-1 relative`}>
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <SearchIcon size={config.iconSize} />
        </div>
        
        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`
            w-full ${config.height} ${config.padding} pl-10 pr-10
            bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-[var(--radius-md)]
            text-[var(--text-primary)] ${config.fontSize} font-medium
            placeholder:text-[var(--text-tertiary)] placeholder:font-normal
            focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 focus:border-[var(--accent-primary)]
            disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed
            transition-all duration-200
          `}
        />
        
        {/* Clear Button */}
        {showClear && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <CloseIcon size={config.iconSize} />
          </button>
        )}
      </div>
      
      {/* Search Button */}
      {onSearch && (
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || !value}
          className={`
            ${config.height} px-4
            bg-[var(--accent-primary)] text-white rounded-[var(--radius-md)]
            hover:opacity-90 active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 flex items-center justify-center
          `}
          whileTap={{ scale: 0.98 }}
        >
          <SearchIcon size={config.iconSize} />
        </motion.button>
      )}
    </div>
  );
};

// SearchBar with Suggestions Dropdown
const SearchBarWithSuggestions = ({
  value = '',
  onChange = () => {},
  suggestions = [],
  onSelect = () => {},
  placeholder = 'Search...',
  size = 'md',
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const handleSelect = (suggestion) => {
    onSelect(suggestion);
    setShowSuggestions(false);
  };
  
  const filteredSuggestions = suggestions.filter((s) =>
    s.label.toLowerCase().includes(value.toLowerCase())
  );
  
  const handleChange = (newValue) => {
    onChange(newValue);
    setShowSuggestions(true);
  };
  
  return (
    <div className="search-bar-with-suggestions relative">
      <SearchBar
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        size={size}
        showClear={true}
      />
      
      <AnimatePresence>
        {showSuggestions && value && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] overflow-hidden z-50"
          >
            {filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                onClick={() => handleSelect(suggestion)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <SearchIcon size={14} className="text-[var(--text-tertiary)]" />
                <span className="text-sm text-[var(--text-primary)]">{suggestion.label}</span>
                {suggestion.type && (
                  <span className="ml-auto text-xs text-[var(--text-tertiary)]">{suggestion.type}</span>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Click outside to close */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export { SearchBar, SearchBarWithSuggestions };
export default memo(SearchBar);
