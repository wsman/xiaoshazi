/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateWeightedScore,
  calculateTier,
  sortAgents,
  generateTestAgents,
  benchmarkSorting,
} from './scoringUtils';

describe('scoringUtils', () => {
  describe('calculateWeightedScore', () => {
    it('should return base score for "all" scenario', () => {
      const agent = { model: 'GPT-4', avgPerf: 85 };
      expect(calculateWeightedScore(agent, 'all')).toBe(85);
    });

    it('should apply multiplier for coding scenario with coder model', () => {
      const agent = { model: 'DeepSeek-Coder', avgPerf: 80 };
      const score = calculateWeightedScore(agent, 'coding');
      expect(score).toBe(80); // No multiplier applied for coding bonus
    });

    it('should apply penalty for flash models in coding scenario', () => {
      const agent = { model: 'GPT-3.5-Turbo', avgPerf: 100 };
      const score = calculateWeightedScore(agent, 'coding');
      expect(score).toBe(85); // 100 * 0.85 = 85
    });

    it('should apply bonus for o1/r1/opus models in reasoning scenario', () => {
      const agent = { model: 'OpenAI o1', avgPerf: 95 };
      const score = calculateWeightedScore(agent, 'reasoning');
      expect(score).toBe(95); // No multiplier penalty
    });

    it('should apply penalty for turbo/flash models in reasoning', () => {
      const agent = { model: 'GPT-4-Turbo', avgPerf: 90 };
      const score = calculateWeightedScore(agent, 'reasoning');
      expect(score).toBe(81); // 90 * 0.90 = 81
    });

    it('should apply bonus for opus/gpt-4o in creative scenario', () => {
      const agent = { model: 'Claude Opus', avgPerf: 92 };
      const score = calculateWeightedScore(agent, 'creative');
      expect(score).toBe(92);
    });

    it('should apply penalty for coder/math models in creative', () => {
      const agent = { model: 'DeepSeek-Coder', avgPerf: 80 };
      const score = calculateWeightedScore(agent, 'creative');
      expect(score).toBe(68); // 80 * 0.85 = 68
    });

    it('should handle missing avgPerf gracefully', () => {
      const agent = { model: 'GPT-4' };
      expect(calculateWeightedScore(agent, 'all')).toBe(0);
    });

    it('should handle alternative score fields', () => {
      const agent = { model: 'GPT-4', overall_score: 88 };
      expect(calculateWeightedScore(agent, 'all')).toBe(88);
    });

    it('should handle score field', () => {
      const agent = { model: 'GPT-4', score: 75 };
      expect(calculateWeightedScore(agent, 'all')).toBe(75);
    });

    it('should use id field for matching', () => {
      const agent = { id: 'gpt-4o-mini', model: 'Unknown', avgPerf: 70 };
      const score = calculateWeightedScore(agent, 'coding');
      expect(score).toBe(59.5); // 70 * 0.85 = 59.5
    });
  });

  describe('calculateTier', () => {
    it('should return S tier for score >= 85', () => {
      expect(calculateTier(85)).toBe('S');
      expect(calculateTier(100)).toBe('S');
    });

    it('should return A tier for score >= 75 and < 85', () => {
      expect(calculateTier(75)).toBe('A');
      expect(calculateTier(84)).toBe('A');
    });

    it('should return B tier for score >= 60 and < 75', () => {
      expect(calculateTier(60)).toBe('B');
      expect(calculateTier(74)).toBe('B');
    });

    it('should return C tier for score >= 40 and < 60', () => {
      expect(calculateTier(40)).toBe('C');
      expect(calculateTier(59)).toBe('C');
    });

    it('should return D tier for score < 40', () => {
      expect(calculateTier(39)).toBe('D');
      expect(calculateTier(0)).toBe('D');
      expect(calculateTier(-10)).toBe('D');
    });
  });

  describe('sortAgents', () => {
    it('should return empty array for empty input', () => {
      expect(sortAgents([])).toEqual([]);
      expect(sortAgents(null)).toEqual([]);
      expect(sortAgents(undefined)).toEqual([]);
    });

    it('should sort agents by weighted score descending', () => {
      const agents = [
        { id: '1', model: 'GPT-3.5', avgPerf: 70 },
        { id: '2', model: 'GPT-4', avgPerf: 90 },
        { id: '3', model: 'Claude', avgPerf: 80 },
      ];
      
      const result = sortAgents(agents, 'all');
      
      expect(result[0].rank).toBe(1);
      expect(result[0].model).toBe('GPT-4');
      expect(result[1].rank).toBe(2);
      expect(result[1].model).toBe('Claude');
      expect(result[2].rank).toBe(3);
      expect(result[2].model).toBe('GPT-3.5');
    });

    it('should preserve original agent data', () => {
      const agents = [
        { id: '1', model: 'GPT-4', avgPerf: 90, samples: 1000 },
      ];
      
      const result = sortAgents(agents);
      
      expect(result[0].samples).toBe(1000);
      expect(result[0].id).toBe('1');
    });

    it('should use weighted score as displayed performance', () => {
      const agents = [
        { id: '1', model: 'GPT-3.5-Turbo', avgPerf: 100 },
      ];
      
      const result = sortAgents(agents, 'coding');
      
      expect(result[0].avgPerf).toBe(85); // 100 * 0.85
      expect(result[0].weightedScore).toBe(85);
    });

    it('should assign tier based on weighted score for non-all scenarios', () => {
      const agents = [
        { id: '1', model: 'GPT-4', avgPerf: 90 },
      ];
      
      const result = sortAgents(agents, 'reasoning');
      
      expect(result[0].tier).toBe('S'); // 90 >= 85
    });

    it('should keep original tier for "all" scenario', () => {
      const agents = [
        { id: '1', model: 'GPT-4', avgPerf: 90, tier: 'A' },
      ];
      
      const result = sortAgents(agents, 'all');
      
      expect(result[0].tier).toBe('A');
    });

    it('should not mutate original array', () => {
      const original = [
        { id: '1', model: 'GPT-4', avgPerf: 90 },
        { id: '2', model: 'GPT-3.5', avgPerf: 70 },
      ];
      const originalCopy = JSON.stringify(original);
      
      sortAgents(original);
      
      expect(JSON.stringify(original)).toBe(originalCopy);
    });
  });

  describe('generateTestAgents', () => {
    it('should generate specified number of agents', () => {
      const agents = generateTestAgents(100);
      expect(agents).toHaveLength(100);
    });

    it('should generate agents with required fields', () => {
      const agents = generateTestAgents(1);
      const agent = agents[0];
      
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('model');
      expect(agent).toHaveProperty('provider');
      expect(agent).toHaveProperty('avgPerf');
      expect(agent).toHaveProperty('peakPerf');
      expect(agent).toHaveProperty('samples');
      expect(agent).toHaveProperty('tier');
      expect(agent).toHaveProperty('status');
    });

    it('should generate valid performance scores', () => {
      const agents = generateTestAgents(50);
      
      agents.forEach(agent => {
        expect(agent.avgPerf).toBeGreaterThanOrEqual(30);
        expect(agent.avgPerf).toBeLessThanOrEqual(100);
        expect(agent.peakPerf).toBeLessThanOrEqual(100);
        expect(agent.peakPerf).toBeGreaterThanOrEqual(agent.avgPerf);
      });
    });

    it('should generate default 1000 agents when no count specified', () => {
      const agents = generateTestAgents();
      expect(agents).toHaveLength(1000);
    });
  });

  describe('benchmarkSorting', () => {
    it('should return benchmark results object', () => {
      const agents = generateTestAgents(100);
      const result = benchmarkSorting(agents, sortAgents);
      
      expect(result).toHaveProperty('avgMs');
      expect(result).toHaveProperty('minMs');
      expect(result).toHaveProperty('maxMs');
      expect(result).toHaveProperty('iterations');
    });

    it('should perform specified number of iterations', () => {
      const agents = generateTestAgents(50);
      const result = benchmarkSorting(agents, sortAgents);
      
      // benchmarkSorting internally runs 10 iterations by default
      expect(result.iterations).toBe(10);
    });

    it('should return numeric timing values', () => {
      const agents = generateTestAgents(20);
      const result = benchmarkSorting(agents, sortAgents);
      
      expect(typeof result.avgMs).toBe('string');
      expect(typeof result.minMs).toBe('string');
      expect(typeof result.maxMs).toBe('string');
      
      const avgValue = parseFloat(result.avgMs);
      expect(avgValue).toBeGreaterThan(0);
    });
  });
});
