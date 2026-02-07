const express = require('express');
const http = require('http');
const path = require('path');

// 创建Express应用
const app = express();

// 中间件配置
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码请求体

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

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

// 404处理
app.use((req, res) => {
    res.status(404).json({
        error: '未找到路由',
        path: req.path,
        method: req.method,
        timestamp: Date.now()
    });
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

// 启动服务器
server.listen(PORT, () => {
    console.log(`✅ HTTP服务器已在端口 ${PORT} 启动`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`🔗 通过IIS反向代理访问: https://localhost`);
    console.log(`📊 API端点示例:`);
    console.log(`   - GET http://localhost:${PORT}/api/time`);
    console.log(`   - GET http://localhost:${PORT}/api/health`);
    console.log(`   - GET http://localhost:${PORT}/api/users`);
    console.log(`   - POST http://localhost:${PORT}/api/echo`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('正在关闭服务器...');
    server.close(() => {
        console.log('服务器已关闭');
        process.exit(0);
    });
});
