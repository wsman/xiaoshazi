# AgentStats - AI Agent性能排行榜平台

AgentStats是一个现代化的AI Agent性能评估和可视化平台，基于HuggingFace Open LLM排行榜数据，提供实时的AI模型性能排名、多维度分析和成本效率洞察。平台采用三栏式现代化设计，支持零延迟用户体验。

> **注**: 本项目从原有的MythicStats DPS排名项目重构而来，现专注于AI Agent性能评估领域，已成功部署并运行在端口14514。

## 🚀 核心特性

### 1. 零延迟用户体验
- **预测性预取模式**: 通过`usePredictivePrefetch`钩子智能预判用户导航，实现瞬时加载
- **Web Worker计算**: 评分算法在后台线程执行，确保UI响应流畅
- **React 19 + Vite**: 现代化前端架构，支持HMR和快速构建

### 2. Qwen特定评分算法
- 为Qwen系列模型优化的定制化评分机制
- 多维度性能评估：推理、通用、编码等场景
- 实时性能数据分析和可视化

### 3. 熵仪表盘（EntropyDashboard）
- 独特的系统状态监控工具
- 可视化Agent决策过程和成本效益分析
- 帮助开发者识别性能瓶颈和优化机会

### 4. 实时排行榜
- 基于HuggingFace Open LLM排行榜的数据
- 支持565个AI模型的实时性能排名（已验证数据量）
- 多维度筛选：提供商、场景、层级
- 支持按场景筛选：编码(coding)、推理(reasoning)、创意(creative)等

### 5. 现代化三栏式界面
- 主内容区：Agent排行榜可视化
- 左右侧边栏：滚动经济指标和数据流
- 响应式设计，支持移动端适配
- 深色主题和动画过渡效果

## 🏗️ 技术架构

### 前端技术栈
- **框架**: React 19 (最新特性支持)
- **构建工具**: Vite 5.0 (极速开发体验)
- **动画库**: Framer Motion 12.33 (流畅交互动画)
- **国际化**: i18next + react-i18next (中英双语支持)
- **样式方案**: TailwindCSS 3.4 + PostCSS + Autoprefixer
- **路由**: React Router DOM 7.13
- **HTTP客户端**: Axios
- **工具库**: clsx, tailwind-merge

### 后端技术栈
- **服务器**: Express 5.2.1 (Node.js)
- **缓存**: Redis 5.10 (高性能数据存储)
- **压缩**: compression中间件 (Gzip支持)
- **端口**: 14514 (HTTP服务)

### 开发工具
- **代码检查**: ESLint 9.39 + TypeScript类型定义
- **CSS处理**: PostCSS + Autoprefixer
- **打包优化**: Vite构建优化

## 📊 数据源

项目使用**HuggingFace Open LLM排行榜**作为主要数据源：

- **排行榜数据**: `server/data/rankings.json` (565个AI模型排名)
- **中国模型数据**: `server/data/cn_models.json` (中文模型专有数据)
- **外部情报**: `server/data/external_intel.json` (第三方性能数据)
- **专有模型**: `server/data/proprietary_models.json` (商业模型信息)
- **Agent系数**: `server/data/agent_coefficients.json` (评分系数配置)

## 🚀 快速开始

### 已验证运行环境
- ✅ Node.js 22.22.0 (推荐18+)
- ✅ npm 9+ 
- ✅ Redis 5+ (可选，系统已实现优雅降级机制)
- ✅ 项目已成功部署并在端口14514运行

### 1. 克隆项目
```bash
git clone <repository-url>
cd xiaoshazi
```

### 2. 安装依赖
```bash
# 安装后端依赖 (Express 5.2.1 + Redis客户端)
npm install

# 安装前端依赖并构建
cd client
npm install
npm run build  # 构建Vite应用到client/dist目录
cd ..
```

### 3. 配置环境
项目已预配置，无需额外设置。如需自定义，可修改：
- `client/src/config.js` - API基础URL配置
- `server.js` - Redis连接配置

默认配置：
```javascript
// client/src/config.js (默认配置)
export const API_BASE_URL = '';  // 生产环境使用相对路径

// server.js Redis配置
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
```

### 4. 启动服务
```bash
# 启动后端服务器 (包含前端静态文件服务)
npm start
```

服务器将在 `http://localhost:14514` 启动，包含以下功能：
- ✅ API端点服务
- ✅ 静态文件服务 (Vite构建的前端应用)
- ✅ Redis缓存支持 (自动降级到内存存储)

### 5. 验证运行状态
```bash
# 验证API健康状态
curl http://localhost:14514/api/health

# 获取AI Agent排行榜数据 (565个模型)
curl http://localhost:14514/api/agents

# 按场景筛选数据
curl "http://localhost:14514/api/agents?scenario=coding"
```

### 6. 开发模式运行
```bash
# 前端开发服务器 (热重载)
cd client
npm run dev  # 运行在 http://localhost:5173

# 后端开发服务器 (另一终端)
npm run dev  # 运行在 http://localhost:14514
```

### Windows用户
可以直接运行 `start_en.bat` 批处理文件启动完整服务。

## 📁 项目结构

