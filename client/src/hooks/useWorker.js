// useWorker.js - React Hook for Web Worker communication
// Mission: Provide a clean hook interface for worker-based scoring and sorting

import { useState, useEffect, useCallback, useRef } from 'react';
import ChartWorkerManager from '../utils/ChartWorkerManager';

/**
 * useWorker - Hook for managing Web Worker-based scoring operations
 * 
 * @param {Object} options
 * @param {string} options.scenario - Current scenario (all, coding, reasoning, creative)
 * @param {boolean} options.autoInitialize - Whether to auto-initialize the worker
 * @returns {Object} Worker state and methods
 */
export function useWorker({ scenario = 'all', autoInitialize = true } = {}) {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    avgLatency: 0
  });
  
  const scenarioRef = useRef(scenario);

  // Update scenario ref when it changes
  useEffect(() => {
    scenarioRef.current = scenario;
  }, [scenario]);

  // Initialize worker on mount
  useEffect(() => {
    if (autoInitialize) {
      initializeWorker();
    }
    
    return () => {
      // Optional: cleanup on unmount
      // ChartWorkerManager.terminate();
    };
  }, [autoInitialize]);

  const initializeWorker = useCallback(async () => {
    try {
      const success = await ChartWorkerManager.initialize();
      setIsReady(success);
      if (!success) {
        console.warn('[useWorker] Worker initialization failed, using main thread fallback');
      }
      return success;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const processData = useCallback(async (agents) => {
    if (!agents || agents.length === 0) {
      return agents;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const currentScenario = scenarioRef.current;
      const result = await ChartWorkerManager.processData(agents, currentScenario);
      
      // Update metrics
      const workerMetrics = ChartWorkerManager.getMetrics();
      setMetrics({
        totalRequests: workerMetrics.totalRequests,
        successfulRequests: workerMetrics.successfulRequests,
        failedRequests: workerMetrics.failedRequests,
        avgLatency: workerMetrics.avgLatency
      });

      return result;
    } catch (err) {
      console.error('[useWorker] Process data error:', err);
      setError(err.message);
      // Fallback is handled internally by ChartWorkerManager
      return ChartWorkerManager.processDataOnMainThread(agents, scenarioRef.current);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      const health = await ChartWorkerManager.checkHealth();
      return health;
    } catch (err) {
      console.error('[useWorker] Health check error:', err);
      return null;
    }
  }, []);

  const terminate = useCallback(async () => {
    await ChartWorkerManager.terminate();
    setIsReady(false);
  }, []);

  return {
    isReady,
    isProcessing,
    error,
    metrics,
    initializeWorker,
    processData,
    checkHealth,
    terminate
  };
}

export default useWorker;
