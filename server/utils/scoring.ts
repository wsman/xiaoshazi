/**
 * xiaoshazi Scoring Utilities
 * TypeScript version for server-side scoring logic
 */

import fs from 'fs';
import path from 'path';

// Types
export interface Agent {
  id: number;
  rank: number;
  diff: number;
  tier: string;
  provider: string;
  model: string;
  avgPerf: number;
  peakPerf: number;
  samples: number;
  scenarios: string[];
}

export interface ScoringOptions {
  scenario?: 'all' | 'coding' | 'reasoning' | 'creative';
  normalize?: boolean;
  minSamples?: number;
}

export interface RankedAgent extends Agent {
  weightedScore: number;
  normalizedScore: number;
}

// Constants
const SCENARIOS = ['all', 'coding', 'reasoning', 'creative'] as const;
export type Scenario = typeof SCENARIOS[number];

// Model coefficient paths
const MODEL_COEFFICIENTS_PATH = path.join(__dirname, '../data/cn_models.json');
const AGENT_COEFFICIENTS_PATH = path.join(__dirname, '../data/agent_coefficients.json');

interface ModelCoefficients {
  [key: string]: {
    coding?: number;
    reasoning?: number;
    creative?: number;
    overall?: number;
  };
}

interface AgentCoefficients {
  [key: string]: {
    coefficient: number;
    scenario?: string;
  };
}

// Cache for loaded coefficients
let modelCoefficients: ModelCoefficients | null = null;
let agentCoefficients: AgentCoefficients | null = null;

/**
 * Load model coefficients from JSON file
 */
function loadModelCoefficients(): ModelCoefficients {
  if (modelCoefficients) return modelCoefficients;
  
  try {
    const data = fs.readFileSync(MODEL_COEFFICIENTS_PATH, 'utf-8');
    modelCoefficients = JSON.parse(data);
    return modelCoefficients!;
  } catch (error) {
    console.warn('Failed to load model coefficients:', error);
    return {};
  }
}

/**
 * Load agent coefficients from JSON file
 */
function loadAgentCoefficients(): AgentCoefficients {
  if (agentCoefficients) return agentCoefficients;
  
  try {
    const data = fs.readFileSync(AGENT_COEFFICIENTS_PATH, 'utf-8');
    agentCoefficients = JSON.parse(data);
    return agentCoefficients!;
  } catch (error) {
    console.warn('Failed to load agent coefficients:', error);
    return {};
  }
}

/**
 * Get model-specific multiplier based on scenario
 */
function getModelMultiplier(agent: Agent, scenario: Scenario): number {
  const modelName = agent.model.toLowerCase();
  const modelId = agent.id.toString();
  const searchStr = `${modelName} ${modelId}`;
  
  // Scenario-specific multipliers
  const multipliers: Record<Scenario, { bonus: RegExp; penalty: RegExp; bonusVal: number; penaltyVal: number }> = {
    all: { 
      bonus: /sonnet/i, 
      penalty: /haiku|mini|turbo/i, 
      bonusVal: 1.05, 
      penaltyVal: 0.90 
    },
    coding: { 
      bonus: /coder|sonnet.*3\.5|deepseek.*coder|claude.*3\.5/i, 
      penalty: /flash|mini|turbo|small|haiku/i, 
      bonusVal: 1.10, 
      penaltyVal: 0.85 
    },
    reasoning: { 
      bonus: /qwq|o1|r1|opus/i, 
      penalty: /turbo|flash|mini/i, 
      bonusVal: 1.10, 
      penaltyVal: 0.90 
    },
    creative: { 
      bonus: /opus|gpt-4o|gemini.*pro|sonnet/i, 
      penalty: /haiku|turbo|flash/i, 
      bonusVal: 1.08, 
      penaltyVal: 0.88 
    },
  };
  
  const config = multipliers[scenario];
  
  if (config.bonus.test(searchStr)) {
    return config.bonusVal;
  } else if (config.penalty.test(searchStr)) {
    return config.penaltyVal;
  }
  
  return 1.0;
}

