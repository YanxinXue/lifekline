const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 完整的六十甲子表 (0=甲子, 59=癸亥)
export const JIAZI: string[] = [];
for (let i = 0; i < 60; i++) {
  JIAZI.push(STEMS[i % 10] + BRANCHES[i % 12]);
}

// 阴阳判断
const YANG_STEMS = ['甲', '丙', '戊', '庚', '壬'];

/**
 * 判断大运方向
 */
export function getDaYunDirection(yearPillar: string, gender: 'Male' | 'Female'): {
  isForward: boolean;
  text: string;
} {
  const firstChar = yearPillar.trim().charAt(0);
  const isYangYear = YANG_STEMS.includes(firstChar);
  const isForward = gender === 'Male' ? isYangYear : !isYangYear;

  return {
    isForward,
    text: isForward ? '顺行' : '逆行',
  };
}

/**
 * 根据六十甲子索引，顺推 n 位 (mod 60)
 */
export function getNextJiaZhi(jiaZhi: string, steps: number = 1): string {
  const idx = JIAZI.indexOf(jiaZhi);
  if (idx === -1) return jiaZhi;
  return JIAZI[(idx + steps + 60) % 60];
}

/**
 * 根据六十甲子索引，逆推 n 位 (mod 60)
 */
export function getPrevJiaZhi(jiaZhi: string, steps: number = 1): string {
  const idx = JIAZI.indexOf(jiaZhi);
  if (idx === -1) return jiaZhi;
  return JIAZI[(idx - steps + 60) % 60];
}

/**
 * 根据公历年份计算流年干支
 * 参照年：公元 4 年 = 甲子 (cycle 0)
 */
export function getYearGanZhi(year: number): string {
  const cycle = ((year - 4) % 60 + 60) % 60;
  return JIAZI[cycle];
}

/**
 * 生成 100 年的流年干支数组
 * @param birthYear 公历出生年
 * @returns 从1虚岁到100虚岁每年的 {age, year, ganZhi} 数组
 * 注意：虚岁 = 公历年 - 出生年 + 1，所以 1虚岁 = 出生年
 */
export function generate100YearGanZhi(birthYear: number): Array<{ age: number; year: number; ganZhi: string }> {
  const result: Array<{ age: number; year: number; ganZhi: string }> = [];

  for (let age = 1; age <= 100; age++) {
    let calendarYear = birthYear + age - 1;
    result.push({
      age,
      year: calendarYear,
      ganZhi: getYearGanZhi(calendarYear),
    });
  }

  return result;
}

/**
 * 生成 10 步大运序列
 */
export function generateDaYunSequence(firstDaYun: string, isForward: boolean, count: number = 10): string[] {
  const sequence: string[] = [firstDaYun];


  for (let i = 1; i < count; i++) {
    if (isForward) {
      sequence.push(getNextJiaZhi(firstDaYun, i));
    } else {
      sequence.push(getPrevJiaZhi(firstDaYun, i));
    }
  }

  return sequence;
}

/**
 * 生成完整的用户提示词
 */
export interface PromptInput {
  name: string;
  gender: 'Male' | 'Female';
  birthYear: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: string;
  firstDaYun: string;
}

