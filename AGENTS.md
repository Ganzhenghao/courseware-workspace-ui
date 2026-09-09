# AGENTS.md

本文件是 AI 智能体在本仓库工作的项目级指引。目标是基于当前源码完成范围明确、契约一致、可验证的前端改动。

## 1. 事实来源与适用边界

事实或约定冲突时，按以下优先级判断：

1. 用户当前任务中的明确要求
2. 当前分支源码、`package.json`、`pnpm-lock.yaml`、`.env*`、`vite.config.mts` 和部署配置
3. 本文件
4. `docs/` 下与任务直接相关的专题文档
5. 官网、README、历史会话和旧教程

官网和历史资料可能仍包含旧版依赖、Flyway、`VITE_API_URL` 或过时接口风格。凡是可能漂移的信息，必须先检索当前代码，不得凭经验覆盖仓库事实。

本仓库的默认修改边界是前端。可以只读查看同级后端仓库 `../courseware-workspace` 以核对 Controller、DTO、权限、字典、菜单、OSS 等契约；未经用户当次明确授权，不得修改后端、数据库或外部服务。

## 2. 强制工作流程

### 2.1 开始前

1. 执行 `git status --short`，识别并保留用户已有改动。
2. 阅读与任务直接相关的页面、组件、类型、API、Hook、Store 和配置；跨端字段必须同时核对后端定义。
3. 明确本次会影响的页面、接口、权限、字典、菜单、上传场景、环境变量和部署代理。
4. 若用户只要求分析、评审或方案，不得自行实施修改。

### 2.2 实施时

- 只修改任务所需文件，不顺手重构、格式化或清理无关代码。
- 不覆盖、回退、暂存或提交用户已有的无关改动。
- 优先复用当前目录、组件、Hook 和调用模式，不创建重复能力。
- 变量名、函数名使用英文；新增代码注释、错误信息和日志说明使用中文。
- 避免新增 `any`；优先定义准确的 TypeScript 类型。若第三方边界必须使用 `any`，应限制在最小范围并说明原因。
- 未经用户要求，不创建提交、不推送、不启动长期驻留服务。

### 2.3 完成后

1. 按变更风险执行最小且充分的验证。
2. 复查 `git diff` 和 `git status --short`，确认没有误改用户文件。
3. 最终说明列出：修改文件与行为、已执行验证、未执行验证及原因、后端配合或契约变化。

## 3. 项目与工具链

本项目是 Sz-Admin 管理端（包名 `sz-admin`），主要使用 Vue 3、Vite、TypeScript、Element Plus、Pinia 和 Vue Router。依赖版本以 `package.json` 与锁文件为准，不在本文重复维护容易漂移的完整版本表。

硬性工具要求：

- Node.js：`>=20.19.0`
- 包管理器：仅使用仓库声明的 `pnpm@10.17.1`
- 安装依赖优先使用 `pnpm install --frozen-lockfile`；确需更新依赖时才允许变更锁文件
- 不使用 npm 或 yarn 生成额外锁文件

常用命令：

```bash
pnpm install --frozen-lockfile  # 严格按锁文件安装依赖
pnpm dev                        # 启动开发服务，端口读取 VITE_PORT，当前默认 9848
pnpm type-check                 # TypeScript 类型检查
pnpm lint                       # ESLint 检查并自动修复
pnpm build                      # 类型检查 + 生产构建
pnpm build-only                 # 仅执行 Vite 构建
pnpm preview                    # 预览生产构建
pnpm format                     # 批量格式化 src/，仅在明确需要时执行
```

仓库当前未配置单元测试框架，不得声称运行过单元测试。`pnpm lint` 和 `pnpm format` 会改写文件，执行后必须复查 diff。

若需要在后端仓库执行 `mvn`、`gradle`、`java` 等命令，先检查后端项目根目录的 `.sdkmanrc`：

- 存在时，必须先加载 SDKMAN 并执行 `sdk env`。
- SDKMAN 或指定版本不可用时，应明确告知用户，不得静默改用系统默认 JDK。
- 不存在时，再依据后端 `pom.xml`、Gradle 配置和项目说明选择环境。

## 4. 目录与代码组织

| 目录                      | 职责                                      |
| ------------------------- | ----------------------------------------- |
| `src/api/types/`          | 按业务域组织的接口类型                    |
| `src/api/modules/`        | 存量页面及管理端 API                      |
| `src/views/`              | 简单 CRUD、系统管理和存量动态路由页面     |
| `src/modules/`            | 独立、可组合、可被 Edition 复用的业务模块 |
| `src/core/`               | 认证适配、模块注册、菜单解析等底座能力    |
| `src/editions/`           | 产品 Edition 的组合入口                   |
| `src/components/`         | 全局复用组件                              |
| `src/hooks/`              | 通用组合式能力                            |
| `src/stores/`             | Pinia 状态管理                            |
| `src/router/`             | 静态路由、动态路由和守卫                  |
| `src/directives/modules/` | `auth`、`copy` 等指令                     |
| `src/utils/`              | 通用工具、错误处理、OSS、HTML 清理等能力  |