/**
 * Get agent-specific coefficient
 */
function getAgentCoefficient(agent: Agent, scenario: Scenario): number {
  const coefficients = loadAgentCoefficients();
  const key = `${agent.provider}_${agent.model}`.toLowerCase();
  
  if (coefficients[key]) {
    const coef = coefficients[key];
    if (coef.scenario && coef.scenario !== scenario && coef.scenario !== 'all') {
      return 1.0;
    }
    return coef.coefficient;
  }
  
  return 1.0;
}

/**
 * Calculate sample size weight
 * @param samples - Number of samples
 * @param minSamples - Minimum samples threshold
 * @returns Weight between 0.5 and 1.0
 */
function getSampleWeight(samples: number, minSamples: number = 100): number {
  if (samples < minSamples) {
    return Math.max(0.5, samples / minSamples);
  }
  return 1.0;
}

/**
 * Calculate weighted performance score
 * @param agent - Agent data
 * @param scenario - Scenario type
 * @returns Weighted score
 */
export function calculateWeightedScore(agent: Agent, scenario: Scenario = 'all'): number {
  // Base performance score
  let score = agent.avgPerf;
  
  // Apply model-specific multiplier
  const modelMultiplier = getModelMultiplier(agent, scenario);
  score *= modelMultiplier;
  
  // Apply agent coefficient
  const agentCoefficient = getAgentCoefficient(agent, scenario);
  score *= agentCoefficient;
  
  // Apply sample weight
  const sampleWeight = getSampleWeight(agent.samples);
  score *= sampleWeight;
  
  return Math.round(score * 100) / 100;
}

/**
 * Calculate peak performance score
 */
export function calculatePeakScore(agent: Agent, scenario: Scenario = 'all'): number {
  let score = agent.peakPerf;
  
  const modelMultiplier = getModelMultiplier(agent, scenario);
  score *= modelMultiplier;
  
  const agentCoefficient = getAgentCoefficient(agent, scenario);
  score *= agentCoefficient;
  
  return Math.round(score * 100) / 100;
}

/**
 * Normalize scores to 0-100 range
 */
export function normalizeScores(agents: RankedAgent[]): RankedAgent[] {
  if (agents.length === 0) return agents;
  
  const maxScore = Math.max(...agents.map(a => a.weightedScore));
  const minScore = Math.min(...agents.map(a => a.weightedScore));
  const range = maxScore - minScore;
  
  if (range === 0) {
    return agents.map(a => ({ ...a, normalizedScore: 100 }));
  }
  
  return agents.map(agent => ({
    ...agent,
    normalizedScore: Math.round(((agent.weightedScore - minScore) / range) * 100)
  }));
}

/**
 * Sort agents by weighted score
 */
export function sortByScore(agents: Agent[], scenario: Scenario = 'all'): RankedAgent[] {
  const ranked: RankedAgent[] = agents.map(agent => ({
    ...agent,
    weightedScore: calculateWeightedScore(agent, scenario),
    normalizedScore: 0,
  }));
  
  return normalizeScores(
    ranked.sort((a, b) => b.weightedScore - a.weightedScore)
  );
}

/**
 * Get tier based on score
 */
export function getTier(score: number): string {
  if (score >= 85) return 'S';
  if (score >= 75) return 'A';
  if (score >= 65) return 'B';
  if (score >= 55) return 'C';
  return 'D';
}

/**
 * Calculate rank change
 */
export function calculateRankChange(previousRank: number, currentRank: number): number {
  return previousRank - currentRank; // Positive means improved
}

// Export all utilities
export default {
  calculateWeightedScore,
  calculatePeakScore,
  normalizeScores,
  sortByScore,
  getTier,
  calculateRankChange,
  getModelMultiplier,
  getAgentCoefficient,
  SCENARIOS,
};
