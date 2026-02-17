// scoring.worker.js
// Handles heavy agent data scoring, weighting, and sorting off-main-thread
// Uses shared scoringUtils for consistent logic with main thread

import { calculateWeightedScore, calculateTier, sortAgents } from '../utils/scoringUtils';

self.onmessage = (event) => {
  const { id, type, data, scenario } = event.data;

  if (type === 'health_check') {
    self.postMessage({
      id,
      type: 'health_response',
      result: {
        status: 'healthy',
        timestamp: Date.now(),
        memory: performance.memory ? performance.memory.usedJSHeapSize : 'unknown'
      }
    });
    return;
  }

  if (type === 'process_data') {
    // Use shared sorting function from scoringUtils
    const processedData = sortAgents(data, scenario);

    self.postMessage({
      id,
      type: 'process_result',
      result: processedData
    });
    return;
  }

  // Note: Benchmark functionality removed - can be added via separate endpoint if needed
  // The worker focuses on core process_data for scoring performance

  if (type === 'terminate') {
    self.postMessage({ id, type: 'terminated' });
    return;
  }
};

self.postMessage({ type: 'initialized' });
