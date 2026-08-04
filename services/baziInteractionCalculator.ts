import {
  BaziGanZhiAnalysis,
  BaziInteractionContext,
  BaziRelation,
  FiveElement,
  FortunePeriodContext,
  PeriodGanZhiAnalysis,
  ResolvedBaziProfile,
  TenGod,
  YinYang,
} from '../types';

const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

const STEM_META: Record<string, { element: FiveElement; yinYang: YinYang }> = {
  甲: { element: '木', yinYang: '阳' }, 乙: { element: '木', yinYang: '阴' },
  丙: { element: '火', yinYang: '阳' }, 丁: { element: '火', yinYang: '阴' },
  戊: { element: '土', yinYang: '阳' }, 己: { element: '土', yinYang: '阴' },
  庚: { element: '金', yinYang: '阳' }, 辛: { element: '金', yinYang: '阴' },
  壬: { element: '水', yinYang: '阳' }, 癸: { element: '水', yinYang: '阴' },
};

const HIDDEN_STEMS: Record<string, string[]> = {
  子: ['癸'], 丑: ['己', '癸', '辛'], 寅: ['甲', '丙', '戊'], 卯: ['乙'],
  辰: ['戊', '乙', '癸'], 巳: ['丙', '戊', '庚'], 午: ['丁', '己'], 未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'], 酉: ['辛'], 戌: ['戊', '辛', '丁'], 亥: ['壬', '甲'],
};

const GENERATES: Record<FiveElement, FiveElement> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
const CONTROLS: Record<FiveElement, FiveElement> = { 木: '土', 火: '金', 土: '水', 金: '木', 水: '火' };

const pairKey = (left: string, right: string) => [left, right].sort().join('');
const pairSet = (pairs: string[][]) => new Set(pairs.map(([left, right]) => pairKey(left, right)));

