
import { UserInput, LifeDestinyResult, Gender } from "../types";
import { BAZI_SYSTEM_INSTRUCTION } from "../constants";
import { generate100YearGanZhi, generateDaYunSequence, generateUserPrompt, getDaYunDirection } from "./promptBuilder";

// Helper to determine stem polarity
const getStemPolarity = (pillar: string): 'YANG' | 'YIN' => {
  if (!pillar) return 'YANG';
  const firstChar = pillar.trim().charAt(0);
  const yangStems = ['甲', '丙', '戊', '庚', '壬'];
  const yinStems = ['乙', '丁', '己', '辛', '癸'];

  if (yangStems.includes(firstChar)) return 'YANG';
  if (yinStems.includes(firstChar)) return 'YIN';
  return 'YANG';
};

const normalizeChatCompletionsUrl = (baseUrl: string) => {
  const trimmedUrl = baseUrl.trim().replace(/\/+$/, '');
  if (trimmedUrl.endsWith('/chat/completions')) return trimmedUrl;
  return `${trimmedUrl}/chat/completions`;
};

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

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeNumber = (value: unknown, fallback: number) => {
  const numberValue = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

type DeterministicTimelinePoint = {
  age: number;
  year: number;
  ganZhi: string;
  daYun: string;
};

const buildDeterministicTimeline = (input: UserInput): DeterministicTimelinePoint[] => {
  const birthYear = parseInt(input.birthYear, 10);
  const startAge = parseInt(input.startAge, 10);
  const safeBirthYear = Number.isFinite(birthYear) ? birthYear : new Date().getFullYear();
  const safeStartAge = Number.isFinite(startAge) ? startAge : 1;
  const { isForward } = getDaYunDirection(
    input.yearPillar,
    input.gender === Gender.MALE ? 'Male' : 'Female'
  );
  const yearGanZhiList = generate100YearGanZhi(safeBirthYear);
  const daYunSequence = generateDaYunSequence(input.firstDaYun, isForward, 10);

  return yearGanZhiList.map(item => {
    if (item.age < safeStartAge) {
      return { ...item, daYun: '童限' };
    }

    const daYunIndex = Math.floor((item.age - safeStartAge) / 10);
    return {
      ...item,
      daYun: daYunSequence[daYunIndex] || daYunSequence[daYunSequence.length - 1] || '未知',
    };
  });
};

const normalizeKLinePoint = (point: any, index: number, timelinePoint?: DeterministicTimelinePoint) => {
  const open = clampNumber(normalizeNumber(point.open, 50), 0, 100);
  const close = clampNumber(normalizeNumber(point.close, open), 0, 100);
  const high = clampNumber(Math.max(normalizeNumber(point.high, Math.max(open, close)), open, close), 0, 100);
  const low = clampNumber(Math.min(normalizeNumber(point.low, Math.min(open, close)), open, close), 0, 100);
  const rawScore = normalizeNumber(point.score, close);
  const score = clampNumber(rawScore <= 10 ? rawScore * 10 : rawScore, 0, 100);

  return {
    age: timelinePoint?.age ?? Math.round(normalizeNumber(point.age, index + 1)),
    year: timelinePoint?.year ?? Math.round(normalizeNumber(point.year, 0)),
    ganZhi: timelinePoint?.ganZhi ?? (typeof point.ganZhi === 'string' && point.ganZhi.trim() ? point.ganZhi.trim() : '未知'),
    daYun: timelinePoint?.daYun ?? (typeof point.daYun === 'string' && point.daYun.trim() ? point.daYun.trim() : '未知'),
    open: Math.round(open),
    close: Math.round(close),
    high: Math.round(high),
    low: Math.round(low),
    score: Math.round(score),
    reason: typeof point.reason === 'string' && point.reason.trim() ? point.reason.trim() : '暂无流年说明',
  };
};

const parseStreamDataLine = (line: string) => {
  const trimmedLine = line.trim();
  if (!trimmedLine.startsWith('data:')) return { content: '', reasoning: '', done: false };

  const payload = trimmedLine.replace(/^data:\s*/, '');
  if (!payload) return { content: '', reasoning: '', done: false };
  if (payload === '[DONE]') return { content: '', reasoning: '', done: true };

  try {
    const data = JSON.parse(payload);
    const delta = data.choices?.[0]?.delta;
    return {
      content: delta?.content || data.choices?.[0]?.message?.content || '',
      reasoning: delta?.reasoning_content || '',
      done: false,
    };
  } catch {
    return { content: '', reasoning: '', done: false };
  }
};

const readOpenAICompatibleStream = async (
  response: Response,
  onProgress?: (message: string) => void
) => {
  if (!response.body) {
    throw new Error('当前浏览器不支持读取流式响应');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let content = '';
  let reasoningLength = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || '';

    for (const line of lines) {
      const chunk = parseStreamDataLine(line);
      if (chunk.done) {
        await reader.cancel();
        return content;
      }

      if (chunk.reasoning) {
        reasoningLength += chunk.reasoning.length;
        onProgress?.(`模型思考中，已接收思考内容 ${reasoningLength} 字`);
      }

      if (chunk.content) {
        content += chunk.content;
        onProgress?.(`正在接收模型输出，已接收 ${content.length} 字`);
      }
    }
  }

  buffer += decoder.decode();
  const chunk = parseStreamDataLine(buffer);
  if (chunk.content) {
    content += chunk.content;
  }

  return content;
};

export const generateLifeAnalysis = async (
  input: UserInput,
  options?: { onProgress?: (message: string) => void }
): Promise<LifeDestinyResult> => {

  const { apiKey, apiBaseUrl, modelName } = input;

  // FIX: Trim whitespace which causes header errors if copied with newlines
  const cleanApiKey = apiKey ? apiKey.trim() : "";
  const cleanBaseUrl = apiBaseUrl ? apiBaseUrl.trim().replace(/\/+$/, "") : "";
  const targetModel = modelName && modelName.trim() ? modelName.trim() : "gemini-3-pro-preview";

  // 本地演示模式：当 API Key 为 'demo' 时，使用预生成的本地数据
  if (cleanApiKey.toLowerCase() === 'demo') {
    console.log('🎯 使用本地演示模式');
    const mockData = await fetch('/mock-data.json').then(r => r.json());
    return {
      chartData: mockData.chartPoints,
      analysis: {
        bazi: mockData.bazi || [],
        summary: mockData.summary || "无摘要",
        summaryScore: mockData.summaryScore || 5,
        personality: mockData.personality || "无性格分析",
        personalityScore: mockData.personalityScore || 5,
        industry: mockData.industry || "无",
        industryScore: mockData.industryScore || 5,
        fengShui: mockData.fengShui || "建议多亲近自然，保持心境平和。",
        fengShuiScore: mockData.fengShuiScore || 5,
        wealth: mockData.wealth || "无",
        wealthScore: mockData.wealthScore || 5,
        marriage: mockData.marriage || "无",
        marriageScore: mockData.marriageScore || 5,
        health: mockData.health || "无",
        healthScore: mockData.healthScore || 5,
        family: mockData.family || "无",
        familyScore: mockData.familyScore || 5,

      },
    };
  }

  if (!cleanApiKey) {
    throw new Error("请在表单中填写有效的 API Key（输入 'demo' 可使用本地演示模式）");
  }

  // Check for non-ASCII characters to prevent obscure 'Failed to construct Request' errors
  // If user accidentally pastes Chinese characters or emojis in the API key field
  if (/[^\x00-\x7F]/.test(cleanApiKey)) {
    throw new Error("API Key 包含非法字符（如中文或全角符号），请检查输入是否正确。");
  }

  if (!cleanBaseUrl) {
    throw new Error("请在表单中填写有效的 API Base URL");
  }

  // 使用统一的 promptBuilder 生成提示词
  const userPrompt = generateUserPrompt({
    name: input.name || "未提供",
    gender: input.gender === Gender.MALE ? 'Male' : 'Female',
    birthYear: input.birthYear,
    yearPillar: input.yearPillar,
    monthPillar: input.monthPillar,
    dayPillar: input.dayPillar,
    hourPillar: input.hourPillar,
    startAge: input.startAge,
    firstDaYun: input.firstDaYun,
  });
  const deterministicTimeline = buildDeterministicTimeline(input);

  try {
    const requestUrl = normalizeChatCompletionsUrl(cleanBaseUrl);
    const requestBody: {
      model: string;
      messages: { role: string; content: string }[];
      temperature: number;
      stream: boolean;
      stream_options: { include_usage: boolean };
      enable_thinking?: boolean;
    } = {
      model: targetModel,
      messages: [
        { role: "system", content: BAZI_SYSTEM_INSTRUCTION + "\n\n请务必只返回纯JSON格式数据，不要包含任何markdown代码块标记。" },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      stream: true,
      stream_options: { include_usage: true },
    };

    if (cleanBaseUrl.includes('dashscope.aliyuncs.com')) {
      requestBody.enable_thinking = false;
    }

    console.group('[life-kline-ai] request');
    console.log('url', requestUrl);
    console.log('body_json', JSON.stringify(requestBody, null, 2));
    console.groupEnd();

    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanApiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 请求失败: ${response.status} - ${errText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const content = contentType.includes('text/event-stream')
      ? await readOpenAICompatibleStream(response, options?.onProgress)
      : (await response.json()).choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("模型未返回任何内容。");
    }

    console.group('[life-kline-ai] raw response');
    console.log('raw_content', content);
    console.groupEnd();

    const data = extractJsonObject(content);

    // 简单校验数据完整性
    if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
      throw new Error("模型返回的数据格式不正确（缺失 chartPoints）。");
    }

    const chartData = data.chartPoints.map((point: any, index: number) => (
        normalizeKLinePoint(point, index, deterministicTimeline[index])
      ));
    const result = {
      chartData,
      analysis: {
        bazi: data.bazi || [],
        summary: data.summary || "无摘要",
        summaryScore: data.summaryScore || 5,
        personality: data.personality || "无性格分析",
        personalityScore: data.personalityScore || 5,
        industry: data.industry || "无",
        industryScore: data.industryScore || 5,
        fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
        fengShuiScore: data.fengShuiScore || 5,
        wealth: data.wealth || "无",
        wealthScore: data.wealthScore || 5,
        marriage: data.marriage || "无",
        marriageScore: data.marriageScore || 5,
        health: data.health || "无",
        healthScore: data.healthScore || 5,
        family: data.family || "无",
        familyScore: data.familyScore || 5,

      },
    };

    console.group('[life-kline-ai] parsed result');
    console.log('parsed_result_json', JSON.stringify(result, null, 2));
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("Gemini/OpenAI API Error:", error);
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error("请求未收到服务端响应，可能是浏览器跨域限制（CORS）、网络异常或接口地址被拦截。");
    }
    throw error;
  }
};
