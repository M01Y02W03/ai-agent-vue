# AI Agent Vue 前端应用

基于 **Vue 3 + TypeScript + Vite** 的智能问答系统前端，提供多模态 AI 对话、RAG 文档问答、工具调用、管理后台等功能，采用暗色主题与玻璃拟态设计风格。

## 技术栈

| 技术 | 版本 | 说明 |
|---|---|---|
| Vue | 3.5 | 前端框架（Composition API + `<script setup>`） |
| TypeScript | 5.8 | 类型系统（严格模式） |
| Vite | 7 | 构建工具 / 开发服务器 |
| Element Plus | 2.10 | UI 组件库（中文语言包） |
| Pinia | 3 | 状态管理 |
| Vue Router | 4.5 | 路由管理（HTML5 History 模式） |
| Axios | 1.11 | HTTP 客户端 |
| ECharts | 5.6 | 图表可视化 |
| Three.js | 0.178 | 3D / WebGL 渲染 |
| Socket.IO | 4.8 | WebSocket 实时通信 |
| markdown-it / marked | — | Markdown 渲染（双引擎） |
| highlight.js | 11.11 | 代码语法高亮 |
| DOMPurify | 3.2 | XSS 防护（HTML 净化） |
| @toast-ui/editor | 3.2 | 富文本 / Markdown 编辑器 |
| pdfjs-dist | 5.3 | 浏览器端 PDF 预览 |
| GSAP | 3.13 | 高性能动画库 |
| Sass | — | CSS 预处理器 |

## 项目结构

```
ai-agent-vue/
├── index.html                      # SPA 入口 HTML
├── package.json                    # 依赖配置
├── vite.config.ts                  # Vite 构建配置（代理 / 端口 / 全局常量）
├── tsconfig.json                   # TypeScript 根配置
├── .env                            # 基础环境变量
├── .env.development                # 开发环境变量
├── .env.production                 # 生产环境变量
├── public/                         # 静态资源（不经过 Vite 处理）
│   ├── logo.svg                    # 站点 Logo
│   └── ...
└── src/
    ├── main.ts                     # 应用入口（初始化 Vue / Router / Pinia / Element Plus）
    ├── App.vue                     # 根组件（暗色主题 + RouterView）
    ├── style.css                   # 全局样式（暗色主题 / 玻璃拟态）
    │
    ├── api/                        # API 接口模块
    │   ├── ai-chat.ts              # AI 对话 / RAG / 多模态 SSE 流式接口
    │   ├── dashboard-header.ts     # 管理后台接口（模型 / 用户 / 文档 / 审批）
    │   ├── dashboard-sidebar.ts    # 侧边栏接口（知识库 CRUD）
    │   ├── favorites.ts            # 收藏夹接口
    │   ├── hutool-captcha.ts       # 验证码接口
    │   ├── location.ts             # 省市区地址接口
    │   ├── tool.ts                 # 工具调用接口（对话 / 配置 / 统计）
    │   └── user.ts                 # 用户接口（头像 / 个人资料 / 认证）
    │
    ├── assets/                     # 静态资源（经过 Vite 处理）
    │   ├── png/                    # PNG 图片
    │   └── svg/                    # SVG 图标（AI / Spring / Redis / Ollama 等）
    │
    ├── components/                 # 公共组件（15 个）
    │   ├── Navbar.vue              # 顶部导航栏
    │   ├── BackgroundContainer.vue # 背景容器
    │   ├── StreamingTextRenderer.vue # SSE 流式文本渲染器
    │   ├── LoadingSpinner.vue      # 加载动画
    │   ├── ImagePreview.vue        # 图片预览
    │   ├── LocationSelector.vue    # 省市区三级联动选择器
    │   ├── PasswordResetDialog.vue # 密码重置弹窗
    │   ├── TimeRangeSelector.vue   # 时间范围选择器
    │   ├── PlaceholderImage.vue    # 占位图组件
    │   ├── FavoriteCard.vue        # 收藏卡片
    │   ├── FavoriteList.vue        # 收藏列表
    │   ├── AddToFavoritesDialog.vue # 添加收藏弹窗
    │   ├── EditFavoriteDialog.vue  # 编辑收藏弹窗
    │   ├── CategoryEditDialog.vue  # 分类编辑弹窗
    │   └── CategoryTreeNode.vue    # 分类树节点
    │
    ├── router/                     # 路由配置
    │   └── index.ts                # 路由表 + 鉴权守卫（未登录跳转 /login）
    │
    ├── stores/                     # Pinia 状态管理
    │   └── auth.ts                 # 认证状态（用户信息 / Token / 登录态 / 角色判断）
    │
    ├── types/                      # TypeScript 类型定义
    │   └── index.ts                # 业务接口类型
    │
    ├── utils/                      # 工具函数
    │   └── http.ts                 # Axios 实例工厂（请求拦截 / Token 注入 / 401 处理）
    │
    └── views/                      # 页面视图
        ├── home/
        │   └── Home.vue            # 首页（未登录展示页）
        ├── login/
        │   └── Login.vue           # 登录页（账号密码 / OAuth2）
        ├── register/
        │   └── Register.vue        # 注册页（邮箱验证码）
        ├── auth/
        │   └── OAuth2Callback.vue  # OAuth2 回调处理（GitHub / Gitee）
        ├── policy/
        │   └── PolicyTerms.vue     # 隐私政策 / 服务条款
        ├── user/
        │   ├── UserProfile.vue     # 个人资料页
        │   ├── UserFavorites.vue   # 用户收藏夹
        │   └── AIAvatarDialog.vue  # AI 头像生成弹窗
        ├── verificat/
        │   └── CaptchaVerification.vue # 图形验证码组件
        └── dashboard/
            ├── Dashboard.vue       # 主控制台布局（侧边栏 + 内容区）
            ├── MultiChat.vue       # 多模态 AI 对话（文本 + 图片，SSE 流式）
            ├── DocQARag.vue        # RAG 文档问答
            ├── ToolCallList.vue    # 工具调用列表
            ├── ToolChatContainer.vue # 工具对话容器
            ├── ToolConversationList.vue # 工具会话列表
            ├── UserKnowledgeBase.vue # 用户知识库管理
            └── admin/              # 管理后台页面（仅管理员可见）
                ├── UserManagement.vue     # 用户管理
                ├── ModelManagement.vue    # Ollama 模型管理
                ├── DocumentManagement.vue # 文档管理 / 审核
                ├── SystemMonitoring.vue   # 系统监控（ECharts）
                ├── AdminTodo.vue          # 审批待办
                └── ToolConfigDetail.vue   # 工具配置详情
```

