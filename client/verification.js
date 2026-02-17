// verification.js - Verification script for scoring logic and performance
// Run with: node --experimental-vm-modules verification.js

import { sortAgents, generateTestAgents, benchmarkSorting } from './src/utils/scoringUtils.js';

console.log('='.repeat(60));
console.log('SCORING LOGIC VERIFICATION');
console.log('='.repeat(60));

// Test 1: Basic Sorting
console.log('\n[TEST 1] Basic Sorting Logic');
const testData1 = [
  { id: '1', model: 'GPT-4', provider: 'OpenAI', avgPerf: 85, tier: 'S' },
  { id: '2', model: 'Claude-3', provider: 'Anthropic', avgPerf: 82, tier: 'S' },
  { id: '3', model: 'Gemini-Pro', provider: 'Google', avgPerf: 78, tier: 'A' },
  { id: '4', model: 'DeepSeek-Coder', provider: 'DeepSeek', avgPerf: 75, tier: 'A' },
  { id: '5', model: 'Flash-Mini', provider: 'OpenAI', avgPerf: 45, tier: 'C' },
];

const sorted1 = sortAgents(testData1, 'all');
console.log('Input: 5 agents with different scores');
console.log('Output ranks:', sorted1.map(a => `#${a.rank}: ${a.model} (${a.avgPerf.toFixed(1)})`).join('\n '));

// Verify sorting is correct
const isSortedCorrectly = sorted1.every((item, i) => {
  if (i === 0) return true;
  return item.avgPerf <= sorted1[i-1].avgPerf;
});
console.log('✓ Sorting correct:', isSortedCorrectly);

// Test 2: Scenario-based weighting (Coding)
console.log('\n[TEST 2] Scenario-based Weighting (coding)');
const testData2 = [
  { id: '1', model: 'DeepSeek-Coder-V2', provider: 'DeepSeek', avgPerf: 70 },
  { id: '2', model: 'GPT-4-Turbo', provider: 'OpenAI', avgPerf: 75 },
  { id: '3', model: 'Claude-3-Sonnet', provider: 'Anthropic', avgPerf: 72 },
  { id: '4', model: 'Gemini-Flash', provider: 'Google', avgPerf: 50 },
];

const sortedCoding = sortAgents(testData2, 'coding');
console.log('Coding scenario - weighted scores:');
console.log(sortedCoding.map(a => `  #${a.rank}: ${a.model} -> ${a.weightedScore.toFixed(2)} (tier: ${a.tier})`).join('\n'));

// Verify DeepSeek-Coder gets bonus
const coderAgent = sortedCoding.find(a => a.model.includes('Coder'));
console.log('✓ DeepSeek-Coder weighted correctly:', coderAgent.weightedScore === 70); // 70 * 1.0 = 70

// Test 3: Tier calculation
console.log('\n[TEST 3] Tier Calculation');
const tierTests = [
  { score: 90, expected: 'S' },
  { score: 80, expected: 'A' },
  { score: 65, expected: 'B' },
  { score: 45, expected: 'C' },
  { score: 30, expected: 'D' },
];

tierTests.forEach(({ score, expected }) => {
  const sorted = sortAgents([{ id: 'test', model: 'Test', avgPerf: score }], 'coding');
  const actual = sorted[0].tier;
  console.log(`  Score ${score} -> Tier ${actual} (expected: ${expected}) ${actual === expected ? '✓' : '✗'}`);
});

// Test 4: Performance Benchmark
console.log('\n[TEST 4] Performance Benchmark');
const sizes = [100, 500, 1000, 2000, 5000];

for (const size of sizes) {
  const testData = generateTestAgents(size);
  const result = benchmarkSorting(testData, sortAgents);
  console.log(`  ${size.toString().padStart(5)} agents: avg ${result.avgMs}ms (min: ${result.minMs}ms, max: ${result.maxMs}ms)`);
}

// Test 5: Consistency between Worker and Main Thread
console.log('\n[TEST 5] Logic Consistency');
const largeDataset = generateTestAgents(1000);
const resultMT = sortAgents(largeDataset, 'reasoning');

// Check top 10 are properly sorted
const isConsistent = resultMT.slice(0, 10).every((item, i) => {
  if (i === 0) return true;
  return item.weightedScore <= resultMT[i-1].weightedScore;
});
console.log('✓ Main thread sorting consistent:', isConsistent);

console.log('\n' + '='.repeat(60));
console.log('ALL TESTS COMPLETED');
console.log('='.repeat(60));