```
xiaoshazi/
├── server.js                 # 主服务器入口
├── package.json             # 后端依赖配置
├── start_en.bat            # Windows启动脚本
├── web.config              # IIS配置文件
│
├── client/                  # 前端应用
│   ├── src/
│   │   ├── App.jsx         # 主应用组件
│   │   ├── components/     # React组件
│   │   │   ├── AgentRankings.jsx       # 排行榜组件
│   │   │   ├── EntropyDashboard.jsx    # 熵仪表盘
│   │   │   ├── PerfBar.jsx             # 性能条
│   │   │   └── library/               # 组件库
│   │   │
│   │   ├── hooks/          # 自定义钩子
│   │   │   └── usePredictivePrefetch.js  # 预测性预取
│   │   │
│   │   ├── utils/          # 工具函数
│   │   │   ├── scoring.worker.js       # Web Worker评分
│   │   │   ├── providerColors.js       # 提供商颜色配置
│   │   │   └── modelNameFormatter.js   # 模型名称格式化
│   │   │
│   │   ├── locales/        # 国际化文件
│   │   └── assets/         # 静态资源
│   │
│   └── package.json        # 前端依赖配置
│
├── server/                  # 服务器相关
│   ├── data/               # 数据文件
│   └── scripts/            # 数据同步脚本
│
├── docs/                   # 项目文档
│   ├── ARCHITECTURE.md     # 架构设计
│   ├── INSTALL.md          # 安装指南
│   └── ROADMAP_2026Q1.md   # 开发路线图
│
├── design_docs/            # 设计文档
│   ├── mythicstats_analysis.md    # 原始项目分析
│   └── pivot_plan.md              # 项目转型计划
│
└── public/                  # 公共资源
```

## 🔧 API接口

### 基础端点
- `GET /api/time` - 服务器时间
- `GET /api/health` - 健康检查
- `GET /api/info` - 服务器信息
- `GET /api/users` - 模拟用户数据

### 核心业务端点
- `GET /api/agents` - 获取AI Agent排行榜
  - 查询参数: `scenario` (筛选场景: coding, reasoning, general, creative等)
  - 数据源: Redis缓存 → 文件系统 → 内存回退

- `POST /api/echo` - 数据回显测试

## 🎨 设计理念

### 1. 统一的单端口架构
- 生产环境：Express服务器同时提供API和静态文件
- 开发环境：前后端分离开发
- 优势：简化部署、避免CORS问题

### 2. 优雅降级策略
- Redis不可用时自动回退到文件系统
- 文件系统不可用时使用内存数据
- 确保服务在各类环境下的可用性

### 3. 响应式设计
- 移动端友好的自适应布局
- 深色主题减少视觉疲劳
- 类别的官方品牌色系标识

## 🔄 数据同步

项目包含自动数据同步脚本：

```bash
# 同步HuggingFace排行榜数据
node server/scripts/sync_hf.js

# 验证评分算法
node server/scripts/verify_scoring.js

# 同步外部情报数据
node server/scripts/sync_data.js
```

## 🧪 测试与验证

```bash
# 负载测试
node scripts/load_test.js

# 验证API端点
curl http://localhost:14514/api/health
curl http://localhost:14514/api/agents?scenario=coding
```

## 📈 性能优化

### 1. 缓存策略
- Redis内存缓存热门数据
- HTTP缓存头配置 (Cache-Control)
- 浏览器端Service Worker缓存

### 2. 计算优化
- Web Worker处理复杂评分算法
- 虚拟列表渲染大量数据
- 防抖和节流处理用户交互

### 3. 加载优化
- 代码分割和懒加载
- 预加载关键资源
- 图片和字体优化

## 🤝 贡献指南

1. Fork项目仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📝 代码规范

- 使用ESLint进行代码检查
- 遵循React Hooks规则
- 组件采用函数式写法
- 使用TypeScript类型定义（可选）

## 🐛 问题反馈

请通过GitHub Issues提交问题，包括：
1. 问题描述
2. 重现步骤
3. 期望行为
4. 实际行为
5. 环境信息

## 📄 许可证

本项目采用ISC许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢HuggingFace提供Open LLM排行榜数据
- 感谢MythicStats项目提供的设计灵感
- 感谢所有开源贡献者的支持

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目Issues页面]
- 邮箱: [请配置您的联系方式]

---

**AgentStats** - 为AI Agent性能评估提供专业的数据驱动解决方案 🚀
---

## 🧪 测试

本项目使用 Vitest 进行单元测试。

### 运行测试

```bash
# 安装依赖
cd client && pnpm install

# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 监听模式运行测试
pnpm test:watch
```

### 测试覆盖率目标

| 模块 | 目标覆盖 |
|------|----------|
| components | 85% |
| hooks | 80% |
| utils | 90% |

---

## 🔄 CI/CD

本项目使用 GitHub Actions 实现自动化 CI/CD 流程。

### 工作流程

1. **客户端测试**: 运行单元测试和语法检查
2. **服务端测试**: 验证服务器代码语法
3. **安全审计**: 检查依赖漏洞
4. **构建**: 生成生产环境文件
5. **部署**: 自动部署到生产环境（仅 main 分支）

### GitHub Actions 配置

配置文件位于 `.github/workflows/ci.yml`

---

## 📝 贡献指南

请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🚢 部署指南

请参阅 [DEPLOY.md](DEPLOY.md)

---

## 📄 许可证

ISC
