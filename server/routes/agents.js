/**
 * @fileoverview Agents API Routes
 * @description Handles agent rankings and data endpoints
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Mock Agent Data
const MOCK_AGENTS = [
    { id: 1, rank: 1, diff: 0, tier: "S", provider: "Anthropic", model: "Claude 3.5 Sonnet", avgPerf: 88.5, peakPerf: 94.2, samples: 15420, scenarios: ["coding", "reasoning", "creative"] },
    { id: 2, rank: 2, diff: 1, tier: "S", provider: "OpenAI", model: "GPT-4o", avgPerf: 87.2, peakPerf: 93.5, samples: 18200, scenarios: ["coding", "reasoning", "creative"] },
    { id: 3, rank: 3, diff: -1, tier: "S", provider: "Google", model: "Gemini 1.5 Pro", avgPerf: 85.1, peakPerf: 91.8, samples: 12050, scenarios: ["coding", "reasoning", "creative"] },
    { id: 4, rank: 4, diff: 2, tier: "A", provider: "DeepSeek", model: "DeepSeek Coder V2", avgPerf: 82.4, peakPerf: 89.5, samples: 8500, scenarios: ["coding"] },
    { id: 5, rank: 5, diff: -1, tier: "A", provider: "OpenAI", model: "GPT-4 Turbo", avgPerf: 81.0, peakPerf: 88.2, samples: 15000, scenarios: ["coding", "reasoning"] },
    { id: 6, rank: 6, diff: 0, tier: "A", provider: "Anthropic", model: "Claude 3 Opus", avgPerf: 80.5, peakPerf: 92.0, samples: 6500, scenarios: ["reasoning", "creative"] },
    { id: 7, rank: 7, diff: -2, tier: "B", provider: "Mistral", model: "Mistral Large", avgPerf: 78.2, peakPerf: 85.4, samples: 5200, scenarios: ["creative"] },
    { id: 8, rank: 8, diff: 1, tier: "B", provider: "Meta", model: "Llama 3.1 405B", avgPerf: 76.5, peakPerf: 84.1, samples: 9800, scenarios: ["reasoning", "coding"] },
    { id: 9, rank: 9, diff: 0, tier: "B", provider: "Google", model: "Gemini 1.5 Flash", avgPerf: 75.0, peakPerf: 82.5, samples: 11000, scenarios: ["coding"] },
    { id: 10, rank: 10, diff: -1, tier: "C", provider: "Cohere", model: "Command R+", avgPerf: 72.1, peakPerf: 79.8, samples: 4100, scenarios: ["creative", "reasoning"] },
    { id: 11, rank: 11, diff: 1, tier: "C", provider: "DeepSeek", model: "DeepSeek Chat V2", avgPerf: 70.5, peakPerf: 78.2, samples: 7500, scenarios: ["creative"] },
    { id: 12, rank: 12, diff: -1, tier: "C", provider: "Mistral", model: "Mistral Nemo", avgPerf: 68.2, peakPerf: 75.5, samples: 4800, scenarios: ["coding"] },
    { id: 13, rank: 13, diff: 0, tier: "D", provider: "OpenAI", model: "GPT-3.5 Turbo", avgPerf: 65.0, peakPerf: 72.0, samples: 25000, scenarios: ["creative"] },
    { id: 14, rank: 14, diff: 0, tier: "D", provider: "Meta", model: "Llama 3.1 70B", avgPerf: 62.5, peakPerf: 70.5, samples: 8900, scenarios: ["coding"] },
    { id: 15, rank: 15, diff: -2, tier: "D", provider: "Groq", model: "Llama 3 Groq", avgPerf: 60.1, peakPerf: 68.2, samples: 3500, scenarios: ["reasoning"] },
];

/**
 * Set Redis client (called from main server.js)
 * @param {Object} redisClientRef - Redis client reference
 * @param {boolean} isRedisAvailableRef - Redis availability flag
 */
let redisClient = null;
let isRedisAvailable = false;

router.setRedisClient = (client, available) => {
    redisClient = client;
    isRedisAvailable = available;
};

/**
 * @swagger
 * /api/agents:
 *   get:
 *     summary: 获取Agent排名
 *     description: 返回AI Agent的性能排名数据
 *     tags: [Agent]
 *     parameters:
 *       - in: query
 *         name: scenario
 *         schema:
 *           type: string
 *         description: 场景过滤 (coding, reasoning, creative)
 *     responses:
 *       200:
 *         description: Agent排名数据
 */
router.get('/agents', async (req, res) => {
    const { scenario } = req.query;
    
    // Configure proper Cache-Control headers - 30分钟缓存
    res.set('Cache-Control', 'public, max-age=1800, s-maxage=1800');

    let agentData = [];
    let source = 'memory';

    try {
        if (isRedisAvailable && redisClient) {
            // New Mission Strategy: leaderboard:overall (ZSet) -> agent:metadata:{id} (Hash)
            const ids = await redisClient.zRange('leaderboard:overall', 0, -1, { REV: true });
            
            if (ids && ids.length > 0) {
                // Fetch all details using a pipeline
                const pipeline = redisClient.multi();
                ids.forEach(id => {
                    pipeline.hGetAll(`agent:metadata:${id}`);
                });
                const rawDetails = await pipeline.exec();
                
                // Process and format data
                agentData = rawDetails.map((details, index) => {
                    return {
                        ...details,
                        rank: index + 1,
                        avgPerf: parseFloat(details.avgPerf || details.overall_score || 0),
                        // Scenarios might be stored as comma-separated string or array
                        scenarios: details.scenarios ? details.scenarios.split(',') : ["reasoning", "general"]
                    };
                });
                source = 'redis';
            } else {
                // Fallback to versioned key or file
                const cachedData = await redisClient.get('xiaoshazi:agent:rankings:v1');
                if (cachedData) {
                    agentData = JSON.parse(cachedData);
                    source = 'redis-v1';
                } else {
                    source = 'file-fallback';
                }
            }
        }
        
        // If Redis failed or was empty, use file fallback
        if (agentData.length === 0) {
            const filePath = path.join(__dirname, '../data/rankings.json');
            if (fs.existsSync(filePath)) {
                agentData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (source === 'memory') source = 'file';
            } else {
                agentData = MOCK_AGENTS;
            }
        }
    } catch (error) {
        console.error('Data retrieval error (falling back to memory):', error.message);
        agentData = MOCK_AGENTS;
    }

    if (scenario && scenario !== 'all') {
        agentData = agentData.filter(a => a.scenarios && a.scenarios.includes(scenario));
    }

    res.json({
        success: true,
        data: agentData,
        timestamp: Date.now(),
        source: source
    });
});

module.exports = router;