新页面的放置原则：

- 简单 CRUD、系统管理或一次性页面放入 `src/views/<domain>/`，类型和 API 分别放入 `src/api/types/<domain>/`、`src/api/modules/<domain>/`。
- 独立领域、可选启用或需要派生产品复用的业务放入 `src/modules/<domain>/`，模块内组织 `register.ts`、`api/`、`types/` 和 `views/`。
- 不为追求形式统一而迁移存量 `src/views/system/*`。

开发 CRUD 前先查看 `src/components/` 与 `src/hooks/` 的实际 API，优先复用 `ProTable`、`SearchForm`、上传组件、`ImportExcel`、`useTable`、`useSelection`、`useHandleData`、`useDict`、`useDictOptions`、`useDownload` 和 `useDialogWidth`。

## 5. Edition、模块与动态路由

`src/editions/admin.ts` 负责默认 Edition：设置认证适配器、注册核心模块，并通过 `registerDiscoveredModules()` 自动发现 `src/modules/**/register.ts`。

模块使用 `defineModule()` 声明。后端菜单的 `component` 字段由 `resolveMenuComponent()` 依次按以下路径解析：

1. 模块注册表中的显式 `components` 映射
2. `/src/modules/<domain>/views/<rest>.vue` 约定路径
3. `/src/views/<componentPath>.vue` 存量目录兜底
4. 未命中时返回 `null`，动态菜单跳过并输出警告

新增模块时必须核对：

- `register.ts` 是否能被发现，模块名是否唯一
- 后端菜单 `component` 是否能命中页面
- API 模块前缀、Vite/Nginx 代理及后端 context path 是否一致
- 菜单、按钮、字典、模板和 OSS 场景是否需要后端初始化数据

出现 404 时，应沿“页面 API 路径 → HTTP client base → Vite/Nginx 代理 → 后端 context path 与 Controller”逐层检查。

## 6. API、响应与环境变量

### 6.1 HTTP client

`src/api/request.ts` 统一处理 Axios、Bearer token、业务错误和登录失效。`src/api/client.ts` 提供：

| Client                   | 默认 Base URL    |
| ------------------------ | ---------------- |
| `adminHttp`              | `/api/admin`     |
| `generatorHttp`          | `/api/generator` |
| `auditHttp`              | `/api/audit`     |
| `createModuleHttp(code)` | `/api/<code>`    |

API 文件只写 client base 之后的资源路径，不重复拼接 `/api/admin` 等前缀。页面组件不得直接散写 Axios 请求，类型、请求函数与页面调用应分层。

HTTP 方法和 URL 必须以目标模块当前 Controller 契约为准。仓库同时存在 GET、POST、PUT、DELETE 的存量接口；不得从旧官网推断，也不得脱离后端契约统一改写请求风格。新增或调整接口时，应明确核对方法、路径、参数位置和响应类型。

统一响应形态为 `{ code, message, data }`。`0000` 表示成功；`C105` 表示登录失效并进入统一清理流程；`C108`、`C110` 等业务错误由请求层统一处理，页面通常不得重复提示。

### 6.2 环境变量与代理

| 变量                           | 用途                             |
| ------------------------------ | -------------------------------- |
| `VITE_ADMIN_API_BASE`          | 管理端 API 前缀                  |
| `VITE_GENERATOR_API_BASE`      | 代码生成器 API 前缀              |
| `VITE_AUDIT_API_BASE`          | 审计 API 前缀                    |
| `VITE_API_CONTEXT_PATH`        | 动态模块公共 API 前缀            |
| `VITE_API_PROXY_TARGET`        | 开发环境代理目标                 |
| `VITE_SOCKET_URL`              | WebSocket 地址，缺失或为空时禁用 |
| `VITE_ADMIN_BYPASS_PERMISSION` | 是否为 admin 放行前端按钮权限    |

`VITE_MODULE_API_BASE` 只作为代码中的兼容回退；新增配置统一使用 `VITE_API_CONTEXT_PATH`。个人环境配置应放在已忽略的 `.env.development.local`，不得提交真实密钥、令牌或生产地址。

调整 API 前缀或部署路径时，同步核对 `.env*`、`src/api/client.ts`、`vite.config.mts`、`nginx/default.conf` 与后端契约。

## 7. 前端业务契约

### 7.1 通用编码与安全

- Vue 组件优先使用 `<script setup lang="ts">`。
- 表单弹窗放在页面的 `components/` 目录，宽度优先使用 `useDialogWidth`。
- 遵循 `.editorconfig` 和 `.prettierrc.cjs`：UTF-8、LF、2 空格、单引号、分号、最大行宽 130。
- 组件文件使用 PascalCase，页面入口使用 `index.vue`；组合式函数以 `use` 开头。
- SVG 图标放入 `src/assets/icons/`；不新增另一套图标注册机制。
- 富文本展示必须先通过 `sanitizeHtml` 清理。
- 页面展示字典值时使用字典能力，不硬编码字典项 ID 或重复维护映射。

