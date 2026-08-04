import { describe, expect, it } from 'vitest';
import { Gender, type BaziProfile } from '../types';
import { generateFortunePeriodContext } from './fortunePeriodCalculator';
import { calculateLocalFortuneScores, LOCAL_SCORE_CAPS } from './localFortuneScoreCalculator';

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

describe('localFortuneScoreCalculator', () => {
  it('calculates versioned weekly scores with a layer breakdown', () => {
    const context = generateFortunePeriodContext(profile, 'week', '2026-08-03');
    const scores = calculateLocalFortuneScores(context);

    expect(scores.ruleVersion).toBe('lifekline-short-score-v4');
    expect(scores.timeline.map(item => item.score)).toEqual([59, 56, 39, 23, 37, 37, 37]);
    expect(scores.timeline[0].breakdown).toMatchObject({
      base: 50,
      daYunAdjustment: -2,
      liuNianAdjustment: 2,
      liuYueAdjustment: -4,
      liuRiAdjustment: 13,
      finalScore: 59,
    });
    expect(scores.dimensions).toEqual({ career: 45, wealth: 48, relationship: 49, health: 35 });
    expect(scores.overallScore).toBe(42);
    expect(scores.trend).toBe('volatile');
    expect(Object.values(LOCAL_SCORE_CAPS).reduce((total, value) => total + value, 0)).toBe(50);
    expect(scores.timeline[0].breakdown.evidence[1]).toContain('值太岁');
    expect(scores.timeline[0].breakdown.evidence[1]).toContain('关系风险-3');
  });

  it('separates favorable layers from po-tai-sui relation risk', () => {
    const autoProfile: BaziProfile = {
      version: 1,
      source: 'auto',
      name: 'Misty',
      gender: Gender.FEMALE,
      birthDate: '1987-10-19',
      birthTime: '10:30',
      cityName: '武汉',
      longitude: 114.31,
      updatedAt: '2026-08-05T00:00:00.000Z',
    };
    const context = generateFortunePeriodContext(autoProfile, 'week', '2026-08-05');
    const scores = calculateLocalFortuneScores(context);
    const firstDay = scores.timeline[0].breakdown;

    expect(context.baziInteractions.natalPillars.map(item => item.analysis.ganZhi)).toEqual(['丁卯', '庚戌', '辛丑', '癸巳']);
    expect(firstDay).toMatchObject({ daYunAdjustment: 2, liuNianAdjustment: 3, liuYueAdjustment: 6, liuRiAdjustment: 4, interactionAdjustment: 6, finalScore: 71 });
    expect(firstDay.evidence[0]).toContain('喜忌+4，关系风险-2');
    expect(firstDay.evidence[1]).toContain('破太岁');
    expect(firstDay.evidence[1]).toContain('喜忌+6，关系风险-3');
  });
});
