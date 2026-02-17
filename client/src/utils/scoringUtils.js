// scoringUtils.js - Shared scoring and sorting utilities
// Mission: Provide consistent scoring logic for both Web Worker and main thread

/**
 * Calculate weighted performance score based on scenario
 * @param {Object} agent - Agent data object
 * @param {string} scenario - Scenario type (all, coding, reasoning, creative)
 * @returns {number} Weighted performance score
 */
export function calculateWeightedScore(agent, scenario = 'all') {
  const modelName = (agent.model || '').toLowerCase();
  const modelId = (agent.id || '').toLowerCase();
  const searchStr = `${modelName} ${modelId}`;
  
  let multiplier = 1.0;
  
  // 1. Scenario: Coding
  if (scenario === 'coding') {
    const isBonus = searchStr.includes('coder') || 
                    searchStr.includes('sonnet 3.5') || 
                    searchStr.includes('sonnet-3-5') || 
                    searchStr.includes('deepseek-coder');
    const isWeak = searchStr.includes('flash') || 
                   searchStr.includes('mini') || 
                   searchStr.includes('turbo') || 
                   searchStr.includes('small') ||
                   searchStr.includes('haiku');

    if (isBonus) multiplier = 1.0;
    else if (isWeak) multiplier = 0.85;
    else multiplier = 0.95;
  } 
  // 2. Scenario: Reasoning
  else if (scenario === 'reasoning') {
    const isBonus = searchStr.includes('qwq') || 
                    searchStr.includes('o1') || 
                    searchStr.includes('r1') || 
                    searchStr.includes('opus');
    const isPenalty = searchStr.includes('turbo') || 
                      searchStr.includes('flash') || 
                      searchStr.includes('mini');
    
    if (isBonus) multiplier = 1.0;
    else if (isPenalty) multiplier = 0.90;
  } 
  // 3. Scenario: Creative
  else if (scenario === 'creative') {
    const isBonus = searchStr.includes('opus') || 
                    searchStr.includes('gpt-4o') || 
                    searchStr.includes('gemini pro') || 
                    searchStr.includes('gemini-pro');
    const isPenalty = searchStr.includes('coder') || 
                      searchStr.includes('math');
    
    if (isBonus) multiplier = 1.0;
    else if (isPenalty) multiplier = 0.85;
  }
  // Default (all scenarios): no additional weighting
  else {
    multiplier = 1.0;
  }

  const baseScore = agent.avgPerf || agent.overall_score || agent.score || 0;
  return parseFloat(baseScore) * multiplier;
}

/**
 * Calculate tier based on performance score
 * @param {number} score - Performance score
 * @returns {string} Tier (S, A, B, C, D)
 */
export function calculateTier(score) {
  if (score >= 85) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
}

/**
 * Sort agents by performance score (descending)
 * @param {Array} agents - Array of agent objects
 * @param {string} scenario - Scenario type
 * @returns {Array} Sorted and ranked agents
 */
export function sortAgents(agents, scenario = 'all') {
  if (!agents || agents.length === 0) return [];
  
  // Create a copy to avoid mutating original data
  const workingCopy = [...agents];
  
  // Calculate weighted scores and assign tiers
  const scored = workingCopy.map(agent => {
    const weightedScore = calculateWeightedScore(agent, scenario);
    const tier = scenario !== 'all' ? calculateTier(weightedScore) : (agent.tier || 'D');
    
    return {
      ...agent,
      weightedScore,
      tier
    };
  });
  
  // Sort by weighted score descending
  scored.sort((a, b) => b.weightedScore - a.weightedScore);
  
  // Assign ranks based on sorted order
  return scored.map((agent, index) => ({
    ...agent,
    rank: index + 1,
    avgPerf: agent.weightedScore // Use weighted score as the displayed performance
  }));
}

/**
 * Generate test data for performance testing
 * @param {number} count - Number of agents to generate
 * @returns {Array} Array of test agent objects
 */
export function generateTestAgents(count = 1000) {
  const providers = ['OpenAI', 'Anthropic', 'Google', 'DeepSeek', 'Meta', 'Mistral', 'xAI', 'Cohere'];
  const modelPrefixes = ['GPT', 'Claude', 'Gemini', 'DeepSeek', 'Llama', 'Mixtral', 'Grok', 'Command'];
  const modelSuffixes = ['4', '4o', '3.5', '3', '2', '1', 'Pro', 'Max', 'Ultra', 'Mini', 'Flash', 'Turbo'];
  const scenarios = ['coding', 'reasoning', 'creative', 'general'];
  
  const agents = [];
  
  for (let i = 0; i < count; i++) {
    const provider = providers[Math.floor(Math.random() * providers.length)];
    const prefix = modelPrefixes[Math.floor(Math.random() * modelPrefixes.length)];
    const suffix = modelSuffixes[Math.floor(Math.random() * modelSuffixes.length)];
    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    
    // Generate varied performance scores
    const baseScore = 30 + Math.random() * 70; // 30-100 range
    
    agents.push({
      id: `agent-${i}`,
      model: `${provider} ${prefix}-${suffix}`,
      provider: provider,
      avgPerf: baseScore,
      peakPerf: Math.min(100, baseScore + Math.random() * 20),
      samples: Math.floor(Math.random() * 10000),
      tier: 'D',
      status: 'online',
      scenario
    });
  }
  
  return agents;
}

/**
 * Benchmark sorting performance
 * @param {Array} agents - Test data
 * @param {Function} sortFn - Sorting function to benchmark
 * @returns {Object} Benchmark results
 */
export function benchmarkSorting(agents, sortFn) {
  const iterations = 10;
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    sortFn(agents);
    const end = performance.now();
    times.push(end - start);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    avgMs: avgTime.toFixed(2),
    minMs: minTime.toFixed(2),
    maxMs: maxTime.toFixed(2),
    iterations
  };
}
