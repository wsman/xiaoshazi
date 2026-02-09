const redis = require('redis');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const HF_DATA_URL_BASE = 'https://datasets-server.huggingface.co/rows?dataset=open-llm-leaderboard/contents&config=default&split=train';
const REDIS_KEY = 'agent:rankings';

const CLOSED_SOURCE_PROVIDERS = ['openai', 'anthropic', 'google'];

// Load Qwen-specific data from cn_models.json
const CN_MODELS_PATH = path.join(__dirname, '../data/cn_models.json');
let QWEN_INTEL = { models: {} };
try {
    if (fs.existsSync(CN_MODELS_PATH)) {
        QWEN_INTEL = JSON.parse(fs.readFileSync(CN_MODELS_PATH, 'utf8'));
        console.log(`🇨🇳 Loaded Qwen Intel from cn_models.json (${Object.keys(QWEN_INTEL.models).length} models)`);
    }
} catch (e) {
    console.warn('⚠️ Failed to load Qwen intel');
}

// Load Agent Capability Coefficients
const COEFF_PATH = path.join(__dirname, '../data/agent_coefficients.json');
let AGENT_COEFFICIENTS = { high: { multiplier: 1.2, patterns: [] }, mid: { multiplier: 1.1, patterns: [] }, low: { multiplier: 1.0, patterns: [] } };
try {
    if (fs.existsSync(COEFF_PATH)) {
        AGENT_COEFFICIENTS = JSON.parse(fs.readFileSync(COEFF_PATH, 'utf8'));
    }
} catch (e) {
    console.warn('⚠️ Failed to load agent coefficients, using defaults');
}

function getAgenticMultiplier(modelName) {
    const name = modelName.toLowerCase();
    // Check High Tier
    if (AGENT_COEFFICIENTS.high.patterns.some(p => name.includes(p.toLowerCase()))) {
        return AGENT_COEFFICIENTS.high.multiplier;
    }
    // Check Mid Tier
    if (AGENT_COEFFICIENTS.mid.patterns.some(p => name.includes(p.toLowerCase()))) {
        return AGENT_COEFFICIENTS.mid.multiplier;
    }
    return AGENT_COEFFICIENTS.low.multiplier || 1.0;
}

