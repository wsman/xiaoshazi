# 认证系统任务模板

## 概述
本模板用于标准化JWT认证系统的开发任务，确保代码质量和一致性。

## 适用场景
- JWT身份认证中间件开发
- JWT工具函数实现
- 访问令牌/刷新令牌管理
- 认证流程优化

## 任务结构

### 1. 依赖安装
```bash
npm install jsonwebtoken jose bcryptjs --save
```

### 2. 文件清单

| 文件路径 | 功能描述 | 优先级 |
|----------|----------|--------|
| `/server/middleware/auth.js` | JWT验证中间件 | P0 |
| `/server/utils/jwt.js` | JWT生成与验证工具 | P0 |
| `/server/routes/auth.js` | 认证路由 | P1 |
| `/server/config/auth.js` | 认证配置 | P2 |

### 3. 实现要求

#### JWT配置
- accessToken: 15分钟有效期
- refreshToken: 7天有效期
- 算法: HS256
- 环境变量: JWT_SECRET, REFRESH_SECRET

#### 中间件功能
- Token验证
- 用户身份提取
- 权限检查 (可选)

### 4. 验收标准
- [ ] 所有单元测试通过
- [ ] ESLint检查通过
- [ ] 代码文档完整
- [ ] 符合OpenDoge宪法规范

## 启动命令
```bash
claude --dangerous-skip-all \
  --system "你是OpenDoge科技部的Claude Code，负责开发认证系统" \
  "执行认证系统任务：创建JWT中间件和工具函数"
```

## 关联会话
- `ec92f40b` - JWT认证中间件
- `9a11bf6d` - JWT工具函数
