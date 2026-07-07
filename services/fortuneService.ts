import { AiFortuneInterpretation, DivinationApiConfig, DivinationQuestionInput, FortuneStick } from '../types';

export const DIVINATION_API_CONFIG_STORAGE_KEY = 'lifekline_divination_api_config';

export const DEFAULT_DIVINATION_API_CONFIG: DivinationApiConfig = {
  apiKey: '',
  apiBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  modelName: 'qwen3.7-plus',
};

export const loadDivinationApiConfig = (): DivinationApiConfig => {
  if (typeof window === 'undefined') return DEFAULT_DIVINATION_API_CONFIG;

  try {
    const savedConfig = window.localStorage.getItem(DIVINATION_API_CONFIG_STORAGE_KEY);
    if (!savedConfig) return DEFAULT_DIVINATION_API_CONFIG;

    const parsedConfig = JSON.parse(savedConfig);
    return {
      apiKey: typeof parsedConfig.apiKey === 'string' ? parsedConfig.apiKey : '',
      apiBaseUrl: typeof parsedConfig.apiBaseUrl === 'string' && parsedConfig.apiBaseUrl.trim()
        ? parsedConfig.apiBaseUrl
        : DEFAULT_DIVINATION_API_CONFIG.apiBaseUrl,
      modelName: typeof parsedConfig.modelName === 'string' && parsedConfig.modelName.trim()
        ? parsedConfig.modelName
        : DEFAULT_DIVINATION_API_CONFIG.modelName,
    };
  } catch {
    return DEFAULT_DIVINATION_API_CONFIG;
  }
};

export const saveDivinationApiConfig = (config: DivinationApiConfig) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DIVINATION_API_CONFIG_STORAGE_KEY, JSON.stringify(config));
};

export const hasUsableDivinationApiConfig = (config: DivinationApiConfig) => (
  Boolean(config.apiKey.trim()) &&
  Boolean(config.apiBaseUrl.trim()) &&
  Boolean(config.modelName.trim())
);

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

const normalizeChatCompletionsUrl = (baseUrl: string) => {
  const trimmedUrl = baseUrl.trim().replace(/\/+$/, '');
  if (trimmedUrl.endsWith('/chat/completions')) return trimmedUrl;
  return `${trimmedUrl}/chat/completions`;
};

const buildDetailedFortuneContext = (stick: FortuneStick) => [
  ['整体解译', stick.overall],
  ['本签精髓', stick.essence],
  ['凡事做事', stick.generalDetail],
  ['爱情婚姻', stick.loveDetail],
  ['工作求职 / 创业事业', stick.careerDetail],
  ['考试竞赛 / 升迁竞选', stick.examDetail],
  ['投资理财', stick.wealthDetail],
  ['经商生意', stick.businessDetail],
  ['房地交易', stick.propertyDetail],
  ['治病健康', stick.healthDetail],
  ['转换变更', stick.changeDetail],
  ['求孕求子', stick.pregnancyDetail],
  ['官司诉讼', stick.lawsuitDetail],
  ['寻人寻物', stick.lostFoundDetail],
  ['远行出国', stick.travelDetail],
  ['典故', stick.storyDetail],
]
  .filter(([, value]) => value.trim())
  .map(([label, value]) => `【${label}】\n${value}`)
  .join('\n\n');