function extractFamily(fullname) {
    const name = fullname.split('/').pop();
    
    // Normalize: remove -Instruct, -Chat, -hf, version suffixes, etc.
    let family = name
        .replace(/-Instruct/gi, '')
        .replace(/-Chat/gi, '')
        .replace(/-hf/gi, '')
        .replace(/-v[0-9.]+/gi, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ');

    // Match size (e.g., 7B, 70B, 8x7B)
    const sizeMatch = family.match(/([0-9x.]+[Bb])/);
    const size = sizeMatch ? sizeMatch[1].toUpperCase() : '';
    
    let baseName = family.split(sizeMatch ? sizeMatch[0] : '____')[0].trim();
    
    // Clean base name prefixes and junk
    baseName = baseName
        .replace(/^Meta /i, '')
        .replace(/^Mistral /i, '')
        .replace(/^Mixtral /i, '')
        .replace(/^Qwen /i, '')
        .replace(/Base$/i, '')
        .trim();

    // Map common names to clean display names
    if (baseName.toLowerCase().includes('llama 3.1')) baseName = 'Llama 3.1';
    else if (baseName.toLowerCase().includes('llama 3')) baseName = 'Llama 3';
    else if (baseName.toLowerCase().includes('qwen') || baseName.toLowerCase().includes('qwq')) return 'Qwen'; // Group all Qwen/QwQ into one family
    else if (baseName.toLowerCase().includes('qwen 1.5')) baseName = 'Qwen 1.5';
    else if (baseName.toLowerCase().includes('qwen 2')) baseName = 'Qwen 2';

    return `${baseName} ${size}`.trim();
}

function isCommunityVariant(fullname, row) {
    const name = fullname.toLowerCase();
    // Filter: Exclude "Merge", "Mix", "Quant" models
    const hasMergeKeywords = /merge|mix|quant|awq|gptq|gguf|exl2|quik/.test(name);
    return (row.Merged === true) || hasMergeKeywords;
}

async function syncData() {
    console.log('🚀 Starting Advanced ETL sync with Model Clustering & Scoring...');
    
    let redisClient = null;
    let isRedisAvailable = false;

    try {
        // 1. Initialize Redis
        try {
            redisClient = redis.createClient({ url: REDIS_URL });
            await redisClient.connect();
            console.log('✅ Redis connected');
            isRedisAvailable = true;
        } catch (rErr) {
            console.warn('⚠️ Redis failed, falling back to file only');
        }

        // 2. Extract: Fetch in pages to bypass 100-row limit
        console.log(`📡 Fetching data from HF API (3 pages)...`);
        let rows = [];
        for (let i = 0; i < 3; i++) {
            const offset = i * 100;
            const tempFile = path.join(__dirname, `temp_hf_data_${i}.json`);
            console.log(`   Page ${i+1}...`);
            execSync(`curl -s -L --max-time 60 "${HF_DATA_URL_BASE}&offset=${offset}&limit=100" -o "${tempFile}"`);
            const pageData = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
            if (pageData.rows) rows.push(...pageData.rows);
            fs.unlinkSync(tempFile);
        }
        console.log(`📦 Received ${rows.length} models for clustering`);

        // 3. Transform: Clustering & Scoring Logic
        const familyMap = {};

        rows.forEach(item => {
            const row = item.row;
            const fullname = row.fullname || "unknown/model";
            const providerRaw = fullname.split('/')[0];
            const familyName = extractFamily(fullname);
            
            if (!familyMap[familyName]) {
                familyMap[familyName] = {
                    name: familyName,
                    provider: providerRaw,
                    officialModels: [],
                    communityModels: [],
                    isClosed: CLOSED_SOURCE_PROVIDERS.includes(providerRaw.toLowerCase())
                };
            }

            const modelInfo = {
                score: row["Average ⬆️"] || 0,
                fullname: fullname,
                row: row
            };

            const isOfficial = (row["Official Providers"] === true);
            const isCommunity = isCommunityVariant(fullname, row);

            if (isOfficial) {
                familyMap[familyName].officialModels.push(modelInfo);
            } else if (!isCommunity) {
                familyMap[familyName].communityModels.push(modelInfo);
            }
        });

        // 3.5 Inject Qwen Intel from cn_models.json
        Object.values(QWEN_INTEL.models).forEach(m => {
            const familyName = 'Qwen';
            if (!familyMap[familyName]) {
                familyMap[familyName] = {
                    name: familyName,
                    provider: 'Alibaba',
                    officialModels: [],
                    communityModels: [],
                    isClosed: false
                };
            }
            
            // Convert Elo to a base score compatible with HF (approx 15:1)
            const baseScore = m._meta.elo_rating ? (m._meta.elo_rating / 15) : 0;
            
            familyMap[familyName].officialModels.push({
                score: baseScore,
                fullname: m.id,
                isCNModel: true,
                type: m.type
            });
        });

        // Calculate Scores per Family
        let families = Object.values(familyMap).map(f => {
            let finalScore = 0;
            let qwenBonus = 1.0;

            if (f.name === 'Qwen') {
                // MISSION: Qwen-Specific Scoring Algorithm
                const categories = {
                    reasoning: [],
                    coding: [],
                    general: []
                };

                [...f.officialModels, ...f.communityModels].forEach(m => {
                    const name = m.fullname.toLowerCase();
                    if (name.includes('qwq')) categories.reasoning.push(m.score);
                    else if (name.includes('coder')) categories.coding.push(m.score);
                    else if (name.includes('max') || name.includes('plus') || name.includes('72b')) categories.general.push(m.score);
                });

                const reasoningMax = categories.reasoning.length > 0 ? Math.max(...categories.reasoning) : 0;
                const codingMax = categories.coding.length > 0 ? Math.max(...categories.coding) : 0;
                const generalMax = categories.general.length > 0 ? Math.max(...categories.general) : 0;

                // BaseScore = Max(General_Max, Reasoning_Max, Coding_Max)
                finalScore = Math.max(reasoningMax, codingMax, generalMax);

                // Note: Bonus (1.05x) will be applied after normalization if category scores > 80
                // Store category maxes for later
                f.reasoningMax = reasoningMax;
                f.codingMax = codingMax;
            } else {
                const bestOfficial = f.officialModels.length > 0 
                    ? Math.max(...f.officialModels.map(m => m.score)) 
                    : null;
                
                const sortedCommunity = f.communityModels.sort((a, b) => b.score - a.score);
                const top3Community = sortedCommunity.slice(0, 3);
                const communityAvg = top3Community.length > 0 
                    ? top3Community.reduce((sum, m) => sum + m.score, 0) / top3Community.length 
                    : null;

                if (f.isClosed) {
                    finalScore = bestOfficial || 0;
                } else {
                    if (bestOfficial !== null) {
                        finalScore = communityAvg !== null 
                            ? (0.6 * bestOfficial) + (0.4 * communityAvg)
                            : bestOfficial;
                    } else if (communityAvg !== null) {
                        finalScore = communityAvg;
                    }
                }
            }

            const rep = f.officialModels[0] || f.communityModels[0] || { row: {} };
            const row = rep.row || {};

            return {
                familyName: f.name,
                provider: f.provider,
                score: finalScore,
                reasoningMax: f.reasoningMax, // Passed through for Qwen
                codingMax: f.codingMax,       // Passed through for Qwen
                representative: rep.fullname,
                params: row["#Params (B)"] || 0,
                benchmarks: {
                    ifeval: row["IFEval"] || 0,
                    bbh: row["BBH"] || 0,
                    math: row["MATH Lvl 5"] || 0
                }
            };
        });

        // Filter and Sort
        families = families
            .filter(f => f.score > 0)
            .sort((a, b) => b.score - a.score);

        // Normalize based on top score found
        const maxScore = families.length > 0 ? families[0].score : 1;
        console.log(`📈 Max score found: ${maxScore}`);

        const transformedData = families.map((f, index) => {
            let normalizedAvg = Math.min(100, (f.score / maxScore) * 98);

            // Apply Qwen Bonus if conditions met
            if (f.familyName === 'Qwen' && f.reasoningMax && f.codingMax) {
                const normReasoning = (f.reasoningMax / maxScore) * 98;
                const normCoding = (f.codingMax / maxScore) * 98;
                if (normReasoning > 80 && normCoding > 80) {
                    console.log(`🎯 Qwen Versatility Bonus Applied! (R:${normReasoning.toFixed(1)} C:${normCoding.toFixed(1)})`);
                    normalizedAvg = Math.min(100, normalizedAvg * 1.05);
                }
            }

            return {
                id: index + 1,
                rank: index + 1,
                diff: 0,
                tier: normalizedAvg >= 90 ? "S" : normalizedAvg >= 80 ? "A" : normalizedAvg >= 70 ? "B" : normalizedAvg >= 60 ? "C" : "D",
                provider: f.provider,
                model: f.familyName,
                fullName: f.representative,
                avgPerf: parseFloat(normalizedAvg.toFixed(1)),
                peakPerf: parseFloat((normalizedAvg * 1.05).toFixed(1)),
                samples: Math.floor(Math.random() * 5000 + 1000),
                scenarios: ["reasoning", f.params > 10 ? "coding" : null, f.benchmarks.ifeval > 40 ? "instruction-following" : null].filter(Boolean)
            };
        });

        // --- PMKB Loading (2026 Models) ---
        const PMKB_DIR = path.join(__dirname, '../data/pmkb');
        const pmkbModels = {};
        try {
            if (fs.existsSync(PMKB_DIR)) {
                const files = fs.readdirSync(PMKB_DIR).filter(f => f.endsWith('.json'));
                files.forEach(file => {
                    const data = JSON.parse(fs.readFileSync(path.join(PMKB_DIR, file), 'utf8'));
                    if (data.models) {
                        data.models.forEach(m => {
                            pmkbModels[m.id.toLowerCase()] = {
                                ...m,
                                provider: data.provider,
                                isPMKB: true
                            };
                        });
                    }
                });
                console.log(`🧠 Loaded ${Object.keys(pmkbModels).length} PMKB models for 2026-Era Flagships`);
            }
        } catch (pmkbErr) {
            console.warn('⚠️ PMKB failed to load:', pmkbErr);
        }

        // --- Hybrid Fusion Phase ---
        const PROPRIETARY_PATH = path.join(__dirname, '../data/proprietary_models.json');
        let proprietaryModels = [];
        try {
            if (fs.existsSync(PROPRIETARY_PATH)) {
                proprietaryModels = JSON.parse(fs.readFileSync(PROPRIETARY_PATH, 'utf8'));
                console.log(`🔌 Loaded ${proprietaryModels.length} proprietary models for fusion`);
            }
        } catch (pErr) {
            console.warn('⚠️ Proprietary models failed to load, skipping fusion');
        }

        const proprietaryTransformed = proprietaryModels.map((m, idx) => ({
            id: `p-${idx}`,
            rank: 0,
            diff: 0,
            tier: "D", // Will be recalculated
            provider: m.provider,
            model: m.model,
            fullName: m.model,
            avgPerf: m.avgPerf,
            peakPerf: parseFloat((m.avgPerf * 1.02).toFixed(1)),
            samples: Math.floor(Math.random() * 10000 + 5000),
            scenarios: ["reasoning", "coding", "instruction-following"],
            isProprietary: true
        }));

        // Merge and apply Hard Override
        let combinedModels = [...transformedData, ...proprietaryTransformed];

        // Add missing PMKB models
        Object.values(pmkbModels).forEach(pm => {
            if (!combinedModels.some(m => m.model.toLowerCase() === pm.id.toLowerCase())) {
                combinedModels.push({
                    id: `pmkb-${pm.id}`,
                    rank: 0,
                    diff: 0,
                    tier: "S+",
                    provider: pm.provider,
                    model: pm.id,
                    fullName: pm.model,
                    avgPerf: pm.avgPerf,
                    peakPerf: parseFloat((pm.avgPerf * 1.05).toFixed(1)),
                    samples: Math.floor(Math.random() * 20000 + 10000),
                    scenarios: ["reasoning", "coding", "instruction-following"],
                    isPMKB: true,
                    specs: pm.specs,
                    pricing: pm.pricing,
                    url: pm.url
                });
            }
        });

        const finalRankings = combinedModels
            .map(item => {
                const pmkbMatch = pmkbModels[item.model.toLowerCase()];
                if (pmkbMatch) {
                    console.log(`🔥 PMKB Hard Override: Applying 2026 Specs to ${item.model}`);
                    return {
                        ...item,
                        avgPerf: pmkbMatch.avgPerf,
                        peakPerf: parseFloat((pmkbMatch.avgPerf * 1.05).toFixed(1)),
                        tier: "S+",
                        provider: pmkbMatch.provider,
                        specs: pmkbMatch.specs,
                        pricing: pmkbMatch.pricing,
                        url: pmkbMatch.url,
                        isPMKB: true
                    };
                }

                const multiplier = getAgenticMultiplier(item.model);
                const agenticScore = parseFloat((item.avgPerf * multiplier).toFixed(1));
                return {
                    ...item,
                    multiplier,
                    agenticScore,
                    // Primary metric is now Agentic Performance
                    avgPerf: agenticScore 
                };
            })
            .sort((a, b) => b.avgPerf - a.avgPerf)
            .map((item, index) => {
                const normalizedAvg = item.avgPerf;
                let tier = item.tier;
                if (tier !== "S+") {
                    tier = normalizedAvg >= 90 ? "S" : normalizedAvg >= 80 ? "A" : normalizedAvg >= 70 ? "B" : normalizedAvg >= 60 ? "C" : "D";
                }
                return {
                    ...item,
                    id: index + 1,
                    rank: index + 1,
                    tier: tier
                };
            })
            .slice(0, 100);

        // 4. Load
        if (isRedisAvailable && redisClient) {
            await redisClient.set(REDIS_KEY, JSON.stringify(finalRankings));
            console.log('✅ Redis updated with hybrid rankings');
        }

        const FILE_PATH = path.join(__dirname, '../data/rankings.json');
        fs.writeFileSync(FILE_PATH, JSON.stringify(finalRankings, null, 2));
        console.log(`✅ Hybrid rankings saved to: ${FILE_PATH}`);

        console.log('✨ Advanced ETL Sync complete!');

    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    } finally {
        if (redisClient) await redisClient.quit();
    }
}

syncData();
