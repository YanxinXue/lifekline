# AGENTS.md

## Overview

Single-page React + Vite app (no monorepo). Chinese UI for generating "Life Destiny K-Line" charts via AI analysis of bazi (八字命理) data.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also runs TypeScript type-checking via `vite build`)
- `npm run preview` — preview production build

There are **no** lint, test, format, or typecheck scripts. `vite build` is the only verification step.

## Architecture

| Path | Role |
|---|---|
| `index.tsx` → `App.tsx` | Entry point and main layout |
| `components/ImportDataMode.tsx` | Primary UI: 3-step wizard (input bazi → copy prompt → paste AI JSON) |
| `components/BaziForm.tsx` | Alternative form with direct API call (not used by default in App.tsx) |
| `components/LifeKLineChart.tsx` | Recharts candlestick chart for fortune visualization |
| `components/AnalysisResult.tsx` | Analysis cards grid with score bars |
| `services/geminiService.ts` | API client: calls OpenAI-compatible chat completions endpoint |
| `constants.ts` | System prompt for AI + `API_STATUS` flag |
| `types.ts` | All TypeScript interfaces and `Gender` enum |

## Key Quirks

- **Tailwind via CDN `<script>` tag** in `index.html`, not PostCSS. No `tailwind.config.js` exists.
- **Import map in `index.html`** pins esm.sh URLs for React 19, Recharts 3.x, etc. This is separate from npm deps.
- **No CSS files found** — all styling is Tailwind utility classes (via CDN) and inline styles in `index.html`'s `<style>` block.
- **Vite env loading**: `vite.config.ts` loads env with `loadEnv(mode, '.', '')` (no prefix filter). Prefers `API_KEY` over `VITE_API_KEY`.
- **Demo mode**: Set API key to `demo` to load `mock-data.json` instead of calling AI API (`services/geminiService.ts:27`).
- **`BaziForm.tsx` is not rendered** in the current `App.tsx` — it exists but the active flow uses `ImportDataMode` (copy-paste workflow). `BaziForm` has its own direct API call path with hardcoded default `apiBaseUrl`.
- **`API_STATUS` constant** in `constants.ts` acts as a manual kill switch (1=active, 0=maintenance).
- **tsconfig strict mode**: `noUnusedLocals` and `noUnusedParameters` are enabled — unused imports/params will fail `vite build`.
- **JSON extraction**: Both `geminiService.ts` and `ImportDataMode.tsx` parse AI responses by stripping markdown code blocks and finding the outermost `{...}`.
- **`base: './'`** in vite config — output uses relative paths for deployment flexibility.
- **Deploy target**: Vercel (`vercel.json` configured, `npm install` + `npm run build`).
- **`/index.css` missing**: `index.html:80` references `<link rel="stylesheet" href="/index.css">` but no such file exists. Build emits a harmless warning. All styling is via Tailwind CDN + inline `<style>`.

## Type System

All data flows through `types.ts`:
- `LifeDestinyResult` = `{ chartData: KLinePoint[], analysis: AnalysisData }`
- `KLinePoint` has OHLC-style fields (`open`, `close`, `high`, `low`, `score`, `reason`)
- `AnalysisData` has 9 scored dimensions + crypto-specific fields
- Scores are 0-10 scale; `AnalysisResult.tsx` auto-normalizes values > 10 to 10-point scale