export function generateUserPrompt(input: PromptInput): string {
  const { isForward, text: directionText } = getDaYunDirection(input.yearPillar, input.gender);
  const genderStr = input.gender === 'Male' ? '男 (乾造)' : '女 (坤造)';
  const startAgeInt = parseInt(input.startAge) || 1;
  const birthYearNum = parseInt(input.birthYear) || 2000;

  // 预计算流年干支和大运序列
  const yearGanZhiList = generate100YearGanZhi(birthYearNum);
  const daYunSequence = generateDaYunSequence(input.firstDaYun, isForward, 10);

  // 生成大运区间示例
  const directionExample = isForward
    ? `如第一步大运为【${input.firstDaYun}】，第二步即为【${getYearGanZhi(0) === '甲子' ? '' : getNextJiaZhi(input.firstDaYun)}】`
    : `如第一步大运为【${input.firstDaYun}】，第二步即为【${getPrevJiaZhi(input.firstDaYun)}】`;

  // 生成完整的流年干支列表（JSON格式）
  const yearGanZhiJson = JSON.stringify(yearGanZhiList.map(y => ({ age: y.age, year: y.year, ganZhi: y.ganZhi })));

  // 生成大运区间描述
  const daYunAgeRanges = daYunSequence.map((daYun, i) => {
    const startAge = startAgeInt + i * 10;
    const endAge = startAge + 9;
    return `  - 虚岁 ${startAge}-${endAge}: ${daYun}`;
  }).join('\n');

  return `请根据以下**已经排好的**八字四柱和**大运信息**进行分析。

【基本信息】
性别：${genderStr}
姓名：${input.name || '未提供'}
出生公历年份：${input.birthYear}年

【八字四柱】
年柱：${input.yearPillar}
月柱：${input.monthPillar}
日柱：${input.dayPillar}
时柱：${input.hourPillar}

【大运参数】
1. 起运年龄：${input.startAge} 岁 (虚岁)
2. 第一步大运：${input.firstDaYun}
3. 排列方向：${directionText}
${directionExample}

【流年干支对照表】（虚岁 1-100 岁完整列表）
${yearGanZhiJson}

【大运区间】
起运前 (虚岁 1-${startAgeInt - 1}): 童限
${daYunAgeRanges}

【任务要求】
1. **格局判定**：分析日元旺衰、取用神、定格局。
2. **生成 100 条 K 线数据**：
   - \`age\`: 虚岁 (1-100)
   - \`year\`: 公历年份 (从 ${birthYearNum} 开始)
   - \`daYun\`: 当前所在大运干支 (10年一变，起运前为"童限")
   - \`ganZhi\`: 流年干支 (每年一变，**必须严格对照上方【流年干支对照表】**，不可自行推算)
   - \`open\`: 年初运势 (0-100，通常落在 20-85)
   - \`close\`: 年末运势 (0-100，通常落在 20-85)
   - \`high\`: 年内最高点 (0-100，必须 >= max(open, close))
   - \`low\`: 年内最低点 (0-100，必须 <= min(open, close))
   - \`score\`: 流年综合运势分 (0-100，不是 0-10，由 open/close/high/low 趋势决定)
   - \`reason\`: 短评 (20-30字，说明吉凶原因)
3. **生成命理报告**：
   - summary: 命理总评 (100字内)
   - personality: 性格分析 (80字内)
   - industry: 事业方向分析 (80字内)
   - fengShui: 风水建议 (方位、开运物，80字内)
   - wealth: 财富趋势 (80字内)
   - marriage: 婚姻分析 (80字内)
   - health: 健康提示 (60字内)
   - family: 六亲关系 (60字内)

**返回的 JSON 必须严格遵循以下结构（字段名不可更改）：**
{
  "bazi": ["年柱", "月柱", "日柱", "时柱"],
  "summary": "命理总评",
  "summaryScore": 8,
  "personality": "性格分析",
  "personalityScore": 8,
  "industry": "事业分析",
  "industryScore": 7,
  "fengShui": "风水建议",
  "fengShuiScore": 8,
  "wealth": "财富趋势",
  "wealthScore": 9,
  "marriage": "婚姻分析",
  "marriageScore": 6,
  "health": "健康提示",
  "healthScore": 5,
  "family": "六亲关系",
  "familyScore": 7,
  "chartPoints": [
    {"age":1,"year":2000,"daYun":"童限","ganZhi":"庚辰","open":50,"close":55,"high":60,"low":45,"score":55,"reason":"开局平稳，家庭呵护"},
    ... (共100条，从虚岁1岁到100岁)
  ]
}
【评分原则】
- chartPoints 内的 score 是 0-100 分；命理报告维度的 summaryScore/personalityScore 等仍是 0-10 分，二者不要混淆。
- 大运流年相生 (如用神年份) → 高评分 (70-95)
- 大运流年相克 (如忌神年份、刑冲合害) → 低评分 (10-45)
- 平运年份 → 中评分 (45-70)
- 数据必须有明显起伏，禁止平缓输出，禁止大量重复同一组 open/close/high/low。
- 全局最高 high 应尽量只出现在 1 个流年；不要因为上限而让多个年份都等于 80 或 90。
- 大运交替年是重要转折点，应体现评分跳变

【K线 OHLC 约束】
- high >= max(open, close) 且 low <= min(open, close)
- bullish年 (close > open): open 偏低, close 偏高
- bearish年 (close < open): open 偏高, close 偏低

请**只返回纯 JSON 数据**，不要包含任何其他文字或 markdown 标记。`;
}
