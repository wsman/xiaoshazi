const redis = require('redis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const HF_DATA_URL_BASE = 'https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard/contents&config=default&split=train';

/**
 * Filter for trusted organizations and specific high-quality models
 */
function isValidModel(row) {
    const id = (row.fullname || "").toLowerCase();
    const whitelist = ['qwen/', 'deepseek-ai/', 'meta-llama/', 'google/', '01-ai/', 'mistralai/'];
    const keywords = ['claude', 'gemini', 'gpt-4', 'llama-3'];

    // Check whitelist
    const inWhitelist = whitelist.some(org => id.startsWith(org.toLowerCase()));
    if (inWhitelist) return true;

    // Check keywords
    const hasKeyword = keywords.some(keyword => id.includes(keyword.toLowerCase()));
    if (hasKeyword) return true;

    return false;
}

async function syncHF() {
    console.log('🚀 Starting HF Leaderboard Sync (Ever-Flowing Pipeline)...');
    
    const client = redis.createClient({ url: REDIS_URL });
    
    client.on('error', (err) => console.error('Redis Client Error', err));

    try {
        await client.connect();
        console.log('✅ Redis connected');

        // 0. Clear existing data to ensure high-quality whitelist-only data
        console.log('🧹 Cleaning existing leaderboard and metadata...');
        await client.del('leaderboard:overall');
        const existingKeys = await client.keys('agent:metadata:*');
        if (existingKeys.length > 0) {
            await client.del(existingKeys);
            console.log(`🗑️ Deleted ${existingKeys.length} old metadata keys`);
        }

        // 1. Fetch data in batches
        console.log('📡 Fetching data from HF API...');
        const allRows = [];
        const BATCH_SIZE = 100;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            console.log(`   Fetching rows ${offset}...`);
            try {
                const response = execSync(`curl -s -L "${HF_DATA_URL_BASE}&limit=${BATCH_SIZE}&offset=${offset}"`, { 
                    maxBuffer: 10 * 1024 * 1024,
                    timeout: 30000 // 30s timeout
                });
                const data = JSON.parse(response.toString());
                if (data.rows && data.rows.length > 0) {
                    allRows.push(...data.rows);
                    offset += data.rows.length;
                    
                    // Stop if we reached the end or a reasonable limit
                    if (data.rows.length < BATCH_SIZE || offset >= 5000) {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }
            } catch (fetchError) {
                console.warn(`⚠️ Batch at offset ${offset} failed, retrying once...`);
                try {
                    const retryResponse = execSync(`curl -s -L "${HF_DATA_URL_BASE}&limit=${BATCH_SIZE}&offset=${offset}"`, { 
                        maxBuffer: 10 * 1024 * 1024,
                        timeout: 60000 
                    });
                    const retryData = JSON.parse(retryResponse.toString());
                    if (retryData.rows && retryData.rows.length > 0) {
                        allRows.push(...retryData.rows);
                        offset += retryData.rows.length;
                        if (retryData.rows.length < BATCH_SIZE || offset >= 5000) hasMore = false;
                    } else {
                        hasMore = false;
                    }
                } catch (retryError) {
                    console.error(`❌ Permanent failure at offset ${offset}:`, retryError.message);
                    hasMore = false; // Stop fetching but continue with what we have
                }
            }
        }
        
        if (allRows.length === 0) {
            throw new Error('No rows found in HF data');
        }

        console.log(`📦 Filtering and Normalizing ${allRows.length} rows...`);

        const modelsProcessed = [];
        
        // Phase 1: Filter and Buffer in Memory
        allRows.forEach((item, index) => {
            const row = item.row;
            if (!isValidModel(row)) return;

            const id = row.fullname || `model-${index}`;
            const rawScore = parseFloat(row["Average ⬆️"] || row.average || 0);
            
            modelsProcessed.push({
                id: id,
                row: row,
                raw_score: rawScore
            });
        });

        if (modelsProcessed.length === 0) {
            console.log('⚠️ No models passed the filter criteria.');
            return;
        }

        // Phase 2: Calculate Global Max Score for Normalization
        const max_score = Math.max(...modelsProcessed.map(m => m.raw_score));
        console.log(`📊 Normalization Factor: max_score = ${max_score.toFixed(2)}`);

        // Phase 3: Normalize and Apply Bonuses
        const finalModels = modelsProcessed.map(m => {
            const id = m.id;
            const row = m.row;
            
            // 1. Normalization (0-50 -> 0-98)
            let normalizedScore = (m.raw_score / max_score) * 98.0;
            
            let reasoning = parseFloat(row["ARC"] || row.arc || row["BBH"] || 0);
            let general = parseFloat(row["MMLU"] || row.mmlu || row["MMLU-PRO"] || 0);
            
            // 2. Qwen-Specific bonus (Post-Normalization)
            if (id.toLowerCase().includes('qwen')) {
                if (reasoning > 30 && general > 25) {
                    console.log(`🎯 Qwen Bonus Applied to ${id} (+5%)`);
                    normalizedScore *= 1.05;
                }
            }

            // 3. Cap at 100
            const finalScore = Math.min(100, normalizedScore);

            return {
                ...m,
                overall_score: finalScore,
                reasoning: reasoning,
                general: general,
                tier: finalScore >= 90 ? "S" : finalScore >= 80 ? "A" : finalScore >= 70 ? "B" : "C"
            };
        });

        // Phase 4: Persist to Redis via Pipeline
        const pipeline = client.multi();
        const modelsForFallback = [];

        finalModels.forEach(m => {
            const modelData = {
                id: m.id,
                model: m.row.fullname || m.id,
                provider: m.id.split('/')[0] || 'Unknown',
                overall_score: m.overall_score.toFixed(2),
                reasoning: m.reasoning.toFixed(2),
                general: m.general.toFixed(2),
                last_updated: new Date().toISOString(),
                avgPerf: m.overall_score.toFixed(2),
                fullName: m.row.fullname || m.id,
                tier: m.tier,
                scenarios: "reasoning,general"
            };

            pipeline.hSet(`agent:metadata:${m.id}`, modelData);
            pipeline.zAdd('leaderboard:overall', {
                score: m.overall_score,
                value: m.id
            });
            
            modelsForFallback.push(modelData);
        });

        await pipeline.exec();
        console.log(`✅ Redis store updated with ${finalModels.length} normalized SOTA models`);

        // FALLBACK: Sync to rankings.json
        const filePath = path.join(__dirname, '../data/rankings.json');
        const rankingsFallback = modelsForFallback
            .sort((a, b) => b.overall_score - a.overall_score)
            .map((m, i) => ({
                id: i + 1,
                rank: i + 1,
                diff: 0,
                tier: m.tier,
                provider: m.provider,
                model: m.model,
                fullName: m.fullName,
                avgPerf: parseFloat(m.overall_score),
                peakPerf: parseFloat((m.overall_score * 1.05).toFixed(1)),
                samples: 1000,
                scenarios: ["reasoning", "general"]
            }));
        fs.writeFileSync(filePath, JSON.stringify(rankingsFallback, null, 2));
        console.log(`✅ Fallback file updated: ${filePath}`);

    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    } finally {
        await client.quit();
        console.log('👋 Redis connection closed');
    }
}

syncHF();
