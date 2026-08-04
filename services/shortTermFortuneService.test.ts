import { describe, expect, it } from 'vitest';
import { Gender, type BaziProfile } from '../types';
import { resolveBaziProfile } from './baziProfileStorage';
import { generateFortunePeriodContext } from './fortunePeriodCalculator';
import { calculateLocalFortuneScores } from './localFortuneScoreCalculator';
import { buildShortTermFortunePrompt, normalizeShortTermFortuneResult, parseShortTermFortuneContent, toAiChineseContext } from './shortTermFortuneService';

const profile: BaziProfile = {
  version: 1,
  source: 'manual',
  name: '',
  gender: Gender.MALE,
  birthYear: '1990',
  yearPillar: '庚午',
  monthPillar: '丁亥',
  dayPillar: '甲子',
  hourPillar: '乙丑',
  startAge: '6',
  firstDaYun: '戊子',
  updatedAt: '2026-08-03T00:00:00.000Z',
};
const context = generateFortunePeriodContext(profile, 'week', '2026-08-03');

describe('shortTermFortuneService normalization', () => {
  it('ignores AI scores and uses the local score model', () => {
    const result = normalizeShortTermFortuneResult({
      overallScore: 180,
      trend: 'unknown',
      timeline: [{ dateRange: '被模型修改', score: -20, title: '第一天', analysis: '分析' }],
      opportunities: ['一', '二', '三', '四'],
    }, context);

    expect(result.overallScore).toBe(42);
    expect(result.trend).toBe('volatile');
    expect(result.timeline).toHaveLength(7);
    expect(result.timeline[0].dateRange).toBe('2026-08-03');
    expect(result.timeline[0].score).toBe(59);
    expect(result.opportunities).toEqual(['一', '二', '三']);
    expect(result.disclaimer).toContain('文化参考');
  });

  it('extracts JSON from a markdown code block', () => {
    const result = parseShortTermFortuneContent('```json\n{"overallScore":99,"timeline":[]}\n```', context);
    expect(result.overallScore).toBe(42);
    expect(result.period).toBe(context);
  });

  it('includes an explicit scoring formula and layer adjustment ranges in the prompt', () => {
    const prompt = buildShortTermFortunePrompt(resolveBaziProfile(profile), context);
    expect(prompt).toContain('综合趋势指数 = 四舍五入(时间轴均分 × 60% + 四维均分 × 40%)');
    expect(prompt).toContain('周运和月运统一采用独立日运机制');
    expect(prompt).toContain('大运 -6 至 +6');
    expect(prompt).toContain('流年 -8 至 +8');
    expect(prompt).toContain('流月 -10 至 +10');
    expect(prompt).toContain('流日 -20 至 +20');
    expect(prompt).toContain('只有一边形成明确方向时使用 35% 层级上限');
    expect(prompt).toContain('三层以上净调整同向时才计算联动分');
    expect(prompt).toContain('流年最多扣 3');
    expect(prompt).toContain('流日最多扣 6');
    expect(prompt).toContain('不得仅凭犯太岁判定全年凶险');
    expect(prompt).toContain('三合、三会只作为结构变化证据，不自动加分');
    expect(prompt).toContain('明干每个 1.0；单藏干 1.0；双藏干 0.7/0.3；三藏干 0.7/0.2/0.1');
    expect(prompt).toContain('扶抑比值 = 扶助总分 / (扶助总分 + 耗泄克制总分)');
    expect(prompt).toContain('加权五行 → 日主旺衰 → 正格/从格 → 喜忌类别');
    expect(prompt).toContain('模型不得自行另立格局或更改喜忌');
    expect(prompt).toContain('模型不得生成分数');
    expect(prompt).toContain('返回结果必须严格使用下方英文键名');
    expect(prompt).toContain('"career": { "summary"');
  });

  it('uses Chinese field names for the AI input context', () => {
    const translated = JSON.stringify(toAiChineseContext({
      ...context,
      localScoreContext: calculateLocalFortuneScores(context),
    }));
    expect(translated).toContain('"周期类型":"周运"');
    expect(translated).toContain('"大运计算依据":"按出生年和虚岁区间推算"');
    expect(translated).toContain('"命局与流运关系"');
    expect(translated).toContain('"加权五行得分"');
    expect(translated).toContain('"有利十神类别"');
    expect(translated).not.toContain('"daYun"');
    expect(translated).not.toContain('"weightedFiveElements"');
    expect(translated).not.toMatch(/"[A-Za-z][^"]*":/);
  });

  it('rejects non-object content', () => {
    expect(() => normalizeShortTermFortuneResult(null, context)).toThrow('有效对象');
  });
});
