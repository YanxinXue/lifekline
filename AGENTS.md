# AGENTS.md

## Overview

Single-page React + Vite app (no monorepo). Chinese UI with three independent modes:

- **今日黄历**: default first screen. Generates local almanac data for the selected date, with optional online AI interpretation for a user-provided matter.
- **黄大仙灵签**: randomly draws one of 100 Wong Tai Sin fortune sticks, shows local sign text, and can optionally call an OpenAI-compatible API from the browser for personalized interpretation.
- **人生 K 线**: bazi (八字命理) workflow for generating "Life Destiny K-Line" charts. If browser-local online AI config exists, it calls the OpenAI-compatible API directly; otherwise it falls back to the copy-prompt/paste-JSON workflow.

## Commands

- `npm run dev` — dev server
- `npm run build` — production build (also runs TypeScript type-checking via `vite build`)
- `npm run preview` — preview production build

There are **no** lint, test, format, or typecheck scripts. `vite build` is the only verification step.

## Deployment

Production deploy is handled by `deploy.sh` to the VPS behind `us.yanxinxue.com`.

- Public path: `https://us.yanxinxue.com/lifekline/`
- Static files are built locally with `npm run build`, then uploaded to `/var/www/lifekline`.
- Vite keeps `base: './'` so the static app can run correctly under the `/lifekline/` subpath.
- The deploy script manages only the Lifekline Caddy snippet at `/etc/caddy/conf.d/lifekline.caddy`.
- The shared top-level `/etc/caddy/Caddyfile` must import `/etc/caddy/conf.d/*.caddy`.
- Do not replace the whole Caddyfile with a single-project config. Other projects, including `/insurance-reminder/`, depend on their own snippets.
- If editing deployment, preserve existing snippets such as `/etc/caddy/conf.d/insurance-reminder.caddy`.
- Validate shell syntax with `bash -n deploy.sh` after changing the deploy script.

## Architecture

| Path | Role |
|---|---|
| `index.tsx` → `App.tsx` | Entry point and main layout |
| `components/AlmanacMode.tsx` | Default UI: local almanac display and optional online AI interpretation |
| `components/DailyDivinationMode.tsx` | Wong Tai Sin fortune stick draw, local sign display, optional online AI interpretation |
| `data/fortuneSticks.ts` | Local static data for 100 Wong Tai Sin fortune sticks: sign number, title, level, poem, story, and full interpretation |
| `services/fortuneService.ts` | Browser-side OpenAI-compatible client for online fortune-stick interpretation + localStorage config helpers |
| `components/ImportDataMode.tsx` | Life K-Line UI: input bazi, then either direct online AI generation or fallback copy-prompt/paste-JSON workflow |
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
- **Default route state**: `App.tsx` initializes `pageMode` to `almanac`, so the first screen is 今日黄历. Users can switch to 黄大仙灵签 or 人生K线 via the top tab.
- **Fortune-stick data is local**: `data/fortuneSticks.ts` contains 100 static sign records. Do not mix fortune-stick results into Life K-Line JSON export.
- **Online AI config is browser-local only**: API Key, base URL, and model are stored in `localStorage` under `lifekline_divination_api_config`; there is no backend persistence. The same config is reused by both Wong Tai Sin fortune sticks and Life K-Line.
- **Online divination calls are browser-side**: `services/fortuneService.ts` sends OpenAI-compatible chat-completions requests directly from the user's browser. Debug logs intentionally print request body and model response to the browser console, but not the API key.
- **Online Life K-Line calls are browser-side**: `components/ImportDataMode.tsx` calls `services/geminiService.ts` directly when usable online config exists. If config is missing or an online request fails, users can still switch to the manual prompt-copy flow.
- **Default online model/base URL**: default model is `qwen3.7-plus`; default base URL is `https://dashscope.aliyuncs.com/compatible-mode/v1`. Full `/chat/completions` URLs are normalized.
- **Divination mode switching**: If complete online config exists, the app defaults to online divination mode. The config modal can switch back to local mode without deleting cached config.
- **Result behavior**: In the divination result view, `重新抽一签` returns to the question input screen instead of immediately drawing again.
- **Vite env loading**: `vite.config.ts` loads env with `loadEnv(mode, '.', '')` (no prefix filter). Prefers `API_KEY` over `VITE_API_KEY`.
- **Demo mode**: Set API key to `demo` to load `mock-data.json` instead of calling AI API (`services/geminiService.ts:27`).
- **`BaziForm.tsx` is not rendered** in the current `App.tsx` — it exists but the active Life K-Line flow uses `ImportDataMode`. `BaziForm` has its own direct API call path with hardcoded default `apiBaseUrl`.
- **`API_STATUS` constant** in `constants.ts` acts as a manual kill switch (1=active, 0=maintenance).
- **tsconfig strict mode**: `noUnusedLocals` and `noUnusedParameters` are enabled — unused imports/params will fail `vite build`.
- **JSON extraction**: `geminiService.ts`, `fortuneService.ts`, and `ImportDataMode.tsx` parse AI responses by stripping markdown code blocks and finding the outermost `{...}`.
- **`base: './'`** in vite config — output uses relative paths for deployment flexibility.
- **Deploy target**: VPS at `https://us.yanxinxue.com/lifekline/` via `deploy.sh`. `vercel.json` may exist from an earlier hosting setup, but the current production path is the VPS/Caddy deployment.
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
