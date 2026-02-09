// scoring.worker.js
// Handles heavy agent data scoring, weighting, and sorting off-main-thread

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
    let processedData = [...data];

    // Scenario-Based Weighting Logic
    const weighted = processedData.map(item => {
        let multiplier = 1.0;
        const modelName = (item.model || '').toLowerCase();
        const modelId = (item.id || '').toLowerCase();
        const searchStr = `${modelName} ${modelId}`;

        // 1. Scenario: Coding
        if (scenario === 'coding') {
          const isBonus = searchStr.includes('coder') || searchStr.includes('sonnet 3.5') || 
                          searchStr.includes('sonnet-3-5') || searchStr.includes('deepseek-coder');
          const isWeak = searchStr.includes('flash') || searchStr.includes('mini') || 
                         searchStr.includes('turbo') || searchStr.includes('small') ||
                         searchStr.includes('haiku');

          if (isBonus) multiplier = 1.0;
          else if (isWeak) multiplier = 0.85;
          else multiplier = 0.95;
        } 
        // 2. Scenario: Reasoning
        else if (scenario === 'reasoning') {
          const isBonus = searchStr.includes('qwq') || searchStr.includes('o1') || 
                          searchStr.includes('r1') || searchStr.includes('opus');
          const isPenalty = searchStr.includes('turbo') || searchStr.includes('flash') || 
                            searchStr.includes('mini');
          
          if (isBonus) multiplier = 1.0;
          else if (isPenalty) multiplier = 0.90;
        } 
        // 3. Scenario: Creative
        else if (scenario === 'creative') {
          const isBonus = searchStr.includes('opus') || searchStr.includes('gpt-4o') || 
                          searchStr.includes('gemini pro') || searchStr.includes('gemini-pro');
          const isPenalty = searchStr.includes('coder') || searchStr.includes('math');
          
          if (isBonus) multiplier = 1.0;
          else if (isPenalty) multiplier = 0.85;
        }

        const baseScore = item.avgPerf || item.overall_score || item.score || 0;
        const newAvgPerf = parseFloat(baseScore) * multiplier;
        
        // Dynamic Tier Recalculation
        let newTier = item.tier;
        if (scenario !== 'all' && scenario) {
          if (newAvgPerf >= 85) newTier = 'S';
          else if (newAvgPerf >= 75) newTier = 'A';
          else if (newAvgPerf >= 60) newTier = 'B';
          else if (newAvgPerf >= 40) newTier = 'C';
          else newTier = 'D';
        }

        return {
          ...item,
          avgPerf: newAvgPerf,
          tier: newTier
        };
    });

    // Sort by avgPerf descending
    weighted.sort((a, b) => b.avgPerf - a.avgPerf);

    // Update ranks based on sorted order
    const rankedData = weighted.map((item, index) => ({
        ...item,
        rank: index + 1
    }));

    self.postMessage({
      id,
      type: 'process_result',
      result: rankedData
    });
    return;
  }

  if (type === 'terminate') {
    self.postMessage({ id, type: 'terminated' });
    return;
  }
};

self.postMessage({ type: 'initialized' });
