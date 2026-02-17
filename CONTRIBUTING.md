# 贡献指南

感谢您对本项目的兴趣！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 Bug 报告
- 💡 新功能建议
- 📝 文档改进
- 💻 代码贡献
- 🎨 UI/UX 改进

## 开发环境设置

### 前置要求

- Node.js >= 18
- pnpm >= 8

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/your-repo/xiaoshazi.git
   cd xiaoshazi
   ```

2. **安装依赖**
   ```bash
   # 根目录依赖
   npm install
   
   # 前端依赖
   cd client && pnpm install
   ```

3. **启动开发服务器**
   ```bash
   # 启动后端 (根目录)
   npm run dev
   
   # 启动前端 (新终端)
   cd client && pnpm dev
   ```

## 代码规范

### 前端 (Client)

- 使用 ESLint 进行代码检查
- 遵循 React 19 最佳实践
- 使用 TailwindCSS 进行样式开发
- 使用 TypeScript 进行类型检查

### 运行检查

```bash
# 代码检查
cd client && pnpm lint

# 运行测试
cd client && pnpm test:run

# 类型检查
cd client && npx tsc --noEmit
```

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范进行提交：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 类型 (Type)

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具变动

### 示例

```
feat(rankings): 添加新的场景筛选功能

fix(agentcard): 修复状态显示错误

docs(readme): 更新部署文档
```

## Pull Request 流程

1. **Fork** 项目仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 进行开发并提交: `git commit -m 'feat: add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 创建 **Pull Request**

### PR 要求

- [ ] 通过所有测试 (`pnpm test:run`)
- [ ] 通过代码检查 (`pnpm lint`)
- [ ] 更新相关文档
- [ ] PR 描述清晰说明改动内容

## 测试指南

### 添加新测试

1. **组件测试**: `src/components/*.test.jsx`
2. **Hook 测试**: `src/hooks/*.test.js`
3. **工具函数测试**: `src/utils/*.test.js`

### 测试命名

```javascript
describe('ComponentName', () => {
  it('should render correctly', () => { ... });
  it('should handle user interaction', () => { ... });
});
```

## 问题反馈

如果您发现 bug 或有建议，请创建 [Issue](https://github.com/your-repo/xiaoshazi/issues)。

---

感谢您的贡献！🎉