const STEM_COMBINES = pairSet([['甲', '己'], ['乙', '庚'], ['丙', '辛'], ['丁', '壬'], ['戊', '癸']]);
const STEM_CLASHES = pairSet([['甲', '庚'], ['乙', '辛'], ['丙', '壬'], ['丁', '癸']]);
const BRANCH_COMBINES = pairSet([['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]);
const BRANCH_CLASHES = pairSet([['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]);
const BRANCH_HARMS = pairSet([['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']]);
const BRANCH_BREAKS = pairSet([['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌']]);
const BRANCH_PUNISHMENTS = pairSet([['子', '卯'], ['寅', '巳'], ['巳', '申'], ['申', '寅'], ['丑', '戌'], ['戌', '未'], ['未', '丑']]);
const SELF_PUNISHMENTS = new Set(['辰', '午', '酉', '亥']);
const THREE_HARMONIES = [
  { branches: ['申', '子', '辰'], element: '水' },
  { branches: ['亥', '卯', '未'], element: '木' },
  { branches: ['寅', '午', '戌'], element: '火' },
  { branches: ['巳', '酉', '丑'], element: '金' },
] as const;
const THREE_MEETINGS = [
  { branches: ['亥', '子', '丑'], element: '水' },
  { branches: ['寅', '卯', '辰'], element: '木' },
  { branches: ['巳', '午', '未'], element: '火' },
  { branches: ['申', '酉', '戌'], element: '金' },
] as const;

interface ActiveGanZhi {
  label: string;
  ganZhi: string;
}

const isGanZhi = (value: string) => value.length === 2 && STEMS.includes(value[0] as typeof STEMS[number]) && BRANCHES.includes(value[1] as typeof BRANCHES[number]);

export const getTenGod = (dayMaster: string, targetStem: string): TenGod => {
  const day = STEM_META[dayMaster];
  const target = STEM_META[targetStem];
  if (!day || !target) throw new Error('无法计算十神：天干无效');
  const samePolarity = day.yinYang === target.yinYang;

  if (day.element === target.element) return samePolarity ? '比肩' : '劫财';
  if (GENERATES[day.element] === target.element) return samePolarity ? '食神' : '伤官';
  if (GENERATES[target.element] === day.element) return samePolarity ? '偏印' : '正印';
  if (CONTROLS[day.element] === target.element) return samePolarity ? '偏财' : '正财';
  return samePolarity ? '七杀' : '正官';
};

export const analyzeGanZhi = (ganZhi: string, dayMaster: string): BaziGanZhiAnalysis => {
  if (!isGanZhi(ganZhi)) throw new Error(`干支无效：${ganZhi}`);
  const stem = ganZhi[0];
  const branch = ganZhi[1];
  const stemMeta = STEM_META[stem];
  const hiddenStems = HIDDEN_STEMS[branch];
  const mainHiddenMeta = STEM_META[hiddenStems[0]];

  return {
    ganZhi,
    stem: { value: stem, ...stemMeta, tenGod: getTenGod(dayMaster, stem) },
    branch: {
      value: branch,
      element: mainHiddenMeta.element,
      hiddenStems: hiddenStems.map(value => ({ value, ...STEM_META[value], tenGod: getTenGod(dayMaster, value) })),
    },
  };
};

const buildRelation = (kind: BaziRelation['kind'], participants: string[], detail: string): BaziRelation => ({ kind, participants, detail });

const calculatePairRelations = (sources: ActiveGanZhi[]) => {
  const relations: BaziRelation[] = [];
  for (let leftIndex = 0; leftIndex < sources.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < sources.length; rightIndex += 1) {
      const left = sources[leftIndex];
      const right = sources[rightIndex];
      if (!isGanZhi(left.ganZhi) || !isGanZhi(right.ganZhi)) continue;
      const stems = pairKey(left.ganZhi[0], right.ganZhi[0]);
      const branches = pairKey(left.ganZhi[1], right.ganZhi[1]);
      const participants = [left.label, right.label];
      if (STEM_COMBINES.has(stems)) relations.push(buildRelation('天干五合', participants, `${left.ganZhi[0]}${right.ganZhi[0]}相合`));
      if (STEM_CLASHES.has(stems)) relations.push(buildRelation('天干相冲', participants, `${left.ganZhi[0]}${right.ganZhi[0]}相冲`));
      if (BRANCH_COMBINES.has(branches)) relations.push(buildRelation('地支六合', participants, `${left.ganZhi[1]}${right.ganZhi[1]}六合`));
      if (BRANCH_CLASHES.has(branches)) relations.push(buildRelation('地支相冲', participants, `${left.ganZhi[1]}${right.ganZhi[1]}相冲`));
      if (BRANCH_HARMS.has(branches)) relations.push(buildRelation('地支相害', participants, `${left.ganZhi[1]}${right.ganZhi[1]}相害`));
      if (BRANCH_BREAKS.has(branches)) relations.push(buildRelation('地支相破', participants, `${left.ganZhi[1]}${right.ganZhi[1]}相破`));
      if (BRANCH_PUNISHMENTS.has(branches)) relations.push(buildRelation('地支相刑', participants, `${left.ganZhi[1]}${right.ganZhi[1]}相刑`));
      if (left.ganZhi[1] === right.ganZhi[1] && SELF_PUNISHMENTS.has(left.ganZhi[1])) {
        relations.push(buildRelation('地支相刑', participants, `${left.ganZhi[1]}${right.ganZhi[1]}自刑`));
      }
    }
  }
  return relations;
};

const calculateGroupRelations = (sources: ActiveGanZhi[]) => {
  const relations: BaziRelation[] = [];
  const firstSourceByBranch = new Map<string, ActiveGanZhi>();
  sources.forEach(source => {
    if (isGanZhi(source.ganZhi) && !firstSourceByBranch.has(source.ganZhi[1])) firstSourceByBranch.set(source.ganZhi[1], source);
  });

  THREE_HARMONIES.forEach(group => {
    if (group.branches.every(branch => firstSourceByBranch.has(branch))) {
      const participants = group.branches.map(branch => firstSourceByBranch.get(branch)?.label || branch);
      relations.push(buildRelation('地支三合', participants, `${group.branches.join('')}三合${group.element}局`));
    }
  });
  THREE_MEETINGS.forEach(group => {
    if (group.branches.every(branch => firstSourceByBranch.has(branch))) {
      const participants = group.branches.map(branch => firstSourceByBranch.get(branch)?.label || branch);
      relations.push(buildRelation('地支三会', participants, `${group.branches.join('')}三会${group.element}局`));
    }
  });
  return relations;
};

const calculateRelations = (sources: ActiveGanZhi[]) => [...calculatePairRelations(sources), ...calculateGroupRelations(sources)];

const analyzePeriodLayer = (
  label: string,
  ganZhi: string,
  dayMaster: string,
  previousSources: ActiveGanZhi[],
): PeriodGanZhiAnalysis => {
  const current = { label, ganZhi };
  if (!isGanZhi(ganZhi)) return { ...current, analysis: null, relations: [] };
  const relations = calculateRelations([...previousSources, current]).filter(relation => relation.participants.includes(label));
  return { ...current, analysis: analyzeGanZhi(ganZhi, dayMaster), relations };
};

const describeMonthCommand = (monthElement: FiveElement, dayElement: FiveElement) => {
  if (monthElement === dayElement) return '月令主气与日主同五行';
  if (GENERATES[monthElement] === dayElement) return '月令主气生扶日主';
  if (GENERATES[dayElement] === monthElement) return '日主生月令主气';
  if (CONTROLS[monthElement] === dayElement) return '月令主气克制日主';
  return '日主克制月令主气';
};

const findLiuYueForDate = (context: Pick<FortunePeriodContext, 'liuYueSegments'>, date: string) => {
  const noon = `${date} 12:00:00`;
  return context.liuYueSegments.find(segment => noon >= segment.startDateTime && noon <= segment.endDateTime) || context.liuYueSegments[0];
};

export const calculateBaziInteractions = (
  profile: ResolvedBaziProfile,
  context: Pick<FortunePeriodContext, 'daYun' | 'liuNian' | 'liuYueSegments' | 'days'>,
): BaziInteractionContext => {
  const natalSources: ActiveGanZhi[] = [
    { label: '年柱', ganZhi: profile.yearPillar },
    { label: '月柱', ganZhi: profile.monthPillar },
    { label: '日柱', ganZhi: profile.dayPillar },
    { label: '时柱', ganZhi: profile.hourPillar },
  ];
  natalSources.forEach(source => {
    if (!isGanZhi(source.ganZhi)) throw new Error(`${source.label}干支无效`);
  });

  const dayMaster = profile.dayPillar[0];
  const dayMasterMeta = STEM_META[dayMaster];
  const natalPillars = natalSources.map(source => ({ label: source.label, analysis: analyzeGanZhi(source.ganZhi, dayMaster) }));
  const elementCounts: Record<FiveElement, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  natalPillars.forEach(pillar => {
    elementCounts[pillar.analysis.stem.element] += 1;
    pillar.analysis.branch.hiddenStems.forEach(hiddenStem => { elementCounts[hiddenStem.element] += 1; });
  });

  const daYun = analyzePeriodLayer('大运', context.daYun, dayMaster, natalSources);
  const daYunSource = isGanZhi(context.daYun) ? [{ label: '大运', ganZhi: context.daYun }] : [];
  const liuNianPrevious = [...natalSources, ...daYunSource];
  const liuNian = analyzePeriodLayer('流年', context.liuNian, dayMaster, liuNianPrevious);
  const commonPeriodSources = [...liuNianPrevious, { label: '流年', ganZhi: context.liuNian }];

  const liuYueSegments = context.liuYueSegments.map(segment => {
    const label = `流月${segment.startDateTime.slice(0, 10)}`;
    return {
      ...analyzePeriodLayer(label, segment.ganZhi, dayMaster, commonPeriodSources),
      startDateTime: segment.startDateTime,
      endDateTime: segment.endDateTime,
    };
  });

  const days = context.days.map(day => {
    const liuYue = findLiuYueForDate(context, day.date);
    const previousSources = liuYue
      ? [...commonPeriodSources, { label: '流月', ganZhi: liuYue.ganZhi }]
      : commonPeriodSources;
    const label = `流日${day.date}`;
    return {
      ...analyzePeriodLayer(label, day.ganZhi, dayMaster, previousSources),
      date: day.date,
      weekday: day.weekday,
    };
  });

  const monthPillar = natalPillars[1].analysis;
  return {
    ruleVersion: 'ziping-common-v1',
    dayMaster: { value: dayMaster, ...dayMasterMeta },
    monthCommand: {
      branch: monthPillar.branch.value,
      mainElement: monthPillar.branch.element,
      relationToDayMaster: describeMonthCommand(monthPillar.branch.element, dayMasterMeta.element),
    },
    elementCounts,
    elementCountBasis: '四柱天干与地支藏干的出现次数，不代表旺衰权重或喜用神结论',
    natalPillars,
    natalRelations: calculateRelations(natalSources),
    daYun,
    liuNian,
    liuYueSegments,
    days,
    interpretationBoundary: '本地仅确定历法、十神、藏干、五行方向和合冲刑害等结构关系；旺衰、格局、喜忌与事件映射属于传统命理解读，不是客观预测。',
  };
};
