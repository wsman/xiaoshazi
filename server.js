const express = require('express');
const http = require('http');
const path = require('path');
const redis = require('redis');
const compression = require('compression');
const os = require('os');
const { Server } = require('socket.io');
const { exec } = require('child_process');
const fs = require('fs');
const cors = require('cors');

// Error handling middleware
const { 
    errorHandler, 
    notFoundHandler,
    handleUnhandledRejections,
    handleUncaughtExceptions 
} = require('./server/middleware/errorHandler');

// Winston Logger - Phase 1: Logging System
const logger = require('./server/utils/logger');

// Prometheus Metrics - Phase 1: Monitoring
const { 
    metricsMiddleware, 
    getMetrics, 
    getHealthData,
    updateRedisStatus,
    updateSocketConnections,
    register 
} = require('./server/metrics');

// API Routes - Modularized in Phase 4
const entropyRoutes = require('./server/routes/entropy');
const auditRoutes = require('./server/routes/audit');
const systemRoutes = require('./server/routes/system');
const usersRoutes = require('./server/routes/users');
const agentsRoutes = require('./server/routes/agents');
const authRoutes = require('./server/routes/auth');

// Old log function - keep for compatibility but use Winston internally
const LOG_FILE = process.env.LOG_FILE || '/tmp/xiaoshazi.log';

// 创建Express应用
const app = express();

// CORS 配置 - 从 '*' 收紧到指定域名
const ALLOWED_ORIGINS = [
  'http://localhost:5173',  // Vite 开发服务器
  'http://localhost:3000',  // 备用开发服务器
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

// 生产环境可以添加实际域名
if (process.env.ALLOWED_ORIGINS) {
  ALLOWED_ORIGINS.push(...process.env.ALLOWED_ORIGINS.split(','));
}

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ALLOWED_ORIGINS 
    : ALLOWED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 预检请求缓存 24 小时
};

app.use(cors(corsOptions));

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

// 获取OpenDoge工作区路径
// xiaoshazi位于 /home/wsman/OpenDoge/projects/xiaoshazi
// 所以__dirname是 /home/wsman/OpenDoge/projects/xiaoshazi
// OpenDoge根目录是 /home/wsman/OpenDoge
let OPENDOGE_ROOT = path.resolve(__dirname, '../..');

// 验证路径是否正确，如果不对则使用备用路径
if (!fs.existsSync(path.join(OPENDOGE_ROOT, 'AGENTS.md'))) {
    // 尝试备用路径
    const alternatePath = '/home/wsman/OpenDoge';
    if (fs.existsSync(path.join(alternatePath, 'AGENTS.md'))) {
        OPENDOGE_ROOT = alternatePath;
        console.log('✅ Using alternate OpenDoge path:', OPENDOGE_ROOT);
    }
}

// API Routes - 使用模块化路由 (Phase 4 重构)
app.use('/api', entropyRoutes);
function getSystemMetrics() {
    return {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        load: os.loadavg(),
        timestamp: Date.now()
    };
}

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
                logger.warn('⚠️ Redis Error (Fallback to memory active):', { error: err.message });
            }
            isRedisAvailable = false;
            updateRedisStatus(false);
        });

        await redisClient.connect();
        logger.info('✅ Redis connected successfully');
        isRedisAvailable = true;
        updateRedisStatus(true);
        
        // Seed data if empty - 使用版本化键名避免冲突
        const count = await redisClient.exists('xiaoshazi:agent:rankings:v1');
        if (count === 0) {
            console.log('🌱 Seeding Redis with mock data...');
            await redisClient.setEx('xiaoshazi:agent:rankings:v1', 1800, JSON.stringify(MOCK_AGENTS));
            console.log('✅ Mock data seeded to Redis (30分钟TTL)');
        }
    } catch (error) {
        logger.warn('❌ Redis connection error, falling back to in-memory store:', { error: error.message });
        isRedisAvailable = false;
        updateRedisStatus(false);
    }
    
    // 设置 Agents 路由的 Redis 客户端 (Phase 4 重构)
    agentsRoutes.setRedisClient(redisClient, isRedisAvailable);
}

// 缓存预热函数 - 30分钟缓存策略
async function warmUpCache() {
    if (!isRedisAvailable || !redisClient) {
        logger.info('⏭️ 缓存预热跳过: Redis不可用');
        return;
    }
    
    try {
        logger.info('🔥 开始缓存预热 (30分钟TTL)...');
        
        // 预热排行榜数据 - 使用唯一键名避免冲突
        const agentsPath = path.join(__dirname, 'server/data/rankings.json');
        if (fs.existsSync(agentsPath)) {
            const data = fs.readFileSync(agentsPath, 'utf8');
            await redisClient.setEx('xiaoshazi:agent:rankings:v1', 1800, data);
            logger.info('✅ 缓存预热完成: xiaoshazi:agent:rankings:v1 (30分钟)');
        }
        
        // 预热中国模型数据 - 使用唯一键名
        const cnModelsPath = path.join(__dirname, 'server/data/cn_models.json');
        if (fs.existsSync(cnModelsPath)) {
            const data = fs.readFileSync(cnModelsPath, 'utf8');
            await redisClient.setEx('xiaoshazi:cn_models:v1', 1800, data);
            logger.info('✅ 缓存预热完成: xiaoshazi:cn_models:v1 (5分钟)');
        }
        
        // 预热系统指标 - 短暂缓存
        const metrics = getSystemMetrics();
        await redisClient.setEx('xiaoshazi:system:metrics:v1', 300, JSON.stringify(metrics));
        logger.info('✅ 缓存预热完成: xiaoshazi:system:metrics:v1 (5分钟)');
        
    } catch (error) {
        logger.error('❌ 缓存预热失败:', { error: error.message });
    }
}