## 环境要求

| 环境 | 版本 | 说明 |
|---|---|---|
| **Node.js** | 18+ | 推荐 LTS 版本，[下载地址](https://nodejs.org/) |
| **npm** | 9+ | 随 Node.js 自动安装 |
| **后端服务** | — | 需要先启动 [ai-agent-springboot](../ai-agent-springboot) 后端，默认 `http://localhost:8086` |

## 快速开始

### 1. 安装依赖

```bash
cd ai-agent-vue
npm install
```

### 2. 配置环境变量

开发环境默认配置即可使用，无需修改：

| 文件 | 关键配置 | 默认值 |
|---|---|---|
| `.env.development` | `VITE_API_BASE_URL` | `http://127.0.0.1:8086` |
| | `VITE_DEV_SERVER_PORT` | `3000` |
| | `VITE_DEV_SERVER_HOST` | `localhost` |
| `.env` | `VITE_OAUTH_CALLBACK_BASE_URL` | `http://localhost:3000` |

如需修改后端地址或端口，编辑 `.env.development`：

```bash
# 后端 API 地址
VITE_API_BASE_URL=http://127.0.0.1:8086

# 前端开发服务器端口
VITE_DEV_SERVER_PORT=3000
```

### 3. 启动开发服务器

```bash
npm run dev
```

浏览器自动打开 http://localhost:3000，即可看到首页。

> **前提：** 后端服务已启动在 `http://localhost:8086`，否则 API 请求会失败。

### 4. 构建生产版本

```bash
npm run build
```

产物输出到 `dist/` 目录，可直接部署到 Nginx 等静态服务器。

### 5. 预览生产构建

```bash
npm run preview
```

## 开发命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动开发服务器（热更新 + API 代理） |
| `npm run build` | TypeScript 类型检查 + 生产构建 |
| `npm run preview` | 本地预览生产构建产物 |

## 配置说明

### Vite 代理配置（vite.config.ts）

开发环境下，前端通过 Vite 内置代理将 API 请求转发到后端，避免跨域问题：

```
浏览器请求                    Vite 代理                      后端服务
─────────────────────────────────────────────────────────────────────
GET /api/user/profile    →   http://localhost:8086/user/profile
GET /oss/avatar.png      →   https://your-bucket.oss-cn-chengdu.aliyuncs.com/avatar.png
```

| 代理路径 | 目标 | 说明 |
|---|---|---|
| `/api/*` | `http://127.0.0.1:8086` | 后端 API（去掉 `/api` 前缀） |
| `/oss/*` | 阿里云 OSS 地址 | 文件资源代理 |

### 全局常量

Vite 在构建时注入以下全局常量（在 `vite.config.ts` 中定义）：

| 常量 | 默认值 | 说明 |
|---|---|---|
| `__API_BASE_URL__` | `http://127.0.0.1:8086` | 后端 API 基础地址 |
| `__OAUTH_CALLBACK_BASE_URL__` | 自动推断 | OAuth2 回调地址 |
| `__DEV_SERVER_PORT__` | `3000` | 开发服务器端口 |

### 环境变量优先级

```
.env                        # 所有环境共享
  ↓
.env.development            # 开发环境（npm run dev）
.env.production             # 生产环境（npm run build）
  ↓
系统环境变量                 # 最高优先级
```

Vite 要求客户端可访问的环境变量必须以 `VITE_` 开头。

## 页面路由

| 路径 | 页面 | 需要登录 | 说明 |
|---|---|---|---|
| `/` | Home | 否 | 首页，已登录自动跳转 Dashboard |
| `/login` | Login | 否 | 登录页，已登录自动跳转 Dashboard |
| `/register` | Register | 否 | 注册页 |
| `/policy` | PolicyTerms | 否 | 隐私政策 |
| `/oauth2/callback/:platform` | OAuth2Callback | 否 | OAuth2 回调（GitHub / Gitee） |
| `/dashboard` | Dashboard | **是** | 主控制台（所有功能入口） |

### 路由鉴权机制

```
用户访问 /dashboard
  ↓
路由守卫检查 localStorage 中是否存在 Token
  ↓ 无 Token → 跳转 /login
  ↓ 有 Token
调用 fetchUserProfile() 验证 Token 有效性
  ↓ 失效（401）→ 清除本地状态 → 跳转 /login
  ↓ 有效 → 放行，加载页面
```

## 功能模块

### 多模态 AI 对话（MultiChat）

- 支持文本 + 图片输入
- 基于 SSE（Server-Sent Events）的流式输出，打字机效果
- 可切换多种模型（Ollama 本地 / DashScope 云端）
- 对话历史持久化（MySQL）

### RAG 文档问答（DocQARag）

- 上传 PDF / Markdown 文档到知识库
- 文档自动向量化（Embedding）存入 Redis
- 基于检索增强生成的精准问答
- 引用文档片段溯源

### MCP 工具调用（ToolChat）

- 集成百度地图、图表生成等外部工具
- AI 自动判断是否需要调用工具
- 工具调用结果实时展示

### 管理后台（Admin）

- 用户管理（CRUD / 状态切换）
- Ollama 模型管理（在线拉取 / 删除）
- 文档审核（上架 / 下架）
- 系统监控（ECharts 可视化）

## 推荐开发工具

| 工具 | 说明 |
|---|---|
| [VS Code](https://code.visualstudio.com/) | 推荐编辑器 |
| [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) | VS Code 扩展（Vue 3 + TypeScript 支持，必装） |
| [Element Plus Snippets](https://marketplace.visualstudio.com/items?itemName=CherserWang.element-plus-snippets) | Element Plus 代码片段 |

## 常见问题

### npm install 安装慢

```bash
# 切换淘宝镜像
npm config set registry https://registry.npmmirror.com

# 或使用 cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

### 开发服务器启动后页面空白

检查后端服务是否已启动。前端 API 请求通过 Vite 代理转发到 `http://localhost:8086`，后端未启动时所有接口会报错。

### 构建时 TypeScript 类型报错

```bash
# 单独运行类型检查
npx vue-tsc --noEmit
```

如需跳过类型检查直接构建（不推荐）：

```bash
npx vite build
```

### OAuth2 登录回调失败

确保 `.env` 中的 `VITE_OAUTH_CALLBACK_BASE_URL` 与 OAuth2 应用配置的回调地址一致：

```bash
# .env
VITE_OAUTH_CALLBACK_BASE_URL=http://localhost:3000
```

## 许可证

[MIT License](../LICENSE)
