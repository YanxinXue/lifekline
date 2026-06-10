import { Solar } from 'lunar-javascript';
import { AlmanacDay, AlmanacInterpretation, AlmanacQuestionInput, DivinationApiConfig } from '../types';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

const extractJsonObject = (content: string) => {
  let jsonContent = content.trim();
  const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);

  if (jsonMatch) {
    jsonContent = jsonMatch[1].trim();
  } else {
    const jsonStartIndex = jsonContent.indexOf('{');
    const jsonEndIndex = jsonContent.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
    }
  }

  return JSON.parse(jsonContent);
};

const normalizeText = (value: unknown, fallback: string) => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return fallback;
};

const normalizeList = (value: string[]) => (
  value.length ? value : ['无明确记录']
);

const normalizeChatCompletionsUrl = (baseUrl: string) => {
  const trimmedUrl = baseUrl.trim().replace(/\/+$/, '');
  if (trimmedUrl.endsWith('/chat/completions')) return trimmedUrl;
  return `${trimmedUrl}/chat/completions`;
};

const parseDateText = (dateText: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);

  if (!match) {
    throw new Error('日期格式不正确');
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new Error('日期无效');
  }

  return { year, month, day, date };
};

export const formatDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateAlmanacDay = (dateText: string): AlmanacDay => {
  const { year, month, day, date } = parseDateText(dateText);
  const lunar = Solar.fromYmd(year, month, day).getLunar();
  const star = lunar.getXiu();
  const starLuck = lunar.getXiuLuck();

  return {
    solarDate: dateText,
    weekday: WEEKDAYS[date.getDay()],
    lunarDate: lunar.toString(),
    yearGanZhi: lunar.getYearInGanZhi(),
    monthGanZhi: lunar.getMonthInGanZhi(),
    dayGanZhi: lunar.getDayInGanZhi(),
    zodiac: lunar.getShengxiao(),
    clash: lunar.getChongDesc(),
    sha: lunar.getSha(),
    suitable: normalizeList(lunar.getDayYi()),
    avoid: normalizeList(lunar.getDayJi()),
    luckyGods: normalizeList(lunar.getDayJiShen()),
    star: starLuck ? `${star}宿（${starLuck}）` : `${star}宿`,
    starLuck,
    pengZu: [lunar.getPengZuGan(), lunar.getPengZuZhi()].filter(Boolean),
    generatedAt: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
};

const buildAlmanacPrompt = (almanac: AlmanacDay, input: AlmanacQuestionInput) => `请根据以下本地黄历信息和用户事项，生成克制、实用的传统民俗参考解读。

【日期】
公历：${almanac.solarDate} ${almanac.weekday}
农历：${almanac.lunarDate}
干支：${almanac.yearGanZhi}年 ${almanac.monthGanZhi}月 ${almanac.dayGanZhi}日
生肖：${almanac.zodiac}
冲煞：${almanac.clash}，煞${almanac.sha}
宜：${almanac.suitable.join('、')}
忌：${almanac.avoid.join('、')}
吉神：${almanac.luckyGods.join('、')}
星宿：${almanac.star}
彭祖百忌：${almanac.pengZu.join('；')}

【用户事项】
${input.matter || '未提供'}

如果用户事项为空、未提供或含义不明确，则按“今日综合行动参考”解读。
如果“宜”中出现“馀事勿取”或“忌”中出现“诸事不宜”，解释口径应为：只适合列出的少数低风险事项，其余重要事项不宜强行推进，不要把它说成黄历事实互相矛盾。

【输出字段说明】
summary：一句话总体判断。
suitable：从黄历“宜”、吉神、星宿等角度说明相对适合点。
risk：从黄历“忌”、冲煞、彭祖百忌等角度说明需要注意的点。
suggestion：给出低风险、可执行的现实行动建议。

【JSON 结构】
{
  "summary": "总体判断",
  "suitable": "相对适合点",
  "risk": "需要注意的点",
  "suggestion": "实际行动建议"
}`;

export const generateAlmanacInterpretation = async (
  almanac: AlmanacDay,
  input: AlmanacQuestionInput,
  config: DivinationApiConfig
): Promise<AlmanacInterpretation> => {
  const cleanApiKey = config.apiKey.trim();
  const cleanBaseUrl = config.apiBaseUrl.trim().replace(/\/+$/, '');
  const targetModel = config.modelName.trim();

  if (!cleanApiKey) {
    throw new Error('请先填写 API Key');
  }

  if (/[^\x00-\x7F]/.test(cleanApiKey)) {
    throw new Error('API Key 包含非法字符，请检查是否误输入中文或全角符号');
  }

  if (!cleanBaseUrl) {
    throw new Error('请先填写 API Base URL');
  }

  if (!targetModel) {
    throw new Error('请先填写模型名称');
  }

  const requestUrl = normalizeChatCompletionsUrl(cleanBaseUrl);
  const requestBody = {
    model: targetModel,
    messages: [
      {
        role: 'system',
        content: `你是一个克制、实用的黄历民俗解读助手。

必须遵守以下规则：

1. 只能解释用户提供的黄历信息，不得生成、改写或否定这些黄历事实。
2. 解读定位为传统文化、民俗参考、自我反思和行动提醒，不得声称具有确定预测能力。
3. 不得使用“必定”“一定”“绝对”“保证”“马上转运”等绝对化表达。
4. 不得提供确定性医疗诊断、治疗方案、用药建议。
5. 不得提供具体投资买卖指令、保证收益、确定涨跌判断。
6. 不得提供法律结论或合同效力判断。
7. 每个字段内容控制在 80 个中文字符以内。
8. 输出必须是合法 JSON，不得包含 markdown、代码块、解释文字或额外前后缀。`,
      },
      {
        role: 'user',
        content: buildAlmanacPrompt(almanac, input),
      },
    ],
    temperature: 0.5,
  };

  console.group('[almanac-ai] request');
  console.log('url', requestUrl);
  console.log('body', requestBody);
  console.groupEnd();

  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanApiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 请求失败：${response.status} ${errorText.slice(0, 200)}`);
  }

  const jsonResult = await response.json();
  console.group('[almanac-ai] raw response');
  console.log(jsonResult);
  console.groupEnd();

  const content = jsonResult.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('模型未返回任何内容');
  }

  const data = extractJsonObject(content);
  const interpretation = {
    summary: normalizeText(data.summary, '今日适合作为民俗参考，重要事项仍应结合现实条件判断。'),
    suitable: normalizeText(data.suitable, '可优先安排与宜项相近、风险较低的事项。'),
    risk: normalizeText(data.risk, '涉及高成本、高承诺或不可逆事项时建议放慢节奏。'),
    suggestion: normalizeText(data.suggestion, '先做准备、确认信息，再推进关键决定。'),
  };

  console.group('[almanac-ai] parsed interpretation');
  console.log(interpretation);
  console.groupEnd();

  return interpretation;
};