### 7.2 权限与字典

- 按钮权限使用 `v-auth`，权限标识必须与后端菜单初始化数据一致。
- `VITE_ADMIN_BYPASS_PERMISSION=true` 且当前角色包含 `admin` 时，仅放行前端按钮；后端数据权限仍由服务端负责。
- 使用 `useDict()` 主动加载字典，使用 `useDictOptions()` 获取响应式选项。
- ProTable 字典列通过 `enum` 和 `fieldNames` 对齐 `codeName`、`id`、`callbackShowStyle`，具体结构以相关 Hook 与 Store 源码为准。

### 7.3 上传与 Excel

- 上传统一通过 `sceneCode` 指定 OSS 场景，不恢复已废弃的 `dir` 属性。
- 持久化字段保存 `objectKey`；`accessUrl` 仅用于展示或即时预览。具体组件的 `v-model`、`imageUrl`、`previewUrl` 契约以组件源码为准。
- Excel 导入优先使用全局 `ImportExcel`，导出使用 `useDownload`。
- 前端 `alias` 必须与后端 `@ExcelTemplate(alias = "...")` 完全一致。

### 7.4 WebSocket

- `VITE_SOCKET_URL` 缺失或为空时禁用连接。
- token 通过 WebSocket subprotocol 传递。
- 服务端 close code `4401` 表示鉴权失效，必须进入统一登出闭环且停止重连。
- 自定义频道在 `src/stores/modules/socket/channelHandlers.ts` 注册，未知频道通过 `socket.${channel}` 事件广播。
- 排障依次核对 URL、token、WebSocket 服务、频道名、Nginx Upgrade 头和代理超时。

### 7.5 跨端共同字段

修改以下任一字段时，必须核对前后端及初始化数据：

- 菜单 `component`
- 按钮权限标识
- 字典 `typeCode`
- Excel 模板 `alias`
- OSS `sceneCode`
- API context path 与模块前缀

雪花 ID 沿用当前 TypeScript 类型中的 `number` 约定，不在单次功能中自行改为 `string`；若后端契约调整，必须统一评估精度与兼容性。

## 8. 构建、部署与文档

生产镜像使用 Nginx，静态目录、监听端口和代理规则以 `Dockerfile`、`nginx/default.conf` 为准。部署相关改动必须同时核对：

- `.env.production` 与 `VITE_PUBLIC_PATH`
- `vite.config.mts` 的 base、代理和构建配置
- `/api/**` HTTP 代理
- `/socket` WebSocket 代理及 Upgrade 头
- 后端服务路径与 OSS 资源 `base-url`

新增文档统一放在本仓库 `docs/` 下。用户未指定更具体位置时，使用：

```text
docs/
└── <yyyy>_docs/
    └── <yyyy-mm-dd>-<功能或需求名>/
        ├── req_docs/
        ├── prototype/
        ├── process_docs/
        ├── integration_docs/
        └── sql/
```

只创建任务实际需要的子目录。SQL 文件按 `01_`、`02_` 顺序命名；不得声明数据库物理外键，关联完整性由应用层维护。需要后端配合时，在交付说明和 `integration_docs/` 文档中明确列出，但不得顺手修改后端。

## 9. 验证标准

| 变更类型                             | 至少执行                                                  |
| ------------------------------------ | --------------------------------------------------------- |
| 类型、API、普通 TS/Vue 逻辑          | `pnpm type-check`                                         |
| 较多 TS/Vue 文件或代码风格调整       | `pnpm lint`，并复查自动修复结果                           |
| 依赖、构建、路由、模块注册、环境变量 | `pnpm build`                                              |
| Vue SFC 样式、UI 布局或交互          | `pnpm build-only`，并通过 `pnpm dev` 浏览器验证关键路径   |
| API 前缀、WebSocket、上传、导入导出  | 核对环境变量、client、代理和后端契约                      |
| 仅文档                               | 检查 Markdown 结构、链接、最终 diff 和 `git diff --check` |

所有代码改动最后执行 `git diff --check`。不得把未执行、被跳过、仍在运行或仅静态检查的项目描述为验证通过。

## 10. Git 与交付

- 只有用户明确要求时才创建提交或推送。
- 提交前执行 `git status --short`，按文件路径精确暂存；禁止使用 `git add .`、`git add -A`。
- `.env*`、`*.yml`、`*.yaml`、`*.properties` 及其他疑似配置文件在纳入提交前，必须先获得用户确认。
- Commit message 使用简洁中文主题，可沿用 `新增：`、`修复：`、`优化：`、`重构：` 等项目惯例。
- Commit message 禁止添加 AI 生成标记或 AI 工具共同作者信息。
- 界面改动在 PR 或交付说明中附关键页面截图；配置、依赖和契约改动说明兼容性、后端配合点与回滚方式。
