# 🔮 人生 K 线 + 黄大仙灵签

> **一个传统文化娱乐向单页应用：默认提供黄大仙灵签抽签，也可切换到人生 K 线命理可视化。**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/5lin/lifekline)

---

## ✨ 功能特点

1. **黄大仙灵签默认入口**: 打开应用默认进入灵签页，从 100 支签中随机抽取一签。
2. **本地确定性签文**: 本地内置签号、等级、签诗、典故和完整总解，不依赖后端接口。
3. **在线 AI 解签可选**: 可配置 OpenAI-compatible API，由浏览器直接生成事业、财运、感情、健康和行动建议。
4. **本地缓存配置**: API Key、Base URL、Model 只保存在当前浏览器 `localStorage`，不上传后端。
5. **人生 K 线独立 Tab**: 可切换到八字命理 K 线流程，用股票 K 线图展示 1-100 岁的人生运势起伏。
6. **AI 深度批断**: 人生 K 线支持性格、事业、财富、婚姻、健康、六亲、发展风水和 Web3 交易风格等多维度报告。

---

## 📝 使用方法

### 黄大仙灵签

1. **打开应用** - 默认进入“黄大仙灵签”页。
2. **输入问题（可选）** - 可填写想问的问题；不填则按综合今日运势解读。
3. **抽取今日灵签** - 随机抽取一支签，展示签号、等级、签诗、典故和总解。
4. **查看分项解读** - 本地模式显示本地基础建议；在线模式会调用 AI 生成个性化解读。
5. **重新抽签** - 点击“重新抽一签”会回到问题输入界面，再次点击才会重新抽取。

### 在线 AI 解签配置

右上角模式按钮可在本地/在线模式之间切换：

- 本地模式：不调用任何外部接口。
- 在线模式：需要配置 `API Base URL`、`Model`、`API Key`。
- 默认 Base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`
- 默认 Model：`qwen3.7-plus`
- 配置只保存在当前浏览器缓存，不会写入后端，也不会影响其他用户。
- 在线配置弹窗中可以切换回本地模式，且不会删除已缓存的配置。

### 人生 K 线

1. **切换 Tab** - 点击顶部“人生K线”。
2. **填写八字信息** - 输入四柱干支和大运信息。
3. **复制提示词** - 点击按钮复制完整提示词。
4. **发送给 AI** - 粘贴到 ChatGPT、Claude、Gemini 等任意 AI。
5. **导入结果** - 将 AI 返回的 JSON 数据粘贴回来。
6. **查看 K 线** - 生成完整的人生 K 线图和分析报告。

---

## 🚀 一键部署

### Vercel 部署（推荐）

点击下方按钮一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/lifekline)

### 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

---

## 🛠️ 技术栈

- **前端框架**: React 19 + Vite
- **UI 样式**: TailwindCSS
- **图表库**: Recharts
- **图标库**: Lucide React
- **AI 支持**: OpenAI-compatible API、ChatGPT、Claude、Gemini 等任意 AI
- **本地存储**: 浏览器 `localStorage`

---

## 📁 关键文件

| 文件 | 说明 |
|---|---|
| `App.tsx` | 顶层布局、Tab 切换、本地/在线灵签模式配置 |
| `components/DailyDivinationMode.tsx` | 黄大仙灵签抽签和结果展示 |
| `data/fortuneSticks.ts` | 100 支黄大仙灵签本地数据 |
| `services/fortuneService.ts` | 在线 AI 解签请求、配置读写和响应解析 |
| `components/ImportDataMode.tsx` | 人生 K 线复制提示词/导入 JSON 流程 |
| `components/LifeKLineChart.tsx` | 人生 K 线图表 |

---

## 📸 项目预览

![人生流年大运K线图](assets/1.png)
*(图1：人生流年大运 K 线走势图)*

![详细分析报告](assets/2.png)
*(图2：命理分析、币圈运势与风水建议)*

---

**免责声明**: 本项目仅供娱乐与传统文化研究，不构成医疗、法律、投资或人生重大决策建议。切勿迷信，请理性看待分析结果。
