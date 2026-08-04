import { describe, expect, it } from 'vitest';
import { Gender, type ResolvedBaziProfile } from '../types';
import { analyzeGanZhi, calculateBaziInteractions, getTenGod } from './baziInteractionCalculator';

const resolved: ResolvedBaziProfile = {
  profile: {
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
  },
  name: '',
  gender: Gender.MALE,
  birthYear: '1990',
  yearPillar: '庚午',
  monthPillar: '丁亥',
  dayPillar: '甲子',
  hourPillar: '乙丑',
  startAge: '6',
  firstDaYun: '戊子',
};

describe('baziInteractionCalculator', () => {
  it('maps the ten gods relative to a Jia day master', () => {
    expect(['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'].map(stem => getTenGod('甲', stem)))
      .toEqual(['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']);
  });

  it('expands hidden stems with elements and ten gods', () => {
    const analysis = analyzeGanZhi('乙丑', '甲');
    expect(analysis.stem.tenGod).toBe('劫财');
    expect(analysis.branch.hiddenStems.map(item => `${item.value}${item.tenGod}`))
      .toEqual(['己正财', '癸正印', '辛正官']);
  });

  it('calculates natal and layered period relations without deciding auspiciousness', () => {
    const interactions = calculateBaziInteractions(resolved, {
      daYun: '辛卯',
      liuNian: '丙午',
      liuYueSegments: [{ ganZhi: '乙未', startDateTime: '2026-08-03 00:00:00', endDateTime: '2026-08-09 23:59:59' }],
      days: [{ date: '2026-08-03', weekday: '星期一', ganZhi: '戊申' }],
    });

    expect(interactions.dayMaster).toEqual({ value: '甲', element: '木', yinYang: '阳' });
    expect(interactions.monthCommand.relationToDayMaster).toBe('月令主气生扶日主');
    expect(interactions.elementCounts).toEqual({ 木: 3, 火: 2, 土: 2, 金: 2, 水: 3 });
    expect(interactions.natalRelations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: '天干五合', participants: ['年柱', '时柱'] }),
      expect.objectContaining({ kind: '地支相冲', participants: ['年柱', '日柱'] }),
      expect.objectContaining({ kind: '地支六合', participants: ['日柱', '时柱'] }),
    ]));
    expect(interactions.liuYueSegments[0].relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: '地支三合' }),
    ]));
    expect(interactions.interpretationBoundary).toContain('不是客观预测');
  });
});
