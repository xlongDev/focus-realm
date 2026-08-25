# Focus Realm

<p align="center">
  <a href="README.en.md">English</a> · <a href="README.md">中文</a>
</p>

> A Liquid Glass focus-monitoring system — an all-in-one focus-training web app that combines the Pomodoro technique, the Schulte grid, mindfulness meditation, breathing exercises, and camera-based focus monitoring.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178c6)](https://www.typescriptlang.org/)
[![oxlint](https://img.shields.io/badge/oxlint-1.80-FF6B6B)](https://oxc.rs/)
[![pnpm](https://img.shields.io/badge/pnpm-11-f9ad00)](https://pnpm.io/)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-222222)](https://pages.github.com/)

🌐 Live demo: **https://xlongDev.github.io/focus-realm/**

---

## ✨ Features

The app consists of 7 feature modules, switched via the top/side Liquid Glass navigation bar:

| Module | Description |
| --- | --- |
| **Home** | Overview dashboard with quick access to each training module and a daily focus summary. |
| **Pomodoro** | Customizable Pomodoro technique (focus / short break / long break durations, rounds, auto-start) with a companion task list. |
| **Schulte Grid** | Classic attention-training grid with adjustable dimensions and timing. |
| **Meditation** | Guided meditation and relaxing audio experiences. |
| **Breathing** | Visualized breathing-pace guidance (e.g. 4-7-8 / box breathing). |
| **Camera Focus** | Local face / focus detection powered by **MediaPipe Tasks Vision** — runs entirely in the browser, no upload required. |
| **Settings** | Theme (dark / light), sound effects, and per-module preferences, persisted via Zustand. |

The overall aesthetic is dark Liquid Glass: frosted-glass panels, rounded pill navigation, smooth Framer Motion animations, and dark / light theme switching (via `next-themes`).

---

## 🧱 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, static export via `output: 'export'`)
- **UI**: React 19 + [Tailwind CSS v4](https://tailwindcss.com/) + shadcn/ui-style components
- **Language**: TypeScript 7 (native Go port)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Computer Vision**: [@mediapipe/tasks-vision](https://www.npmjs.com/package/@mediapipe/tasks-vision) (camera focus monitoring, fully client-side inference)
- **Animation**: Framer Motion 13
- **Code Quality**: [oxlint](https://oxc.rs/) (replaces ESLint, zero-config and blazing fast)
- **Package Manager**: pnpm 11
- **Deployment**: GitHub Pages (built and published automatically via GitHub Actions)

---

## 📋 Requirements

- **Node.js** ≥ 22 (22 LTS recommended)
- **pnpm** ≥ 11 (`npm i -g pnpm` or `corepack enable`)

---

## 🚀 Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start the dev server (default http://localhost:3000)
pnpm dev
```

The dev server serves at the root path `/` (no subpath applied), so you can preview locally right away.

---

## 🛠 Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server (port 3000) |
| `pnpm build` | Production build and static export to `out/` (`next build --webpack`) |
| `pnpm start` | Preview the `out/` static output with `serve` (`npx serve out`) |
| `pnpm lint` | Lint with oxlint (target: 0 warning / 0 error) |

> The build uses the webpack compiler instead of Turbopack to avoid a known Next 16 crash when statically exporting `/_global-error`, ensuring export stability.

---

## 📦 Build & Static Export

This project is deployed as a **fully static site** with no backend server dependency:

```bash
pnpm build
# Output goes to ./out
# ├── index.html
# ├── 404.html
# ├── _next/
# └── ...
```

`next.config.ts` enables static export via `output: 'export'`; image optimization is set to `unoptimized` (Pages cannot run the Next image service).

---

## ☁️ Deploy to GitHub Pages

Deployment is fully automated — no manual steps required:

1. Pushing to the `main` branch triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
2. The workflow will:
   - Install dependencies with pnpm (`--frozen-lockfile`);
   - Run `pnpm build` with `GITHUB_PAGES=true`, automatically prefixing asset URLs with the `/focus-realm` subpath;
   - Upload and publish `out/` as the Pages artifact.
3. Once the repository's **Settings → Pages** Source is set to **GitHub Actions**, the site goes live within 1–2 minutes.

📍 URL: **https://xlongDev.github.io/focus-realm/**

> **Local vs. production path difference**: locally `pnpm dev` runs at root `/`; in production, because the GitHub Pages project site lives under the `/focus-realm` subpath, the build injects `basePath` via the `GITHUB_PAGES` environment variable automatically — no manual code changes needed.

---

## 📁 Project Structure

```
focus-realm/
├── .github/workflows/
│   └── deploy.yml         # GitHub Pages auto-deploy (with lint / tsc / test quality gates)
├── public/                # Static assets (favicon, logo, robots.txt)
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── layout.tsx     # Root layout (server component): fonts, global styles, dark/light theme
│   │   ├── globals.css    # Tailwind v4 CSS-first global styles
│   │   └── (app)/         # Route group (shared nav layout, maps to 7 pages)
│   │       ├── layout.tsx # Client layout: theme/audio side-effects + aurora bg + AppShell
│   │       ├── page.tsx           # Home        → /
│   │       ├── pomodoro/page.tsx  # Pomodoro    → /pomodoro
│   │       ├── schulte/page.tsx    # Schulte Grid → /schulte
│   │       ├── meditation/page.tsx # Meditation  → /meditation
│   │       ├── breathing/page.tsx  # Breathing   → /breathing
│   │       ├── camera/page.tsx     # Camera Focus → /camera (ML lazy-loaded)
│   │       └── settings/page.tsx   # Settings    → /settings
│   ├── components/
│   │   ├── layout/        # AppShell app shell / navigation
│   │   ├── modules/       # The seven feature modules
│   │   └── ui/            # Base components actually in use
│   ├── hooks/             # Custom hooks (theme, audio, MediaPipe detection, etc.)
│   └── lib/               # Utilities, Zustand store, i18n, extracted audio/camera logic
│       ├── routes.ts          # pathFor / moduleFromPath route mapping
│       ├── camera-math.ts     # Focus score / EAR / contour SVG paths (pure functions)
│       ├── use-face-focus.ts  # Camera rAF analysis custom hook
│       ├── audio-engine.ts    # Audio context singleton & primitives
│       ├── sfx.ts             # Interactive sound effects
│       ├── ambient-sounds.ts  # Ambient sounds (with scheduling helpers)
│       ├── music.ts           # Generative background music
│       ├── schulte.ts         # Schulte grid generation (pure function)
│       ├── store.ts           # Zustand global state
│       ├── i18n.ts            # Internationalization (translate)
│       └── __tests__/         # vitest unit tests
├── next.config.ts         # Static export + Pages subpath config
├── vitest.config.mjs      # Unit test config
├── .oxlintrc.json         # oxlint rules config
└── package.json
```

---

## 🤝 Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: your feature"`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

> Before submitting, please make sure both `pnpm lint` and `pnpm build` pass.

---

## 📄 License

No license specified yet. If you intend to open-source it, please add a `LICENSE` file before publishing.

---

<p align="center">Built with ❤️ by xlongDev</p>
