# 测试框架任务模板

## 概述
本模板用于标准化测试框架的搭建和测试用例编写，确保代码质量可验证。

## 适用场景
- 测试框架配置
- 单元测试编写
- 集成测试搭建
- 测试覆盖率优化

## 任务结构

### 1. 依赖安装
```bash
npm install vitest @vitest/coverage-v8 --save-dev
# 或
npm install jest @types/jest ts-jest --save-dev
```

### 2. 文件清单

| 文件路径 | 功能描述 | 优先级 |
|----------|----------|--------|
| `vitest.config.js` | Vitest配置 | P0 |
| `tests/unit/` | 单元测试目录 | P1 |
| `tests/integration/` | 集成测试目录 | P2 |
| `tests/fixtures/` | 测试数据目录 | P2 |

### 3. 测试配置要求

#### Vitest配置示例
```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules', 'dist']
  }
})
```

#### 测试命名规范
- 单元测试: `*.test.js` 或 `*.spec.js`
- 集成测试: `*.integration.test.js`
- 测试数据: `*.fixture.js`

### 4. 验收标准
- [ ] 测试框架正常运行
- [ ] 单元测试覆盖率 > 70%
- [ ] 所有测试通过
- [ ] CI/CD集成测试通过

## 启动命令
```bash
claude --dangerous-skip-all \
  --system "你是OpenDoge科技部的Claude Code，负责测试框架搭建" \
  "执行测试框架任务：配置Vitest并编写单元测试"
```

## 最佳实践

### 测试结构
```javascript
import { describe, it, expect, beforeEach } from 'vitest'

describe('模块名称', () => {
  beforeEach(() => {
    // 初始化
  })

  it('should do something', () => {
    expect(result).toBe(expected)
  })
})
```

### 覆盖率目标
- 语句覆盖: > 80%
- 分支覆盖: > 70%
- 函数覆盖: > 80%
- 行覆盖: > 75%

## 关联模板
- 认证系统任务 (需要测试)
- 代码质量任务 (需要验证)
