const express = require('express');
const http = require('http');
const path = require('path');
const redis = require('redis');
const compression = require('compression');
const os = require('os');

// 创建Express应用
const app = express();

// Redis Client Configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let redisClient = null;
let isRedisAvailable = false;

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

async function initRedis() {
    try {
        redisClient = redis.createClient({ 
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 2) {
                        console.warn('⚠️ Redis connection failed after 3 retries, disabling Redis.');
                        return new Error('Redis connection failed');
                    }
                    return 500; // retry after 500ms
                }
            }
        });
        
        redisClient.on('error', (err) => {
            // Only log if it was previously available to avoid spamming
            if (isRedisAvailable) {
                console.warn('⚠️ Redis Error (Fallback to memory active):', err.message);
            }
            isRedisAvailable = false;
        });

        await redisClient.connect();
        console.log('✅ Redis connected successfully');
        isRedisAvailable = true;
        
        // Seed data if empty
        const count = await redisClient.exists('agent:rankings');
        if (count === 0) {
            console.log('🌱 Seeding Redis with mock data...');
            await redisClient.set('agent:rankings', JSON.stringify(MOCK_AGENTS));
            console.log('✅ Mock data seeded to Redis');
        }
    } catch (error) {
        console.warn('❌ Redis connection error, falling back to in-memory store:', error.message);
        isRedisAvailable = false;
    }
}

// 中间件配置
app.use(compression()); // 启用Gzip压缩
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// CORS Middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'client/dist')));

/*
// 基本路由 - 主页
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>HTTP测试网站 - 14514端口</title>
            <style>
                body {
                    font-family: 'Microsoft YaHei', Arial, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .container {
                    background: white;
                    border-radius: 15px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    padding: 40px;
                    max-width: 800px;
                    width: 100%;
                }
                h1 {
                    color: #333;
                    border-bottom: 3px solid #667eea;
                    padding-bottom: 10px;
                    margin-top: 0;
                }
                .status {
                    background: #f0f8ff;
                    border: 2px solid #007bff;
                    border-radius: 10px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .api-test {
                    background: #f8f9fa;
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 30px;
                }
                button {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    margin: 10px 5px;
                    transition: background 0.3s;
                }
                button:hover {
                    background: #5a67d8;
                }
                .result {
                    background: #e9ecef;
                    padding: 15px;
                    border-radius: 6px;
                    margin-top: 10px;
                    min-height: 50px;
                    font-family: monospace;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }
                .info-card {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 HTTP测试网站 - 14514端口</h1>
                
                <div class="status">
                    <h2>✅ 服务器状态：正常运行</h2>
                    <p>服务器已在14514端口启动，使用HTTP协议（通过IIS反向代理提供HTTPS）。</p>
                </div>
                
                <div class="info-grid">
                    <div class="info-card">
                        <h3>🔐 安全连接</h3>
                        <p>通过IIS反向代理提供HTTPS加密</p>
                        <p><strong>前端：</strong>IIS HTTPS 443</p>
                    </div>
                    <div class="info-card">
                        <h3>⚡ 动态API</h3>
                        <p>支持实时数据交互</p>
                        <p><strong>端口：</strong>14514 (HTTP)</p>
                    </div>
                    <div class="info-card">
                        <h3>📊 系统信息</h3>
                        <p>Node.js: ${process.version}</p>
                        <p>平台: ${process.platform}</p>
                    </div>
                </div>
                
                <div class="api-test">
                    <h2>🔧 API测试</h2>
                    <p>测试动态功能API端点：</p>
                    
                    <div>
                        <button onclick="testApi('time')">获取服务器时间</button>
                        <button onclick="testApi('health')">健康检查</button>
                        <button onclick="testApi('info')">服务器信息</button>
                        <button onclick="testApi('users')">模拟用户数据</button>
                    </div>
                    
                    <div class="result" id="apiResult">点击按钮测试API...</div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                    <h3>📝 使用说明</h3>
                    <ul>
                        <li>本服务通过IIS反向代理提供HTTPS访问</li>
                        <li>API端点支持GET和POST请求</li>
                        <li>Node.js应用运行在14514端口（HTTP）</li>
                    </ul>
                </div>
            </div>
            
            <script>
                async function testApi(endpoint) {
                    const resultEl = document.getElementById('apiResult');
                    resultEl.innerHTML = '请求中...';
                    
                    try {
                        const response = await fetch('/api/' + endpoint);
                        const data = await response.json();
                        resultEl.innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                    } catch (error) {
                        resultEl.innerHTML = '错误: ' + error.message;
                    }
                }
                
                // 页面加载时获取基本信息
                window.addEventListener('load', async () => {
                    try {
                        const response = await fetch('/api/info');
                        const data = await response.json();
                        console.log('服务器信息:', data);
                    } catch (error) {
                        console.log('获取信息失败:', error.message);
                    }
                });
            </script>
        </body>
        </html>
    `);
});
*/

// API路由 - 动态功能
app.get('/api/time', (req, res) => {
    res.json({
        success: true,
        timestamp: Date.now(),
        serverTime: new Date().toISOString(),
        timezone: 'Asia/Shanghai (UTC+8)',
        message: '当前服务器时间'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        load: os.loadavg(),
        timestamp: Date.now()
    });
});

app.get('/api/info', (req, res) => {
    res.json({
        server: 'HTTP测试服务器',
        version: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        port: 14514,
        protocol: 'HTTP',
        features: ['动态API', '静态文件服务', 'JSON支持']
    });
});

app.get('/api/users', (req, res) => {
    const users = [
        { id: 1, name: '测试用户1', email: 'user1@test.com', role: 'admin' },
        { id: 2, name: '测试用户2', email: 'user2@test.com', role: 'user' },
        { id: 3, name: '测试用户3', email: 'user3@test.com', role: 'user' }
    ];
    res.json({
        success: true,
        count: users.length,
        users: users,
        timestamp: Date.now()
    });
});

// POST API示例
app.post('/api/echo', (req, res) => {
    res.json({
        success: true,
        message: '数据已接收',
        receivedData: req.body,
        timestamp: Date.now()
    });
});

// Mock Agent Data Endpoint with Scenario Support
app.get('/api/agents', async (req, res) => {
    const { scenario } = req.query;
    
    // Configure proper Cache-Control headers
    res.set('Cache-Control', 'public, max-age=60, s-maxage=60');

    let agentData = [];
    let source = 'memory';

    try {
        if (isRedisAvailable) {
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
                // Fallback to old key or file
                const cachedData = await redisClient.get('agent:rankings');
                if (cachedData) {
                    agentData = JSON.parse(cachedData);
                    source = 'redis-legacy';
                } else {
                    source = 'file-fallback';
                }
            }
        }
        
        // If Redis failed or was empty, use file fallback
        if (agentData.length === 0) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, 'server/data/rankings.json');
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

// Catch-all route for SPA
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        error: '内部服务器错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员',
        timestamp: Date.now()
    });
});

// 创建HTTP服务器
const PORT = 14514;
const server = http.createServer(app);

// 初始化Redis并启动服务器
async function startServer() {
    await initRedis();
    
    server.listen(PORT, () => {
        console.log(`✅ Backend Server started on port ${PORT}`);
        console.log(`🌐 Local address: http://localhost:${PORT}`);
        console.log(`📊 API Endpoints:`);
        console.log(`   - GET http://localhost:${PORT}/api/time`);
        console.log(`   - GET http://localhost:${PORT}/api/health`);
        console.log(`   - GET http://localhost:${PORT}/api/agents`);
    });
}

startServer();

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
