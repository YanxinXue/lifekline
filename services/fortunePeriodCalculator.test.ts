import { describe, expect, it } from 'vitest';
import { Gender, type BaziProfile } from '../types';
import {
  buildTimelineRanges,
  generateFortunePeriodContext,
  getSolarMonthRange,
  getSolarMonthOptions,
  getWeekDateRange,
  shiftPeriodReferenceDate,
} from './fortunePeriodCalculator';

const manualProfile: BaziProfile = {
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

const automaticProfile: BaziProfile = {
  version: 1,
  source: 'auto',
  name: '',
  gender: Gender.MALE,
  birthDate: '1986-09-22',
  birthTime: '10:30',
  cityName: '武汉',
  longitude: 114.3,
  updatedAt: '2026-08-03T00:00:00.000Z',
};

describe('fortunePeriodCalculator', () => {
  it('uses Monday through Sunday across calendar years', () => {
    expect(getWeekDateRange('2026-01-01')).toEqual({ startDate: '2025-12-29', endDate: '2026-01-04' });
    expect(getWeekDateRange('2026-01-04')).toEqual({ startDate: '2025-12-29', endDate: '2026-01-04' });
  });

  it('uses exact Jie boundaries for solar months', () => {
    const beforeLiQiu = getSolarMonthRange('2026-08-03');
    expect(beforeLiQiu.startDateTime).toBe('2026-07-07 09:56:57');
    expect(beforeLiQiu.endDateTime).toBe('2026-08-07 19:42:43');

    const afterLiQiu = getSolarMonthRange('2026-08-08');
    expect(afterLiQiu.startDateTime).toBe('2026-08-07 19:42:43');
    expect(afterLiQiu.endDateTime).toBe('2026-09-07 22:41:16');
  });

  it('builds human-readable solar month options instead of calendar month labels', () => {
    const options = getSolarMonthOptions(2026);
    expect(options).toHaveLength(36);
    expect(options.find(option => option.startDateTime.startsWith('2026-02-04'))?.label).toBe('2026年 · 立春寅月（庚寅）');
    expect(options.find(option => option.startDateTime.startsWith('2026-07-07'))).toMatchObject({
      label: '2026年 · 小暑未月（乙未）',
      value: '2026-07-08',
    });
  });

  it('splits a week that crosses Li Qiu into two Liu Yue segments', () => {
    const context = generateFortunePeriodContext(manualProfile, 'week', '2026-08-03');
    expect(context.startDateTime).toBe('2026-08-03 00:00:00');
    expect(context.endDateTime).toBe('2026-08-09 23:59:59');
    expect(context.days).toHaveLength(7);
    expect(context.liuYueSegments.map(segment => segment.ganZhi)).toEqual(['乙未', '丙申']);
    expect(context.daYunBasis).toBe('manual-age-range');
  });

  it('moves between adjacent periods and builds deterministic timeline slots', () => {
    const week = generateFortunePeriodContext(manualProfile, 'week', '2026-08-03');
    expect(shiftPeriodReferenceDate(week, 1)).toBe('2026-08-10');
    expect(buildTimelineRanges(week)).toHaveLength(7);

    const month = generateFortunePeriodContext(manualProfile, 'month', '2026-08-08');
    expect(month.liuYueSegments.map(segment => segment.ganZhi)).toEqual(['丙申']);
    expect(shiftPeriodReferenceDate(month, -1)).toBe('2026-08-06');
    expect(shiftPeriodReferenceDate(month, 1)).toBe('2026-09-08');
    expect(buildTimelineRanges(month).length).toBeGreaterThanOrEqual(4);
    expect(buildTimelineRanges(month).length).toBeLessThanOrEqual(6);
  });

  it('switches Liu Nian at Li Chun and exact Da Yun at the calculated start date', () => {
    expect(generateFortunePeriodContext(manualProfile, 'week', '2026-02-03').liuNian).toBe('乙巳');
    expect(generateFortunePeriodContext(manualProfile, 'week', '2026-02-04').liuNian).toBe('丙午');

    const beforeStart = generateFortunePeriodContext(automaticProfile, 'week', '1992-03-21');
    const afterStart = generateFortunePeriodContext(automaticProfile, 'week', '1992-03-23');
    expect(beforeStart.daYun).toBe('童限');
    expect(afterStart.daYun).toBe('戊戌');
    expect(afterStart.daYunBasis).toBe('exact');
  });
});
