// chart.worker.js
// Handles heavy data sorting and filtering off-main-thread

self.onmessage = (event) => {
  const { id, type, data, indicators, batchSize, scenario } = event.data;

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

  if (type === 'calculate_indicators') {
    // For AgentStats, 'calculate_indicators' is repurposed for 'filter_and_sort'
    let processedData = [...data];

    // Note: Backend server.js already handles scenario filtering via query params.
    // This worker handles sorting and ranking based on the filtered set.

    // Sort by avgPerf descending
    processedData.sort((a, b) => b.avgPerf - a.avgPerf);

    // Update ranks based on sorted order
    processedData = processedData.map((item, index) => ({
        ...item,
        rank: index + 1
    }));

    self.postMessage({
      id,
      type: 'indicator_result',
      result: processedData
    });
    return;
  }

  if (type === 'terminate') {
    self.postMessage({ id, type: 'terminated' });
    return;
  }
};

self.postMessage({ type: 'initialized' });
