# 专注境 Focus Realm

<p align="center">
  <a href="README.md">中文</a> · <a href="README.en.md">English</a>
</p>

> 液态玻璃（Liquid Glass）风格的专注力监控系统 —— 融合番茄工作法、舒尔特方格、正念冥想、呼吸训练与摄像头专注监测的全功能专注力训练 Web 应用。

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6)](https://www.typescriptlang.org/)
[![oxlint](https://img.shields.io/badge/oxlint-1.80-FF6B6B)](https://oxc.rs/)
[![pnpm](https://img.shields.io/badge/pnpm-11-f9ad00)](https://pnpm.io/)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222222)](https://pages.github.com/)

🌐 在线演示：**https://xlongDev.github.io/focus-realm/**

---

## ✨ 功能特性

应用由 7 个功能模块组成，通过顶部/侧边液态玻璃导航栏切换：

| 模块 | 说明 |
| --- | --- |
| **首页 Home** | 总览仪表盘，快速进入各训练模块与当日专注概览。 |
| **番茄钟 Pomodoro** | 可自定义的番茄工作法（专注 / 短休 / 长休时长、轮次、自动开始），配套任务清单。 |
| **舒尔特方格 Schulte** | 经典注意力训练方格，支持不同维度与计时。 |
| **正念冥想 Meditation** | 引导式冥想与放松音频体验。 |
| **呼吸训练 Breathing** | 可视化呼吸节奏引导（如 4-7-8 / 箱式呼吸）。 |
| **摄像头专注监测 Camera** | 基于 **MediaPipe Tasks Vision** 的本地人脸/专注度检测，全部在浏览器端运行，无需上传。 |
| **设置 Settings** | 主题（深色 / 浅色）、音效、各模块偏好等个性化配置，状态由 Zustand 持久化。 |

整体采用深色液态玻璃（Liquid Glass）美学：毛玻璃面板、圆角胶囊导航、流畅的 Framer Motion 动效，并支持深 / 浅色主题切换（基于 `next-themes`）。

---

## 🧱 技术栈

- **框架**：[Next.js 16](https://nextjs.org/)（App Router，静态导出 `output: 'export'`）
- **UI**：React 19 + [Tailwind CSS v4](https://tailwindcss.com/) + shadcn/ui 风格组件
- **语言**：TypeScript 7（原生 Go 移植版本）
- **状态管理**：[Zustand](https://github.com/pmndrs/zustand)
- **计算机视觉**：[@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision)（摄像头专注监测，纯客户端推理）
- **动效**：Framer Motion 13
- **代码质量**：[oxlint](https://oxc.rs/)（取代 ESLint，零配置极速 lint）
- **包管理**：pnpm 11
- **部署**：GitHub Pages（GitHub Actions 自动构建并发布）

---

## 📋 环境要求

- **Node.js** ≥ 22（推荐 22 LTS）
- **pnpm** ≥ 11（`npm i -g pnpm` 或 `corepack enable`）

---

## 🚀 本地运行

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务器（默认 http://localhost:3000）
pnpm dev
```

开发服务器在根路径 `/` 提供服务（未应用子路径），可直接本地预览。

---

## 🛠 可用脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动 Next.js 开发服务器（端口 3000） |
| `pnpm build` | 生产构建并静态导出至 `out/` 目录（`next build --webpack`） |
| `pnpm start` | 使用 `serve` 预览 `out/` 静态产物（`npx serve out`） |
| `pnpm lint` | 使用 oxlint 进行代码检查（0 warning / 0 error 为目标） |

> 构建采用 webpack 编译器而非 Turbopack，以规避 Next 16 在静态导出 `/_global-error` 时的已知崩溃问题，保证导出稳定。

---

## 📦 构建与静态导出

本项目以**纯静态站点**方式部署，不依赖任何后端服务器：

```bash
pnpm build
# 产物输出到 ./out
# ├── index.html
# ├── 404.html
# ├── _next/
# └── ...
```

`next.config.ts` 中通过 `output: 'export'` 启用静态导出；图片优化已设为 `unoptimized`（Pages 无法运行 Next 图片服务）。

---

## ☁️ 部署到 GitHub Pages

部署完全自动化，无需手动操作：

1. 向 `main` 分支推送代码即触发 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)。
2. 工作流会：
   - 使用 pnpm 安装依赖（`--frozen-lockfile`）；
   - 以 `GITHUB_PAGES=true` 执行 `pnpm build`，自动为资源 URL 添加 `/focus-realm` 子路径前缀；
   - 将 `out/` 作为 Pages 产物上传并发布。
3. 仓库 **Settings → Pages** 的 Source 为 **GitHub Actions** 时，站点将在 1–2 分钟内上线。

📍 访问地址：**https://xlongDev.github.io/focus-realm/**

> **本地与线上路径差异**：本地 `pnpm dev` 运行在根路径 `/`；线上因 GitHub Pages 项目站点位于子路径 `/focus-realm`，构建时通过环境变量 `GITHUB_PAGES` 自动注入 `basePath`，无需手动修改代码。

---

## 📁 项目结构

```
focus-realm/
├── .github/workflows/
│   └── deploy.yml         # GitHub Pages 自动部署（含 lint / tsc / test 质量门）
├── public/                # 静态资源（favicon、logo、robots.txt）
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # 根布局（服务端组件）：字体、全局样式、深浅主题
│   │   ├── globals.css    # Tailwind v4 CSS-first 全局样式
│   │   └── (app)/         # 路由组（共享导航布局，对应 7 个页面）
│   │       ├── layout.tsx # 客户端布局：主题/音频副作用 + 极光背景 + AppShell
│   │       ├── page.tsx           # 首页 Home        → /
│   │       ├── pomodoro/page.tsx  # 番茄钟           → /pomodoro
│   │       ├── schulte/page.tsx    # 舒尔特方格       → /schulte
│   │       ├── meditation/page.tsx # 正念冥想         → /meditation
│   │       ├── breathing/page.tsx  # 呼吸训练         → /breathing
│   │       ├── camera/page.tsx     # 摄像头专注监测   → /camera（ML 懒加载）
│   │       └── settings/page.tsx   # 设置             → /settings
│   ├── components/
│   │   ├── layout/        # AppShell 应用外壳 / 导航
│   │   ├── modules/       # 七大功能模块组件
│   │   └── ui/            # 实际使用的基础组件
│   ├── hooks/             # 自定义 Hooks（主题、音频、MediaPipe 检测等）
│   └── lib/               # 工具、Zustand store、i18n、拆分后的音频/摄像头逻辑
│       ├── routes.ts          # pathFor / moduleFromPath 路由映射
│       ├── camera-math.ts     # 专注分 / EAR / 轮廓 SVG 路径（纯函数）
│       ├── use-face-focus.ts  # 摄像头 rAF 分析自定义 hook
│       ├── audio-engine.ts    # 音频上下文单例与原语
│       ├── sfx.ts             # 交互音效
│       ├── ambient-sounds.ts  # 环境音（含调度原语）
│       ├── music.ts           # 生成式背景音乐
│       ├── schulte.ts         # 舒尔特方格生成（纯函数）
│       ├── store.ts           # Zustand 全局状态
│       ├── i18n.ts            # 多语言（translate）
│       └── __tests__/         # vitest 单测
├── next.config.ts         # 静态导出 + Pages 子路径配置
├── vitest.config.mjs      # 单元测试配置
├── .oxlintrc.json         # oxlint 规则配置
└── package.json
```

---

## 🤝 贡献

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/your-feature`
3. 提交改动：`git commit -m "feat: your feature"`
4. 推送到分支：`git push origin feat/your-feature`
5. 发起 Pull Request

> 提交前请确保 `pnpm lint` 与 `pnpm build` 均通过。

---

## 📄 许可证

暂未指定许可证。如需开源，请添加 `LICENSE` 文件后再行发布。

---

<p align="center">Built with ❤️ by xlongDev</p>
