import { describe, expect, it } from 'vitest';
import { Gender, type BaziProfile } from '../types';
import { generateFortunePeriodContext } from './fortunePeriodCalculator';
import { normalizeShortTermFortuneResult, parseShortTermFortuneContent } from './shortTermFortuneService';

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
  it('clamps scores, ignores AI date ranges and fixes timeline length', () => {
    const result = normalizeShortTermFortuneResult({
      overallScore: 180,
      trend: 'unknown',
      timeline: [{ dateRange: '被模型修改', score: -20, title: '第一天', analysis: '分析' }],
      opportunities: ['一', '二', '三', '四'],
    }, context);

    expect(result.overallScore).toBe(100);
    expect(result.trend).toBe('stable');
    expect(result.timeline).toHaveLength(7);
    expect(result.timeline[0].dateRange).toBe('2026-08-03');
    expect(result.timeline[0].score).toBe(0);
    expect(result.opportunities).toEqual(['一', '二', '三']);
    expect(result.disclaimer).toContain('文化参考');
  });

  it('extracts JSON from a markdown code block', () => {
    const result = parseShortTermFortuneContent('```json\n{"overallScore":66,"timeline":[]}\n```', context);
    expect(result.overallScore).toBe(66);
    expect(result.period).toBe(context);
  });

  it('rejects non-object content', () => {
    expect(() => normalizeShortTermFortuneResult(null, context)).toThrow('有效对象');
  });
});