const buildFortunePrompt = (stick: FortuneStick, input: DivinationQuestionInput) => `请根据以下观音灵签信息和用户问题，生成个性化解签。

【灵签信息】
签号：第 ${stick.id} 签
签等：${stick.level}
产品吉凶标签：${stick.fortuneLevel}
签名宫位：${stick.story}
签诗：
${stick.poem}

基础总解：${stick.meaning}

【整体解译】
${stick.overall || '无'}

【详细解签资料】
${buildDetailedFortuneContext(stick) || '无'}

【用户问题】
${input.question || '未提供'}

如果用户问题为空、未提供或含义不明确，则按“综合今日运势”解读。

【输出字段说明】
career：事业解读，聚焦工作、合作、推进节奏。
wealth：财运解读，聚焦收支、风险、理性决策。
love：感情解读，聚焦沟通、关系状态、自我调整。
health：健康提醒，只做生活方式层面的温和提醒。
advice：今日行动建议，给出约 50 个中文字符的可执行建议。
caution：注意事项，提醒应避免的行为或心态。

【用户意图匹配】
1. 先判断用户问题属于哪类意图：事业工作、求职创业、投资理财、感情婚姻、健康、考试升迁、房产交易、官司诉讼、寻人寻物、远行出国、求孕求子、综合运势。
2. 解读时必须先使用【整体解译】确定本签的核心象意，再选择【详细解签资料】中最贴近用户问题的栏目作为主要依据。
3. 如果用户问题跨多个领域，优先回答用户最关心的事项，其他字段可作为补充提醒；不要把所有栏目平均铺开。
4. 如果对应栏目为空，则退回使用【整体解译】、【本签精髓】、【凡事做事】和签诗进行解读。

【差异化要求】
1. 每个字段必须结合本签的签诗、签名宫位、签等、吉凶标签、基础总解或详细解签资料中的具体信息，不得只写通用建议。
2. career、wealth、love、health、advice、caution 六个字段的表达重点必须不同。
3. 如果是上签，建议偏主动但仍克制；如果是中签，建议偏稳健观察；如果是下签，建议偏保守避险。
4. 不要反复使用“稳步推进”“理性决策”“保持沟通”“规律作息”等泛化套话。
5. advice 字段要比其他字段更具体，长度约 45-60 个中文字符，至少包含一个今天可以执行的动作。

【JSON 结构】
{
  "career": "事业解读",
  "wealth": "财运解读",
  "love": "感情解读",
  "health": "健康提醒",
  "advice": "今日行动建议",
  "caution": "注意事项"
}`;

export const generateFortuneInterpretation = async (
  stick: FortuneStick,
  input: DivinationQuestionInput,
  config: DivinationApiConfig
): Promise<AiFortuneInterpretation> => {
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
        content: `你是一个克制、实用的传统文化签文解读助手。

你的任务是基于用户提供的观音灵签信息和用户问题，生成个性化解签内容。

必须遵守以下规则：

1. 只解读用户提供的这一支签，不得重新抽签。
2. 不得更改签号、签诗、签等、吉凶标签、签名宫位或基础总解。
3. 解读定位为传统文化娱乐、自我反思和行动提醒，不得声称具有确定预测能力。
4. 语气克制、实用、温和，不夸张、不恐吓、不制造焦虑。
5. 不得提供确定性医疗诊断、治疗方案、用药建议。
6. 不得提供具体投资买卖指令、保证收益、确定涨跌判断。
7. 不得使用“必定”“一定”“绝对”“保证”“马上转运”等绝对化表达。
8. career、wealth、love、health、caution 每个字段控制在 60 个中文字符以内；advice 控制在 45-60 个中文字符左右。
9. 输出必须是合法 JSON，不得包含 markdown、代码块、解释文字或额外前后缀。`,
      },
      {
        role: 'user',
        content: buildFortunePrompt(stick, input),
      },
    ],
    temperature: 0.6,
  };

  console.group('[fortune-ai] request');
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
  console.group('[fortune-ai] raw response');
  console.log(jsonResult);
  console.groupEnd();

  const content = jsonResult.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('模型未返回任何内容');
  }

  const data = extractJsonObject(content);

  const interpretation = {
    career: normalizeText(data.career, stick.career),
    wealth: normalizeText(data.wealth, stick.wealth),
    love: normalizeText(data.love, stick.love),
    health: normalizeText(data.health, stick.health),
    advice: normalizeText(data.advice, stick.advice),
    caution: normalizeText(data.caution, stick.caution),
  };

  console.group('[fortune-ai] parsed interpretation');
  console.log(interpretation);
  console.groupEnd();

  return interpretation;
};
