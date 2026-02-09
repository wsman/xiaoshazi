const http = require('http');

const PORT = 14514;
const CONCURRENT_REQUESTS = 100;
const TOTAL_REQUESTS = 1000;
const ENDPOINT = '/api/agents';

async function runLoadTest() {
    console.log(`🚀 Starting load test: ${TOTAL_REQUESTS} requests, ${CONCURRENT_REQUESTS} concurrency...`);
    
    let completed = 0;
    let successful = 0;
    let failed = 0;
    const startTime = Date.now();

    const sendRequest = () => {
        return new Promise((resolve) => {
            http.get(`http://localhost:${PORT}${ENDPOINT}`, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        successful++;
                    } else {
                        failed++;
                    }
                    completed++;
                    resolve();
                });
            }).on('error', (err) => {
                console.error(`Request error: ${err.message}`);
                failed++;
                completed++;
                resolve();
            });
        });
    };

    const workers = [];
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        workers.push((async () => {
            while (completed < TOTAL_REQUESTS) {
                await sendRequest();
            }
        })());
    }

    await Promise.all(workers);
    
    const duration = (Date.now() - startTime) / 1000;
    const rps = (TOTAL_REQUESTS / duration).toFixed(2);

    console.log('\n--- Load Test Results ---');
    console.log(`Total Duration: ${duration}s`);
    console.log(`Requests/sec: ${rps}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${failed}`);
    console.log('-------------------------\n');
}

runLoadTest().catch(console.error);
