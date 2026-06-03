# AGENTS.md

## Overview

Single-page React + Vite app (no monorepo). Chinese UI with two independent modes:

- **黄大仙灵签**: default first screen. Randomly draws one of 100 Wong Tai Sin fortune sticks, shows local sign text, and can optionally call an OpenAI-compatible API from the browser for personalized interpretation.
- **人生 K 线**: legacy bazi (八字命理) workflow for generating "Life Destiny K-Line" charts via AI analysis data.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also runs TypeScript type-checking via `vite build`)
- `npm run preview` — preview production build

There are **no** lint, test, format, or typecheck scripts. `vite build` is the only verification step.

## Architecture

| Path | Role |
|---|---|
| `index.tsx` → `App.tsx` | Entry point and main layout |
| `components/DailyDivinationMode.tsx` | Default UI: Wong Tai Sin fortune stick draw, local sign display, optional online AI interpretation |
| `data/fortuneSticks.ts` | Local static data for 100 Wong Tai Sin fortune sticks: sign number, title, level, poem, story, and full interpretation |
| `services/fortuneService.ts` | Browser-side OpenAI-compatible client for online fortune-stick interpretation + localStorage config helpers |
| `components/ImportDataMode.tsx` | Life K-Line UI: 3-step wizard (input bazi → copy prompt → paste AI JSON) |
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
- **Default route state**: `App.tsx` initializes `pageMode` to `divination`, so the first screen is 黄大仙灵签. Users can switch to 人生K线 via the top tab.
- **Fortune-stick data is local**: `data/fortuneSticks.ts` contains 100 static sign records. Do not mix fortune-stick results into Life K-Line JSON export.
- **Online divination config is browser-local only**: API Key, base URL, and model are stored in `localStorage` under `lifekline_divination_api_config`; there is no backend persistence.
- **Online divination calls are browser-side**: `services/fortuneService.ts` sends OpenAI-compatible chat-completions requests directly from the user's browser. Debug logs intentionally print request body and model response to the browser console, but not the API key.
- **Default online model/base URL**: default model is `qwen3.7-plus`; default base URL is `https://dashscope.aliyuncs.com/compatible-mode/v1`. Full `/chat/completions` URLs are normalized.
- **Divination mode switching**: If complete online config exists, the app defaults to online divination mode. The config modal can switch back to local mode without deleting cached config.
- **Result behavior**: In the divination result view, `重新抽一签` returns to the question input screen instead of immediately drawing again.
- **Vite env loading**: `vite.config.ts` loads env with `loadEnv(mode, '.', '')` (no prefix filter). Prefers `API_KEY` over `VITE_API_KEY`.
- **Demo mode**: Set API key to `demo` to load `mock-data.json` instead of calling AI API (`services/geminiService.ts:27`).
- **`BaziForm.tsx` is not rendered** in the current `App.tsx` — it exists but the active Life K-Line flow uses `ImportDataMode` (copy-paste workflow). `BaziForm` has its own direct API call path with hardcoded default `apiBaseUrl`.
- **`API_STATUS` constant** in `constants.ts` acts as a manual kill switch (1=active, 0=maintenance).
- **tsconfig strict mode**: `noUnusedLocals` and `noUnusedParameters` are enabled — unused imports/params will fail `vite build`.
- **JSON extraction**: `geminiService.ts`, `fortuneService.ts`, and `ImportDataMode.tsx` parse AI responses by stripping markdown code blocks and finding the outermost `{...}`.
- **`base: './'`** in vite config — output uses relative paths for deployment flexibility.
- **Deploy target**: Vercel (`vercel.json` configured, `npm install` + `npm run build`).
- **`/index.css` missing**: `index.html:80` references `<link rel="stylesheet" href="/index.css">` but no such file exists. Build emits a harmless warning. All styling is via Tailwind CDN + inline `<style>`.

## Type System

All data flows through `types.ts`:
- `LifeDestinyResult` = `{ chartData: KLinePoint[], analysis: AnalysisData }`
- `KLinePoint` has OHLC-style fields (`open`, `close`, `high`, `low`, `score`, `reason`)
- `AnalysisData` has 9 scored dimensions + crypto-specific fields
- Scores are 0-10 scale; `AnalysisResult.tsx` auto-normalizes values > 10 to 10-point scale
- `FortuneStick` holds local divination data and local fallback text
- `DivinationApiConfig` holds browser-local online interpretation config
- `AiFortuneInterpretation` contains AI-generated `career`, `wealth`, `love`, `health`, `advice`, and `caution`
- `DivinationResult` keeps the selected `FortuneStick`, generation time, and optional AI interpretation
