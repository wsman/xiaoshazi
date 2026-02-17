# 代码质量任务模板

## 概述
本模板用于标准化代码质量检查和配置任务，确保项目代码符合规范。

## 适用场景
- ESLint配置创建/更新
- 代码规范检查
- Prettier配置
- 代码质量审计

## 任务结构

### 1. 文件清单

| 文件路径 | 功能描述 | 优先级 |
|----------|----------|--------|
| `.eslintrc.cjs` | ESLint配置文件 | P0 |
| `.eslintignore` | ESLint忽略规则 | P1 |
| `.prettierrc` | Prettier配置 | P1 |
| `.prettierignore` | Prettier忽略规则 | P2 |

### 2. ESLint配置要求

#### 环境
- Node.js/Express后端
- ES2022+语法支持
- CommonJS模块

#### 规则集
- ESLint recommended
- Node.js recommended
- Prettier recommended

#### 特殊配置
```javascript
// .eslintrc.cjs 示例
module.exports = {
  env: {
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'off'
  }
}
```

### 3. 验收标准
- [ ] ESLint检查无错误
- [ ] Prettier格式化一致
- [ ] CI/CD集成测试通过
- [ ] 配置文件注释完整

## 启动命令
```bash
claude --dangerous-skip-all \
  --system "你是OpenDoge科技部的Claude Code，负责代码质量管理" \
  "执行代码质量任务：创建ESLint和Prettier配置"
```

## 关联会话
- `b758f447` - ESLint主配置
- `1231d8ee` - ESLint配置变体
- `51bc3aae` - ESLint最小配置
- `99e833d9` - ESLint简单请求
