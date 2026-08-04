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
    expect(interactions.weightedFiveElements).toEqual({ 木: 2.3, 火: 1.7, 土: 1, 金: 1.1, 水: 1.9 });
    expect(interactions.fiveElementStatus).toEqual({ 木: '平衡', 火: '平衡', 土: '偏弱', 金: '偏弱', 水: '平衡' });
    expect(interactions.tenGodCategoryScores).toEqual({ 比劫: 1.3, 食伤: 1.7, 财: 1, 官杀: 1.1, 印: 1.9 });
    expect(interactions.strength).toEqual({
      sameScore: 2.3,
      resourceScore: 1.9,
      outputScore: 1.7,
      wealthScore: 1,
      authorityScore: 1.1,
      monthBonus: 1.2,
      supportTotal: 5.4,
      drainTotal: 3.8,
      ratio: 0.587,
      level: '偏强',
    });
    expect(interactions.structure).toEqual({
      type: '正格',
      subtype: '扶抑正格',
      baseSupportRatio: 0.525,
      visibleSupportCount: 1,
      rootSupportCount: 3,
    });
    expect(interactions.favorable).toEqual({
      categories: ['食伤', '财', '官杀'],
      unfavorableCategories: ['比劫', '印'],
      elements: ['火', '土', '金'],
      unfavorableElements: ['木', '水'],
    });
    expect(interactions.tenGodDominance).toMatchObject({ dominant: '印', secondary: '食伤' });
    expect(interactions.shenSha).toEqual({
      peachBlossom: { targets: ['卯', '酉'], natalHits: [] },
      tianYi: { targets: ['丑', '未'], natalHits: ['时支'] },
    });
    expect(interactions.ruleInsights).toMatchObject({
      careerAxis: '管理制度型',
      wealthMode: '财不是核心驱动力',
      relationshipStar: '财',
    });
    expect(interactions.days[0].evidence).toMatchObject({
      stemCategory: '财',
      branchMainCategory: '官杀',
      combinedFavorability: '有利',
    });
    expect(interactions.calculationConvention).toEqual({
      version: 'lifekline-bazi-v2',
      yearBoundary: '立春',
      monthBoundary: '十二节',
      dayBoundary: '23:00子初',
      timeBasis: '真太阳时',
    });
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
