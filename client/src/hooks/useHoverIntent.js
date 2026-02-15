// useHoverIntent.js
// Mission: Detect hover intent with configurable delay and trigger prefetch
// Provides a simpler, more focused API than usePredictivePrefetch

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useHoverIntent
 * 
 * Detects when a user intentionally hovers over an element (vs accidental mouseover).
 * Triggers a callback after the hover delay, allowing for prefetch/preload behaviors.
 * 
 * @param {Object} options
 * @param {number} options.delay - Time in ms to wait before triggering (default: 80ms)
 * @param {Function} options.onHover - Callback when hover intent is confirmed
 * @param {Function} options.onHoverStart - Callback immediately on mouseenter (optional)
 * @param {Function} options.onHoverEnd - Callback on mouseleave (optional)
 * @param {boolean} options.enabled - Enable/disable the hook (default: true)
 * 
 * @returns {Object} handlers to attach to elements
 */
export function useHoverIntent({
  delay = 80,
  onHover,
  onHoverStart,
  onHoverEnd,
  enabled = true
} = {}) {
  const [isHovering, setIsHovering] = useState(false);
  const timerRef = useRef(null);
  const hoverStartRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Handle mouse enter - start intent timer
  const handleMouseEnter = useCallback((event) => {
    if (!enabled) return;
    
    // Track when hover started
    hoverStartRef.current = Date.now();
    
    // Optional: immediate feedback
    if (onHoverStart) {
      onHoverStart(event);
    }
    
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    // Start intent detection timer
    timerRef.current = setTimeout(() => {
      setIsHovering(true);
      
      // Trigger the hover action
      if (onHover) {
        onHover(event);
      }
    }, delay);
  }, [enabled, delay, onHover, onHoverStart]);

  // Handle mouse leave - cancel intent if not yet triggered
  const handleMouseLeave = useCallback((event) => {
    if (!enabled) return;
    
    // Clear the timer (cancels hover intent)
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    setIsHovering(false);
    
    // Optional: callback on hover end
    if (onHoverEnd) {
      // Calculate hover duration
      const duration = hoverStartRef.current ? Date.now() - hoverStartRef.current : 0;
      onHoverEnd(event, duration);
    }
    
    hoverStartRef.current = null;
  }, [enabled, onHoverEnd]);

  // Handle mouse move - can optionally cancel hover if mouse moves too far
  const handleMouseMove = useCallback((event) => {
    // Could add logic here to cancel hover if cursor moves significantly
    // For now, we keep it simple
  }, []);

  // Return handlers to attach to elements
  return {
    // Combined handlers object (for spread)
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove
    },
    // Individual handlers (for specific attachment)
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    // State
    isHovering
  };
}

/**
 * createHoverIntentHook - Factory to create custom hooks with preset options
 * 
 * @param {Object} defaultOptions - Default options for the hook
 * @returns {Function} Custom hook with preset options
 */
export function createHoverIntentHook(defaultOptions = {}) {
  return function useCustomHoverIntent(overrides = {}) {
    const options = { ...defaultOptions, ...overrides };
    return useHoverIntent(options);
  };
}

/**
 * useHoverIntentPrefetch - Specialized hook for prefetch scenarios
 * Ready-to-use hook for data prefetching on hover
 * 
 * @param {Function} prefetchFn - Function to call for prefetching
 * @param {number} delay - Delay before prefetch triggers
 * @returns {Object} handlers and state
 */
export function useHoverIntentPrefetch(prefetchFn, delay = 80) {
  const isPrefetchingRef = useRef(false);
  
  const handleHover = useCallback((event) => {
    if (isPrefetchingRef.current) return;
    
    isPrefetchingRef.current = true;
    
    try {
      prefetchFn(event);
    } finally {
      // Reset after a short delay to prevent rapid re-prefetching
      setTimeout(() => {
        isPrefetchingRef.current = false;
      }, 1000);
    }
  }, [prefetchFn]);

  return useHoverIntent({
    delay,
    onHover: handleHover
  });
}

export default useHoverIntent;
