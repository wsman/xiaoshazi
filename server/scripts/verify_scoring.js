const fs = require('fs');
const path = require('path');

const RANKINGS_PATH = path.join(__dirname, '../data/rankings.json');
const PROPRIETARY_PATH = path.join(__dirname, '../data/proprietary_models.json');
const COEFF_PATH = path.join(__dirname, '../data/agent_coefficients.json');

const AGENT_COEFFICIENTS = JSON.parse(fs.readFileSync(COEFF_PATH, 'utf8'));

function getAgenticMultiplier(modelName) {
    const name = modelName.toLowerCase();
    if (AGENT_COEFFICIENTS.high.patterns.some(p => name.includes(p.toLowerCase()))) {
        return AGENT_COEFFICIENTS.high.multiplier;
    }
    if (AGENT_COEFFICIENTS.mid.patterns.some(p => name.includes(p.toLowerCase()))) {
        return AGENT_COEFFICIENTS.mid.multiplier;
    }
    return AGENT_COEFFICIENTS.low.multiplier || 1.0;
}

function runMockSync() {
    console.log('🧪 Running Mock Sync to verify Agentic Scoring logic...');
    
    // Load existing data as base (simulating the ETL output)
    const rankings = JSON.parse(fs.readFileSync(RANKINGS_PATH, 'utf8'));
    
    // We should use the scores before they were normalized if possible, 
    // but here we'll just treat current avgPerf as the base score.
    
    const processed = rankings.map(item => {
        const multiplier = getAgenticMultiplier(item.model);
        const agenticScore = parseFloat((item.avgPerf * multiplier).toFixed(1));
        return {
            ...item,
            multiplier,
            agenticScore,
            avgPerf: agenticScore 
        };
    });

    const finalRankings = processed
        .sort((a, b) => b.avgPerf - a.avgPerf)
        .map((item, index) => {
            const normalizedAvg = item.avgPerf;
            const tier = normalizedAvg >= 90 ? "S" : normalizedAvg >= 80 ? "A" : normalizedAvg >= 70 ? "B" : normalizedAvg >= 60 ? "C" : "D";
            return {
                ...item,
                id: index + 1,
                rank: index + 1,
                tier: tier
            };
        });

    fs.writeFileSync(RANKINGS_PATH, JSON.stringify(finalRankings, null, 2));
    console.log('✅ Mock Sync complete. rankings.json updated with Agentic Scores.');
    
    // Print top 10 for verification
    console.log('\nTop 10 models (Agentic Performance):');
    finalRankings.slice(0, 10).forEach(m => {
        console.log(`${m.rank}. ${m.model} (${m.provider}) - Score: ${m.avgPerf} (Mult: ${m.multiplier})`);
    });
}

runMockSync();
