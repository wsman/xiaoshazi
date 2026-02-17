# 部署指南

本文档详细介绍 xiaoshazi 项目的部署流程。

## 部署架构

```
┌─────────────┐
│   CDN/WAF   │
└──────┬──────┘
       │
┌──────▼──────┐
│  Nginx/Proxy│
└──────┬──────┘
       │
┌──────▼──────┐
│  Node.js    │
│  (Express)  │
│  Port: 443  │
└──────┬──────┘
       │
┌──────▼──────┐
│    Redis     │
│   (Cache)   │
└─────────────┘
```

## 前置要求

- Node.js >= 18
- pnpm >= 8
- Redis (可选，用于缓存)
- Nginx (推荐用于生产环境)

## 本地构建

### 1. 安装依赖

```bash
# 根目录
npm install

# 前端
cd client && pnpm install
```

### 2. 构建生产版本

```bash
cd client && pnpm build
```

构建产物将生成在 `client/dist` 目录。

### 3. 启动生产服务器

```bash
# 使用 Node.js 直接运行
node server.js

# 或使用 PM2
pm2 start server.js --name xiaoshazi
```

## 生产环境部署

### 方式一：直接部署

1. **构建前端**
   ```bash
   cd client && pnpm build
   ```

2. **配置服务器**
   - 复制 `dist` 目录内容到服务器
   - 配置 Nginx 指向后端 API

3. **启动服务**
   ```bash
   node server.js
   ```

### 方式二：使用 Docker

创建 `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package*.json ./
COPY client/package*.json ./client/

# 安装依赖
RUN npm install
RUN cd client && pnpm install --frozen-lockfile

# 构建前端
RUN cd client && pnpm build

# 暴露端口
EXPOSE 443

# 启动服务
CMD ["node", "server.js"]
```

构建并运行:
```bash
docker build -t xiaoshazi .
docker run -d -p 443:443 xiaoshazi
```

### 方式三：使用 Systemd (Linux)

1. 创建服务文件 `/etc/systemd/system/xiaoshazi.service`:

```ini
[Unit]
Description=xiaoshazi Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/xiaoshazi
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

2. 启动服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable xiaoshazi
sudo systemctl start xiaoshazi
```

## Nginx 配置示例

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 前端静态文件
    location / {
        root /path/to/xiaoshazi/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API 代理
    location /api {
        proxy_pass http://localhost:443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 环境变量

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `PORT` | 服务器端口 | `443` |
| `REDIS_URL` | Redis 连接地址 | - |
| `NODE_ENV` | 运行环境 | `production` |

## 监控与日志

### PM2 监控

```bash
# 查看日志
pm2 logs xiaoshazi

# 查看状态
pm2 status

# 重启服务
pm2 restart xiaoshazi
```

### 健康检查

```bash
curl https://your-domain.com/api/health
```

## 性能优化

1. **启用 Redis 缓存**
   - 配置 `REDIS_URL` 环境变量
   
2. **静态资源 CDN**
   - 将 `client/dist` 部署到 CDN
   
3. **HTTP/2**
   - 启用 Nginx HTTP/2 支持

## 故障排除

### 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :443
   ```

2. **SSL 证书问题**
   - 确保证书文件路径正确
   - 检查证书权限

3. **前端资源加载失败**
   - 检查 Nginx 配置的 root 路径
   - 确认 dist 目录已正确部署

---

如有问题，请提交 [Issue](https://github.com/your-repo/xiaoshazi/issues)。
