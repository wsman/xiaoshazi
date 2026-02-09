import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import ChartWorkerManager from '../utils/ChartWorkerManager';

// Simple cache for processed results (Map<Scenario, Data>)
const RESULT_CACHE = new Map();

/**
 * usePredictivePrefetch
 * Mission: Eliminate perceived latency by predicting user intent and pre-calculating data.
 */
export const usePredictivePrefetch = (baseUrl) => {
  const [prefetching, setPrefetching] = useState(false);
  const activeRequests = useRef(new Set());
  const hoverTimers = useRef(new Map());

  const prefetchScenario = useCallback(async (scenario) => {
    // Skip if already in cache or being fetched
    if (RESULT_CACHE.has(scenario) || activeRequests.current.has(scenario)) {
      return;
    }

    if (!scenario || scenario === 'all') return;

    activeRequests.current.add(scenario);
    setPrefetching(true);

    try {
      // Step 1: Fetch raw data
      const url = `${baseUrl}/api/agents?scenario=${scenario}`;
      const response = await axios.get(url);
      
      if (response.data.success) {
        const rawData = response.data.data;
        
        // Step 2: Integrate Worker - process data immediately
        // Mission: Connect prefetch logic to ChartWorkerManager.processData()
        const processedData = await ChartWorkerManager.processData(rawData, scenario);
        
        // Step 3: Store result in a simple cache
        RESULT_CACHE.set(scenario, {
          data: processedData,
          timestamp: Date.now()
        });
        
        console.log(`[ZeroLatencyUX] Prefetched and pre-calculated scenario: ${scenario}`);
      }
    } catch (error) {
      console.error(`[ZeroLatencyUX] Prefetch failed for ${scenario}:`, error);
    } finally {
      activeRequests.current.delete(scenario);
      setPrefetching(false);
    }
  }, [baseUrl]);

  /**
   * onMouseEnter handler to be attached to scenario buttons
   * Mission: Track mouse hover duration. If > 80ms, trigger data processing.
   */
  const handleMouseEnter = useCallback((scenario) => {
    if (RESULT_CACHE.has(scenario) || activeRequests.current.has(scenario)) return;

    // Clear any existing timer for this scenario
    if (hoverTimers.current.has(scenario)) {
      clearTimeout(hoverTimers.current.get(scenario));
    }

    // Start 80ms timer
    const timer = setTimeout(() => {
      prefetchScenario(scenario);
      hoverTimers.current.delete(scenario);
    }, 80);

    hoverTimers.current.set(scenario, timer);
  }, [prefetchScenario]);

  /**
   * onMouseLeave handler to cancel prefetch if hover was too short
   */
  const handleMouseLeave = useCallback((scenario) => {
    if (hoverTimers.current.has(scenario)) {
      clearTimeout(hoverTimers.current.get(scenario));
      hoverTimers.current.delete(scenario);
    }
  }, []);

  const getCachedResult = useCallback((scenario) => {
    const cached = RESULT_CACHE.get(scenario);
    // Cache valid for 5 minutes
    if (cached && (Date.now() - cached.timestamp < 300000)) {
      return cached.data;
    }
    return null;
  }, []);

  return {
    handleMouseEnter,
    handleMouseLeave,
    getCachedResult,
    prefetching
  };
};

export default usePredictivePrefetch;
