import {
  DivinationApiConfig,
  FortuneDimension,
  FortunePeriodContext,
  ResolvedBaziProfile,
  ShortTermFortuneResult,
} from '../types';
import { buildTimelineRanges } from './fortunePeriodCalculator';
import { calculateLocalFortuneScores } from './localFortuneScoreCalculator';

const DISCLAIMER = '传统命理解读仅供文化参考，不构成医疗、投资、法律或其他专业建议。';
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

const normalizeDimension = (value: unknown, fallbackTitle: string, score: number): FortuneDimension => {
  const dimension = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    score,
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
  const localScores = calculateLocalFortuneScores(context);
  const career = normalizeDimension(data.career, '事业', localScores.dimensions.career);
  const wealth = normalizeDimension(data.wealth, '财运', localScores.dimensions.wealth);
  const relationship = normalizeDimension(data.relationship, '感情', localScores.dimensions.relationship);
  const health = normalizeDimension(data.health, '健康', localScores.dimensions.health);
  const timeline = timelineRanges.map((dateRange, index) => {
    const item = rawTimeline[index] && typeof rawTimeline[index] === 'object'
      ? rawTimeline[index] as Record<string, unknown>
      : {};
    return {
      dateRange,
      score: localScores.timeline[index]?.score ?? 50,
      title: normalizeText(item.title, context.type === 'week' ? '当日趋势' : '阶段趋势'),
      analysis: normalizeText(item.analysis, '结合现实安排稳步推进，避免仅凭运势判断。'),
    };
  });
  return {
    period: context,
    scoreDetails: localScores,
    overallScore: localScores.overallScore,
    trend: localScores.trend,
    summary: normalizeText(data.summary, '本周期整体以稳健观察、顺势调整为宜。'),
    career,
    wealth,
    relationship,
    health,
    timeline,
    opportunities: normalizeList(data.opportunities, ['关注可验证、可执行的小机会。']),
    risks: normalizeList(data.risks, ['避免冲动决策和过度承诺。']),
    actions: normalizeList(data.actions, ['先确认现实条件，再安排重要行动。']),
    disclaimer: DISCLAIMER,
  };
};

export const parseShortTermFortuneContent = (content: string, context: FortunePeriodContext) => (
  normalizeShortTermFortuneResult(extractJsonObject(content), context)
);

