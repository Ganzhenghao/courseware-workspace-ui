# Repository Guidelines

## 项目结构与模块组织

本仓库是 Vue 3、TypeScript 与 Vite 管理端项目。业务页面位于 `src/views/`，可插拔功能位于 `src/modules/`；接口定义集中在 `src/api/`，路由、状态和通用组件分别放在 `src/router/`、`src/stores/`、`src/components/`。全局样式与静态资源位于 `src/styles/`、`src/assets/`，无需构建处理的文件放在 `public/`。新增功能应按业务域聚合页面、接口和类型，避免把领域逻辑堆入通用组件。

## 构建、检查与本地开发

- `corepack prepare pnpm@10.17.1 --activate`：启用仓库指定的 pnpm 版本。
- `pnpm install --frozen-lockfile`：严格按锁文件安装依赖。
- `pnpm dev`：启动 Vite 开发服务器。
- `pnpm type-check`：运行 `vue-tsc` 类型检查。
- `pnpm lint`：运行 ESLint 并自动修复可修复问题。
- `pnpm format`：用 Prettier 格式化 `src/`。
- `pnpm build`：依次完成类型检查和生产构建；提交前必须执行。
- `pnpm preview`：本地预览生产构建结果。

要求 Node.js `>=20.19.0`。依赖只能使用 pnpm 管理，并同步提交 `pnpm-lock.yaml`。

## 编码风格与命名

遵循 `.editorconfig` 与 `.prettierrc.cjs`：UTF-8、LF、2 空格缩进、单引号、分号、最大行宽 130。组件文件使用 PascalCase（如 `LoginForm.vue`），页面入口使用 `index.vue`；组合式函数以 `use` 开头，变量和函数采用 camelCase，类型与接口采用 PascalCase。代码变量名保持英文，注释及面向用户的错误说明使用中文。

## 测试与验证

仓库当前未配置单元测试框架或覆盖率门槛。每次变更至少运行 `pnpm type-check`、`pnpm lint` 和 `pnpm build`。涉及页面或样式时，还需在 `pnpm dev` 下手工验证关键路径、响应式布局和异常状态，并在 PR 中记录验证范围；新增测试时使用 `*.spec.ts` 命名并就近放置。

## Commit 与 Pull Request

近期提交采用简洁中文主题，常用 `新增：`、`修复：`、`优化：`、`重构：` 前缀，例如 `修复：完善 WebSocket 重连逻辑`。一次提交只处理一个主题，禁止附加 AI 生成或共同作者标记。不要使用 `git add .` 或 `git add -A`；按路径精确暂存。环境配置文件（如 `.env*`）提交前必须获得明确确认。

PR 应说明背景、改动范围、验证命令和关联事项；界面变更附前后截图，配置或依赖变更说明兼容性与回滚方式。不要提交真实密钥、令牌或生产地址。
