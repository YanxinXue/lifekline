import {
  DivinationApiConfig,
  FortuneDimension,
  FortunePeriodContext,
  ResolvedBaziProfile,
  ShortTermFortuneResult,
} from '../types';
import { buildTimelineRanges } from './fortunePeriodCalculator';

const DISCLAIMER = '传统命理解读仅供文化参考，不构成医疗、投资、法律或其他专业建议。';
const VALID_TRENDS = new Set(['up', 'stable', 'volatile', 'cautious']);

const clampScore = (value: unknown, fallback = 50) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Math.round(Math.min(100, Math.max(0, Number.isFinite(number) ? number : fallback)));
};

const normalizeText = (value: unknown, fallback: string) => (
  typeof value === 'string' && value.trim() ? value.trim() : fallback
);

const normalizeList = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .map(item => item.trim())
    .slice(0, 3);
  return items.length ? items : fallback;
};

const normalizeDimension = (value: unknown, fallbackTitle: string): FortuneDimension => {
  const dimension = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    score: clampScore(dimension.score),
    summary: normalizeText(dimension.summary, `${fallbackTitle}趋势暂无明确结论。`),
    advice: normalizeText(dimension.advice, '保持稳健节奏，结合现实情况独立判断。'),
  };
};

const extractJsonObject = (content: string) => {
  let jsonContent = content.trim();
  const codeBlock = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) {
    jsonContent = codeBlock[1].trim();
  } else {
    const start = jsonContent.indexOf('{');
    const end = jsonContent.lastIndexOf('}');
    if (start >= 0 && end > start) jsonContent = jsonContent.slice(start, end + 1);
  }
  return JSON.parse(jsonContent) as unknown;
};

export const normalizeShortTermFortuneResult = (
  raw: unknown,
  context: FortunePeriodContext,
): ShortTermFortuneResult => {
  if (!raw || typeof raw !== 'object') throw new Error('AI 返回内容不是有效对象。');
  const data = raw as Record<string, unknown>;
  const rawTimeline = Array.isArray(data.timeline) ? data.timeline : [];
  const timelineRanges = buildTimelineRanges(context);

  return {
    period: context,
    overallScore: clampScore(data.overallScore),
    trend: typeof data.trend === 'string' && VALID_TRENDS.has(data.trend)
      ? data.trend as ShortTermFortuneResult['trend']
      : 'stable',
    summary: normalizeText(data.summary, '本周期整体以稳健观察、顺势调整为宜。'),
    career: normalizeDimension(data.career, '事业'),
    wealth: normalizeDimension(data.wealth, '财运'),
    relationship: normalizeDimension(data.relationship, '感情'),
    health: normalizeDimension(data.health, '健康'),
    timeline: timelineRanges.map((dateRange, index) => {
      const item = rawTimeline[index] && typeof rawTimeline[index] === 'object'
        ? rawTimeline[index] as Record<string, unknown>
        : {};
      return {
        dateRange,
        score: clampScore(item.score),
        title: normalizeText(item.title, context.type === 'week' ? '当日趋势' : '阶段趋势'),
        analysis: normalizeText(item.analysis, '结合现实安排稳步推进，避免仅凭运势判断。'),
      };
    }),
    opportunities: normalizeList(data.opportunities, ['关注可验证、可执行的小机会。']),
    risks: normalizeList(data.risks, ['避免冲动决策和过度承诺。']),
    actions: normalizeList(data.actions, ['先确认现实条件，再安排重要行动。']),
    disclaimer: DISCLAIMER,
  };
};

export const parseShortTermFortuneContent = (content: string, context: FortunePeriodContext) => (
  normalizeShortTermFortuneResult(extractJsonObject(content), context)
);