const AI_INPUT_KEY_NAMES: Record<string, string> = {
  type: '类型',
  version: '版本',
  startDateTime: '开始时间',
  endDateTime: '结束时间',
  daYun: '大运',
  daYunBasis: '大运计算依据',
  liuNian: '流年',
  liuYueSegments: '流月区间',
  days: '流日列表',
  baziInteractions: '命局与流运关系',
  ganZhi: '干支',
  date: '日期',
  dateRange: '日期范围',
  weekday: '星期',
  ruleVersion: '规则版本',
  dayMaster: '日主',
  value: '值',
  element: '五行',
  yinYang: '阴阳',
  monthCommand: '月令',
  branch: '地支',
  mainElement: '主气五行',
  relationToDayMaster: '与日主关系',
  elementCounts: '五行未加权次数',
  elementCountBasis: '五行次数口径',
  weightedFiveElements: '加权五行得分',
  fiveElementStatus: '五行加权状态',
  tenGodCategoryScores: '十神类别得分',
  tenGodDominance: '十神主次',
  dominant: '主导类别',
  secondary: '次要类别',
  ranking: '类别排序',
  category: '十神类别',
  score: '分数',
  strength: '日主旺衰',
  sameScore: '同类得分',
  resourceScore: '印星得分',
  outputScore: '食伤得分',
  wealthScore: '财星得分',
  authorityScore: '官杀得分',
  monthBonus: '月令修正',
  supportTotal: '扶助总分',
  drainTotal: '耗泄克制总分',
  ratio: '扶抑比值',
  level: '旺衰结论',
  structure: '格局',
  subtype: '格局细分',
  baseSupportRatio: '原局扶助比值',
  visibleSupportCount: '透干生扶数量',
  rootSupportCount: '通根生扶数量',
  favorable: '喜忌',
  categories: '有利十神类别',
  unfavorableCategories: '不利十神类别',
  elements: '有利五行',
  unfavorableElements: '不利五行',
  strengthCalculationBasis: '旺衰计算口径',
  shenSha: '神煞命中',
  peachBlossom: '桃花',
  targets: '目标地支',
  natalHits: '原局命中位置',
  tianYi: '天乙贵人',
  ruleInsights: '本地规则标签',
  personalityTags: '性格标签',
  careerAxis: '事业主轴',
  careerTags: '事业适配标签',
  careerRiskFlags: '事业风险标签',
  wealthMode: '财富模式',
  wealthFlags: '财富规则标签',
  relationshipStar: '关系观察星',
  relationshipFlags: '关系规则标签',
  calculationConvention: '排盘口径',
  yearBoundary: '年柱边界',
  monthBoundary: '月柱边界',
  dayBoundary: '日柱边界',
  timeBasis: '时间口径',
  natalPillars: '原局四柱',
  natalRelations: '原局关系',
  label: '层级名称',
  analysis: '干支分析',
  stem: '天干',
  tenGod: '十神',
  hiddenStems: '藏干',
  relations: '触发关系',
  kind: '关系类型',
  participants: '参与层级',
  detail: '关系说明',
  interpretationBoundary: '解释边界',
  evidence: '本地证据卡',
  stemCategory: '天干十神类别',
  branchMainCategory: '地支主气十神类别',
  stemFavorability: '天干喜忌状态',
  branchMainFavorability: '地支主气喜忌状态',
  combinedFavorability: '综合喜忌状态',
  triggeredNatalPillars: '触发原局宫位',
  spousePalaceTriggered: '夫妻宫被触发',
  monthPillarTriggered: '月柱被触发',
  hourPillarTriggered: '时柱被触发',
  localScoreContext: '本地趋势评分',
  dimensions: '四维分数',
  career: '事业',
  wealth: '财运',
  relationship: '感情',
  health: '健康',
  overallScore: '综合趋势指数',
  trend: '趋势类型',
  timeline: '时间轴评分',
  breakdown: '分层评分明细',
  base: '基础分',
  daYunAdjustment: '大运调整',
  liuNianAdjustment: '流年调整',
  liuYueAdjustment: '流月调整',
  liuRiAdjustment: '流日调整',
  interactionAdjustment: '同向联动调整',
  finalScore: '最终分数',
  calculationBoundary: '评分边界',
};

const translateAiInputValue = (key: string, value: unknown) => {
  if (key === 'type' && value === 'week') return '周运';
  if (key === 'type' && value === 'month') return '月运';
  if (key === 'daYunBasis' && value === 'exact') return '精确起运时间与大运边界';
  if (key === 'daYunBasis' && value === 'manual-age-range') return '按出生年和虚岁区间推算';
  return value;
};

export const toAiChineseContext = (value: unknown, depth = 0): unknown => {
  if (Array.isArray(value)) return value.map(item => toAiChineseContext(item, depth + 1));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, rawValue]) => {
    const translatedValue = translateAiInputValue(key, rawValue);
    const translatedKey = key === 'type' && depth === 0 ? '周期类型' : AI_INPUT_KEY_NAMES[key] || key;
    return [translatedKey, toAiChineseContext(translatedValue, depth + 1)];
  }));
};