// 中间件配置
app.use(compression()); // 启用Gzip压缩
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// Rate Limiting - 通用限流
const { apiLimiter } = require('./server/middleware/rateLimiter');
app.use('/api/', apiLimiter);

// Phase 1: Prometheus Metrics Middleware
app.use(metricsMiddleware());

// Metrics endpoint (excluded from rate limiting)
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await getMetrics());
    } catch (err) {
        res.status(500).end(err.message);
    }
});

// Swagger/OpenAPI 文档
const swaggerUi = require('swagger-ui-express');
const { swaggerSpec } = require('./server/config/swagger');

// Swagger 文档端点 (JSON)
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { font-size: 2.5em; }
        .swagger-ui .info .description { font-size: 1.1em; line-height: 1.6; }
    `,
    customSiteTitle: '小沙子 API 文档',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true
    }
}));

// 认证路由 (已在顶部导入)
app.use('/api/auth', authRoutes);

// 审计路由 (Phase 4 重构)
app.use('/api/audit', auditRoutes);

// HTTP 缓存头优化 - 静态资源缓存1年
app.use((req, res, next) => {
    if (req.url.endsWith('.js') || req.url.endsWith('.css') || req.url.endsWith('.woff2') || req.url.endsWith('.png') || req.url.endsWith('.jpg')) {
        res.set('Cache-Control', 'public, max-age=31536000');
    }
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

// API路由 - 使用模块化路由 (Phase 4 重构)
app.use('/api', systemRoutes);
app.use('/api', usersRoutes);
app.use('/api', agentsRoutes);

// 错误处理中间件 - 使用统一的错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// Catch-all route for SPA - only root and static assets
// API routes are handled above, anything else falls through to 404
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

// 设置全局异常处理器
handleUnhandledRejections();
handleUncaughtExceptions();

// 创建HTTP服务器
const PORT = 14514;
const server = http.createServer(app);

// 初始化Redis并启动服务器
async function startServer() {
    await initRedis();
    await warmUpCache();
    
    // 创建 Socket.IO 服务器
    const io = new Server(server, {
        cors: {
            origin: process.env.NODE_ENV === 'production' 
                ? ALLOWED_ORIGINS 
                : ALLOWED_ORIGINS,
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // 事件驱动推送函数 - 仅在数据变化时推送
    function emitMetricsUpdate() {
        const metrics = getSystemMetrics();
        io.emit('system:metrics', metrics);
        return metrics;
    }

    // 监听客户端连接
    io.on('connection', (socket) => {
        logger.info('🔌 Client connected:', { socketId: socket.id });
        updateSocketConnections(io.engine.clientsCount);
        
        // 立即发送当前状态
        socket.emit('system:metrics', getSystemMetrics());
        
        // 客户端请求更新 - 按需推送
        socket.on('request:update', () => {
            logger.http(`📡 Client ${socket.id} requested update`);
            emitMetricsUpdate();
        });

        // 客户端订阅特定数据
        socket.on('subscribe:agents', () => {
            logger.http(`📡 Client ${socket.id} subscribed to agents`);
            socket.emit('agents:update', { source: 'client-subscribe', timestamp: Date.now() });
        });
        
        socket.on('disconnect', () => {
            logger.info('🔌 Client disconnected:', { socketId: socket.id });
            updateSocketConnections(io.engine.clientsCount);
        });
    });
    
    // 移除3秒轮询，改为事件驱动 + 5分钟定时同步
    // 1. 5分钟定时同步
    setInterval(() => {
        logger.http('🔄 Periodic 5-minute sync');
        emitMetricsUpdate();
    }, 300000); // 5分钟
    
    // 2. 数据变化时推送 (由外部调用emitMetricsUpdate())
    
    // 3. 客户端请求更新 (通过socket事件处理)
    
    server.listen(PORT, () => {
        logger.info(`✅ Backend Server started on port ${PORT}`);
        logger.info(`🌐 Local address: http://localhost:${PORT}`);
        logger.info(`🔌 WebSocket Server started`);
        logger.info(`📊 API Endpoints:`);
        logger.info(`   - GET http://localhost:${PORT}/api/time`);
        logger.info(`   - GET http://localhost:${PORT}/api/health`);
        logger.info(`   - GET http://localhost:${PORT}/api/agents`);
        logger.info(`   - GET http://localhost:${PORT}/api/entropy`);
        logger.info(`   - GET http://localhost:${PORT}/api/entropy/history`);
        logger.info(`   - GET http://localhost:${PORT}/metrics (Prometheus)`);
        logger.info(`   - WS  ws://localhost:${PORT}/socket.io/`);
    });
}

startServer();

// 优雅关闭
process.on('SIGTERM', () => {
    logger.info('正在关闭服务器...');
    server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
    });
});