export const buildShortTermFortunePrompt = (
  profile: ResolvedBaziProfile,
  context: FortunePeriodContext,
) => {
  const timelineRanges = buildTimelineRanges(context);
  const periodName = context.type === 'week' ? '周运' : '月运';
  return `请根据以下已经由本地程序确定的八字与周期数据，生成${periodName}传统命理解读。

【四柱】
姓名：${profile.name || '未提供'}
性别：${profile.gender === 'Male' ? '男' : '女'}
年柱：${profile.yearPillar}
月柱：${profile.monthPillar}
日柱：${profile.dayPillar}
时柱：${profile.hourPillar}

【确定性周期数据】
${JSON.stringify(context, null, 2)}

【固定时间轴】
${JSON.stringify(timelineRanges)}

规则：
1. 不得重新计算、修改或覆盖日期、节气、干支、大运、十神、藏干、五行计数、合冲刑害和时间轴。
2. 所有评分使用 0-100 的相对趋势指数，不得解释为概率或保证。
3. 事业、财运、感情、健康必须给出克制、可执行的现实建议。
4. 财运不得鼓励加杠杆、追涨杀跌或保证收益；健康不得诊断疾病。
5. timeline 必须严格按固定时间轴的顺序和数量输出；dateRange 可省略，系统会使用本地时间轴。
6. 分析顺序固定为原命局 → 大运 → 流年 → 流月 → 流日；小周期结论不得脱离上层背景。
7. 五行计数只是天干和藏干的出现次数，不得直接据此判断“缺什么”或喜用神；旺衰、格局和喜忌必须使用倾向性表述。
8. 优先引用 baziInteractions 中已经列出的关系作为依据，不得发明不存在的合冲刑害。
9. 只返回纯 JSON，不要返回 Markdown 或解释文字。

JSON 结构：
{
  "overallScore": 68,
  "trend": "up | stable | volatile | cautious",
  "summary": "周期总评",
  "career": { "score": 70, "summary": "事业趋势", "advice": "行动建议" },
  "wealth": { "score": 60, "summary": "财运趋势", "advice": "行动建议" },
  "relationship": { "score": 65, "summary": "感情趋势", "advice": "行动建议" },
  "health": { "score": 62, "summary": "健康趋势", "advice": "生活方式建议" },
  "timeline": [
    { "score": 65, "title": "节点标题", "analysis": "简洁分析" }
  ],
  "opportunities": ["机会一", "机会二", "机会三"],
  "risks": ["风险一", "风险二", "风险三"],
  "actions": ["行动一", "行动二", "行动三"]
}`;
};

const normalizeChatCompletionsUrl = (baseUrl: string) => {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`;
};

const readStream = async (response: Response, onProgress?: (message: string) => void) => {
  if (!response.body) throw new Error('当前浏览器不支持读取流式响应。');
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let content = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';
    for (const line of lines) {
      const payload = line.trim().replace(/^data:\s*/, '');
      if (!line.trim().startsWith('data:') || !payload || payload === '[DONE]') continue;
      try {
        const data = JSON.parse(payload);
        const text = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || '';
        if (text) {
          content += text;
          onProgress?.(`正在接收分析，已收到 ${content.length} 字`);
        }
      } catch {
        // Ignore non-JSON keep-alive lines.
      }
    }
  }
  return content;
};

export const generateShortTermFortune = async (
  profile: ResolvedBaziProfile,
  context: FortunePeriodContext,
  config: DivinationApiConfig,
  onProgress?: (message: string) => void,
) => {
  const apiKey = config.apiKey.trim();
  const baseUrl = config.apiBaseUrl.trim();
  const model = config.modelName.trim();
  if (!apiKey || !baseUrl || !model) throw new Error('请先配置 API Key、API Base URL 和模型名称。');
  if (/[^\x00-\x7F]/.test(apiKey)) throw new Error('API Key 包含非法字符，请检查是否误输入中文或全角符号。');

  onProgress?.('正在连接在线 AI…');
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: `你是克制、实用的传统八字文化解读助手。${DISCLAIMER} 必须只返回纯 JSON。` },
      { role: 'user', content: buildShortTermFortunePrompt(profile, context) },
    ],
    temperature: 0.6,
    stream: true,
    stream_options: { include_usage: true },
  };
  if (baseUrl.includes('dashscope.aliyuncs.com')) body.enable_thinking = false;

  const response = await fetch(normalizeChatCompletionsUrl(baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API 请求失败：${response.status} - ${await response.text()}`);

  const contentType = response.headers.get('content-type') || '';
  const content = contentType.includes('text/event-stream')
    ? await readStream(response, onProgress)
    : (await response.json()).choices?.[0]?.message?.content;
  if (!content) throw new Error('模型未返回任何内容。');
  return parseShortTermFortuneContent(content, context);
};