export const buildShortTermFortunePrompt = (
  profile: ResolvedBaziProfile,
  context: FortunePeriodContext,
) => {
  const timelineRanges = buildTimelineRanges(context);
  const localScores = calculateLocalFortuneScores(context);
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
${JSON.stringify(toAiChineseContext({ ...context, localScoreContext: localScores }), null, 2)}

【固定时间轴】
${JSON.stringify(timelineRanges)}

【原局计算口径（Yuan 子平工程化参考）】
1. 本地已按“明干每个 1.0；单藏干 1.0；双藏干 0.7/0.3；三藏干 0.7/0.2/0.1”计算“加权五行得分”与“十神类别得分”。
2. 日主扶抑采用五类得分：同类、印、食伤、财、官杀。月令主气为同类时加 +1.5，为印加 +1.2，为食伤加 -0.8，为财加 -1.0，为官杀加 -1.2。
3. 扶助总分 = 同类 + 印 + max(月令修正, 0)；耗泄克制总分 = 食伤 + 财 + 官杀 + max(-月令修正, 0)；扶抑比值 = 扶助总分 / (扶助总分 + 耗泄克制总分)。
4. 旺衰阈值：ratio ≥ 0.68 为强，≥ 0.58 为偏强，≥ 0.42 为中和，≥ 0.32 为偏弱，其余为弱。
5. “格局”与“喜忌”已由本地依据扶抑比、月令、透干和通根判定。正格偏强通常取食伤、财、官杀为有利类别；正格偏弱通常取比劫、印为有利类别；从格按其从势类别取用。模型不得自行另立格局或更改喜忌。

【分析顺序】
严格依次使用：加权五行 → 日主旺衰 → 正格/从格 → 喜忌类别 → 原局十神与宫位 → 大运 → 流年 → 流月 → 流日 → 多层合冲刑害。
流运出现“喜忌.有利十神类别”所列类别，只表示更可能顺应本模型的平衡方向，仍须结合其落点与关系判断；出现“不利十神类别”也不等于必然不利。不得仅凭“某十神出现”直接加减分。

【本地评分方法】
1. 周运和月运统一采用独立日运机制。时间轴每个流日从 50 分开始，由本地程序计算：大运 -6 至 +6、流年 -8 至 +8、流月 -10 至 +10、流日 -20 至 +20、同向层级联动 -6 至 +6，五层理论合计为 ±50，最终限制在 0-100。大运、流年提供背景，流月、流日主导短周期波动。
2. 每层先按天干和地支主气的“喜忌状态”计算喜忌基础：有利与不利同时出现时抵消；只有一边形成明确方向时使用 35% 层级上限，干支同向时使用 60%，再得到一个上层周期同向支持时使用 80%，至少两个上层周期同向支持时才允许使用 100%。
3. 喜忌基础与关系风险分开计算。天干相冲、地支相冲、相刑、相害、相破形成有限风险修正；大运最多扣 2、流年最多扣 3、流月最多扣 4、流日最多扣 6。流年与年柱构成值、冲、刑、害、破时额外标记太岁关系并增加 2 点风险权重，但不得仅凭犯太岁判定全年凶险。
4. 天干五合、地支六合、三合、三会只作为结构变化证据，不自动加分；关系风险会削弱正分或加深负分。三层以上净调整同向时才计算联动分。
5. 周运展示七个独立流日分数；月运先按相同规则逐日计算，再对阶段覆盖的流日取算术平均值，不挑选单个极端日期，也不另换权重。
6. 事业分参考官杀、印、食伤；财运分参考财、食伤；感情分参考关系观察星与夫妻宫触发；健康分只参考五行极端偏态和冲刑害破的谨慎项。
7. 综合趋势指数 = 四舍五入(时间轴均分 × 60% + 四维均分 × 40%)；trend 也由本地按照波动区间、总分和前后半程变化确定。
8. “本地趋势评分”中的所有分数和分层明细均为只读事实。模型不得重新打分，不得返回或修改任何 score、overallScore、trend。

规则：
1. 不得重新计算、修改或覆盖日期、节气、干支、大运、十神、藏干、加权五行、旺衰、格局、喜忌、合冲刑害和时间轴。
2. 所有本地分数是 0-100 的相对趋势指数，不得解释为概率或保证；模型不得生成分数。
3. 事业、财运、感情、健康必须给出克制、可执行的现实建议。
4. 财运不得鼓励加杠杆、追涨杀跌或保证收益；健康不得诊断疾病。
5. timeline 必须严格按固定时间轴的顺序和数量输出；只返回 title 和 analysis，日期与分数由本地注入。
6. 分析顺序固定为原命局 → 大运 → 流年 → 流月 → 流日；小周期结论不得脱离上层背景。
7. 不得依据“五行未加权次数”判断“缺什么”；必须引用本地“加权五行得分”“日主旺衰”“格局”“喜忌”，并使用倾向性表述。
8. 优先引用“命局与流运关系”中已经列出的关系作为依据，不得发明不存在的合冲刑害。
9. 输入数据使用中文字段；返回结果必须严格使用下方英文键名，不得把输出键名翻译成中文。
10. 只返回纯 JSON，不要返回 Markdown 或解释文字。

JSON 结构：
{
  "summary": "周期总评",
  "career": { "summary": "事业趋势", "advice": "行动建议" },
  "wealth": { "summary": "财运趋势", "advice": "行动建议" },
  "relationship": { "summary": "感情趋势", "advice": "行动建议" },
  "health": { "summary": "健康趋势", "advice": "生活方式建议" },
  "timeline": [
    { "title": "节点标题", "analysis": "简洁分析" }
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
