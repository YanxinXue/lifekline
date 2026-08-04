import {
  BaziGanZhiAnalysis,
  BaziInteractionContext,
  BaziRelation,
  FiveElement,
  FortunePeriodContext,
  PeriodGanZhiAnalysis,
  ResolvedBaziProfile,
  TenGod,
  TenGodCategory,
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
const ELEMENTS: FiveElement[] = ['木', '火', '土', '金', '水'];
const TEN_GOD_CATEGORY: Record<TenGod, TenGodCategory> = {
  比肩: '比劫', 劫财: '比劫', 食神: '食伤', 伤官: '食伤',
  偏财: '财', 正财: '财', 七杀: '官杀', 正官: '官杀', 偏印: '印', 正印: '印',
};
const HIDDEN_WEIGHTS: Record<number, number[]> = { 1: [1], 2: [0.7, 0.3], 3: [0.7, 0.2, 0.1] };
const PEACH_MAP: Record<string, string> = {
  申: '酉', 子: '酉', 辰: '酉', 寅: '卯', 午: '卯', 戌: '卯',
  亥: '子', 卯: '子', 未: '子', 巳: '午', 酉: '午', 丑: '午',
};
const TIANYI_MAP: Record<string, string[]> = {
  甲: ['丑', '未'], 戊: ['丑', '未'], 庚: ['丑', '未'], 乙: ['子', '申'], 己: ['子', '申'],
  丙: ['亥', '酉'], 丁: ['亥', '酉'], 辛: ['寅', '午'], 壬: ['卯', '巳'], 癸: ['卯', '巳'],
};
const PERSONALITY_TAGS: Record<TenGodCategory, string[]> = {
  比劫: ['独立', '竞争', '主导'], 食伤: ['表达', '创意', '输出'], 财: ['务实', '结果导向', '资源意识'],
  官杀: ['责任', '规则', '执行'], 印: ['学习', '内省', '稳定'],
};

const roundScore = (value: number) => Math.round(value * 1000) / 1000;
const findGeneratingElement = (target: FiveElement) => ELEMENTS.find(element => GENERATES[element] === target) as FiveElement;
const findControllingElement = (target: FiveElement) => ELEMENTS.find(element => CONTROLS[element] === target) as FiveElement;

const getElementStatus = (score: number): BaziInteractionContext['fiveElementStatus'][FiveElement] => {
  if (score < 1) return '偏缺';
  if (score < 1.5) return '偏弱';
  if (score < 2.5) return '平衡';
  if (score < 3) return '偏旺';
  return '过旺';
};

const getStrengthLevel = (ratio: number): BaziInteractionContext['strength']['level'] => {
  if (ratio >= 0.68) return '强';
  if (ratio >= 0.58) return '偏强';
  if (ratio >= 0.42) return '中和';
  if (ratio >= 0.32) return '偏弱';
  return '弱';
};

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
  if (!isGanZhi(ganZhi)) return { ...current, analysis: null, relations: [], evidence: null };
  const relations = calculateRelations([...previousSources, current]).filter(relation => relation.participants.includes(label));
  return { ...current, analysis: analyzeGanZhi(ganZhi, dayMaster), relations, evidence: null };
};

const describeMonthCommand = (monthElement: FiveElement, dayElement: FiveElement) => {
  if (monthElement === dayElement) return '月令主气与日主同五行';
  if (GENERATES[monthElement] === dayElement) return '月令主气生扶日主';
  if (GENERATES[dayElement] === monthElement) return '日主生月令主气';
  if (CONTROLS[monthElement] === dayElement) return '月令主气克制日主';
  return '日主克制月令主气';
};

const calculateNatalBaseline = (
  natalPillars: BaziInteractionContext['natalPillars'],
  dayElement: FiveElement,
) => {
  const weightedFiveElements: Record<FiveElement, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const tenGodCategoryScores: Record<TenGodCategory, number> = { 比劫: 0, 食伤: 0, 财: 0, 官杀: 0, 印: 0 };

  natalPillars.forEach((pillar, pillarIndex) => {
    weightedFiveElements[pillar.analysis.stem.element] += 1;
    if (pillarIndex !== 2) tenGodCategoryScores[TEN_GOD_CATEGORY[pillar.analysis.stem.tenGod]] += 1;
    const weights = HIDDEN_WEIGHTS[pillar.analysis.branch.hiddenStems.length];
    pillar.analysis.branch.hiddenStems.forEach((hiddenStem, hiddenIndex) => {
      const weight = weights[hiddenIndex];
      weightedFiveElements[hiddenStem.element] += weight;
      tenGodCategoryScores[TEN_GOD_CATEGORY[hiddenStem.tenGod]] += weight;
    });
  });

  ELEMENTS.forEach(element => { weightedFiveElements[element] = roundScore(weightedFiveElements[element]); });
  (Object.keys(tenGodCategoryScores) as TenGodCategory[]).forEach(category => {
    tenGodCategoryScores[category] = roundScore(tenGodCategoryScores[category]);
  });

  const resourceElement = findGeneratingElement(dayElement);
  const outputElement = GENERATES[dayElement];
  const wealthElement = CONTROLS[dayElement];
  const authorityElement = findControllingElement(dayElement);
  const sameScore = weightedFiveElements[dayElement];
  const resourceScore = weightedFiveElements[resourceElement];
  const outputScore = weightedFiveElements[outputElement];
  const wealthScore = weightedFiveElements[wealthElement];
  const authorityScore = weightedFiveElements[authorityElement];
  const monthElement = natalPillars[1].analysis.branch.element;
  const monthBonus = monthElement === dayElement
    ? 1.5
    : monthElement === resourceElement
      ? 1.2
      : monthElement === outputElement
        ? -0.8
        : monthElement === wealthElement
          ? -1
          : -1.2;
  const supportTotal = sameScore + resourceScore + Math.max(monthBonus, 0);
  const drainTotal = outputScore + wealthScore + authorityScore + Math.max(-monthBonus, 0);
  const ratio = supportTotal / (supportTotal + drainTotal);
  const level = getStrengthLevel(ratio);
  const baseTotal = sameScore + resourceScore + outputScore + wealthScore + authorityScore;
  const baseSupportRatio = (sameScore + resourceScore) / baseTotal;
  const supportElements = new Set<FiveElement>([dayElement, resourceElement]);
  const visibleSupportCount = natalPillars.filter((pillar, index) => index !== 2 && supportElements.has(pillar.analysis.stem.element)).length;
  const rootSupportCount = natalPillars.filter(pillar => pillar.analysis.branch.hiddenStems.some(stem => supportElements.has(stem.element))).length;

  let type: BaziInteractionContext['structure']['type'] = '正格';
  let subtype: BaziInteractionContext['structure']['subtype'] = '扶抑正格';
  if (level === '强' && baseSupportRatio >= 0.7 && monthBonus > 0 && outputScore + wealthScore + authorityScore <= 2) {
    type = '从格';
    subtype = '从旺';
  } else if (level === '弱' && baseSupportRatio <= 0.25 && monthBonus < 0 && visibleSupportCount === 0 && rootSupportCount === 0) {
    type = '从格';
    const dominant = ([['食伤', outputScore], ['财', wealthScore], ['官杀', authorityScore]] as const)
      .reduce((best, current) => current[1] > best[1] ? current : best);
    subtype = dominant[0] === '食伤' ? '从儿' : dominant[0] === '财' ? '从财' : '从官杀';
  }

  let categories: TenGodCategory[];
  let unfavorableCategories: TenGodCategory[];
  if (subtype === '从旺') {
    categories = ['比劫', '印'];
    unfavorableCategories = ['食伤', '财', '官杀'];
  } else if (subtype === '从儿' || subtype === '从财' || subtype === '从官杀') {
    categories = [subtype === '从儿' ? '食伤' : subtype === '从财' ? '财' : '官杀'];
    unfavorableCategories = ['比劫', '印'];
  } else if (level === '强' || level === '偏强') {
    categories = ['食伤', '财', '官杀'];
    unfavorableCategories = ['比劫', '印'];
  } else if (level === '弱' || level === '偏弱') {
    categories = ['比劫', '印'];
    unfavorableCategories = ['食伤', '财', '官杀'];
  } else {
    categories = ['财', '官杀', '印'];
    unfavorableCategories = [];
  }

  const categoryElement: Record<TenGodCategory, FiveElement> = {
    比劫: dayElement, 食伤: outputElement, 财: wealthElement, 官杀: authorityElement, 印: resourceElement,
  };
  return {
    weightedFiveElements,
    fiveElementStatus: Object.fromEntries(ELEMENTS.map(element => [element, getElementStatus(weightedFiveElements[element])])) as BaziInteractionContext['fiveElementStatus'],
    tenGodCategoryScores,
    strength: {
      sameScore, resourceScore, outputScore, wealthScore, authorityScore, monthBonus,
      supportTotal: roundScore(supportTotal), drainTotal: roundScore(drainTotal), ratio: roundScore(ratio), level,
    },
    structure: {
      type, subtype, baseSupportRatio: roundScore(baseSupportRatio), visibleSupportCount, rootSupportCount,
    },
    favorable: {
      categories,
      unfavorableCategories,
      elements: categories.map(category => categoryElement[category]),
      unfavorableElements: unfavorableCategories.map(category => categoryElement[category]),
    },
  };
};

const getFavorability = (
  category: TenGodCategory,
  favorable: BaziInteractionContext['favorable'],
) => favorable.categories.includes(category)
  ? '有利' as const
  : favorable.unfavorableCategories.includes(category)
    ? '不利' as const
    : '中性' as const;

const combineFavorability = (
  stem: '有利' | '不利' | '中性',
  branch: '有利' | '不利' | '中性',
): NonNullable<PeriodGanZhiAnalysis['evidence']>['combinedFavorability'] => {
  if (stem === branch) return stem;
  if ((stem === '有利' && branch === '不利') || (stem === '不利' && branch === '有利')) return '混合';
  return stem === '中性' ? branch : stem;
};

const attachPeriodEvidence = (
  period: PeriodGanZhiAnalysis,
  favorable: BaziInteractionContext['favorable'],
): PeriodGanZhiAnalysis => {
  if (!period.analysis) return period;
  const stemCategory = TEN_GOD_CATEGORY[period.analysis.stem.tenGod];
  const branchMainCategory = TEN_GOD_CATEGORY[period.analysis.branch.hiddenStems[0].tenGod];
  const stemFavorability = getFavorability(stemCategory, favorable);
  const branchMainFavorability = getFavorability(branchMainCategory, favorable);
  const triggeredNatalPillars = Array.from(new Set(period.relations.flatMap(relation => relation.participants)
    .filter(participant => ['年柱', '月柱', '日柱', '时柱'].includes(participant))));
  return {
    ...period,
    evidence: {
      stemCategory,
      branchMainCategory,
      stemFavorability,
      branchMainFavorability,
      combinedFavorability: combineFavorability(stemFavorability, branchMainFavorability),
      triggeredNatalPillars,
      spousePalaceTriggered: triggeredNatalPillars.includes('日柱'),
      monthPillarTriggered: triggeredNatalPillars.includes('月柱'),
      hourPillarTriggered: triggeredNatalPillars.includes('时柱'),
    },
  };
};

const calculateRuleInsights = (
  profile: ResolvedBaziProfile,
  natalPillars: BaziInteractionContext['natalPillars'],
  baseline: ReturnType<typeof calculateNatalBaseline>,
) => {
  const ranking = (Object.entries(baseline.tenGodCategoryScores) as Array<[TenGodCategory, number]>)
    .sort((left, right) => right[1] - left[1]);
  const dominant = ranking[0][0];
  const secondary = ranking[1][0];
  const branches = natalPillars.map(pillar => pillar.analysis.branch.value);
  const peachTargets = Array.from(new Set([PEACH_MAP[branches[0]], PEACH_MAP[branches[2]]]));
  const tianYiTargets = TIANYI_MAP[profile.dayPillar[0]];
  const hitPositions = (targets: string[]) => natalPillars
    .filter(pillar => targets.includes(pillar.analysis.branch.value))
    .map(pillar => pillar.label.replace('柱', '支'));
  const peachHits = hitPositions(peachTargets);
  const tianYiHits = hitPositions(tianYiTargets);
  const scores = baseline.tenGodCategoryScores;

  let careerAxis: BaziInteractionContext['ruleInsights']['careerAxis'] = '喜用导向型';
  let careerTags = ['按喜用五行对应的行业、团队和职责优先'];
  if (scores.官杀 + scores.印 >= 3) {
    careerAxis = '管理制度型';
    careerTags = ['管理', '制度', '行政', '法务', '标准化岗位'];
  } else if (scores.食伤 + scores.财 >= 3) {
    careerAxis = '市场经营型';
    careerTags = ['市场', '销售', '产品', '内容', '经营', '创业型岗位'];
  } else if (scores.印 + scores.比劫 >= 3) {
    careerAxis = '研究专业型';
    careerTags = ['研究', '教育', '技术', '咨询', '策划'];
  }
  const careerRiskFlags: string[] = [];
  if (scores.官杀 >= 2.5 && ['弱', '偏弱'].includes(baseline.strength.level)) careerRiskFlags.push('高压规则环境容易放大消耗');
  if (scores.食伤 >= 2.5 && scores.官杀 < 1) careerRiskFlags.push('规则过密的岗位容易限制发挥');

  const wealthMode: BaziInteractionContext['ruleInsights']['wealthMode'] = scores.财 >= 2.5
    ? ['强', '偏强', '中和'].includes(baseline.strength.level) ? '主动经营型' : '有财机但承压明显'
    : scores.财 < 1.2 ? '财不是核心驱动力' : '稳健积累型';
  const wealthFlags: string[] = [];
  if (scores.比劫 - scores.财 >= 1) wealthFlags.push('合伙、人情或竞争性资源消耗风险');
  if (scores.食伤 >= 2 && scores.财 >= 1.5) wealthFlags.push('技能、表达或产品化变现倾向');

  const relationshipStar = profile.gender === 'Male' ? '财' as const : '官杀' as const;
  const relationshipScore = scores[relationshipStar];
  const relationshipFlags: string[] = [];
  if (relationshipScore >= 2 && peachHits.length) relationshipFlags.push('关系机会较活跃但选择成本可能增加');
  else if (relationshipScore < 1) relationshipFlags.push('关系驱动力相对偏弱');
  else relationshipFlags.push('关系发展更依赖阶段匹配与现实条件');
  if (scores.比劫 >= 2 && ['强', '偏强'].includes(baseline.strength.level)) relationshipFlags.push('关系中的主导性较强');
  if (scores.印 >= 2 && ['弱', '偏弱'].includes(baseline.strength.level)) relationshipFlags.push('安全感需求较高');

  return {
    tenGodDominance: { dominant, secondary, ranking: ranking.map(([category, score]) => ({ category, score })) },
    shenSha: {
      peachBlossom: { targets: peachTargets, natalHits: peachHits },
      tianYi: { targets: tianYiTargets, natalHits: tianYiHits },
    },
    ruleInsights: {
      personalityTags: [...PERSONALITY_TAGS[dominant], PERSONALITY_TAGS[secondary][0]],
      careerAxis,
      careerTags,
      careerRiskFlags,
      wealthMode,
      wealthFlags,
      relationshipStar,
      relationshipFlags,
    },
  };
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
  const natalBaseline = calculateNatalBaseline(natalPillars, dayMasterMeta.element);
  const localInsights = calculateRuleInsights(profile, natalPillars, natalBaseline);

  const daYun = attachPeriodEvidence(
    analyzePeriodLayer('大运', context.daYun, dayMaster, natalSources),
    natalBaseline.favorable,
  );
  const daYunSource = isGanZhi(context.daYun) ? [{ label: '大运', ganZhi: context.daYun }] : [];
  const liuNianPrevious = [...natalSources, ...daYunSource];
  const liuNian = attachPeriodEvidence(
    analyzePeriodLayer('流年', context.liuNian, dayMaster, liuNianPrevious),
    natalBaseline.favorable,
  );
  const commonPeriodSources = [...liuNianPrevious, { label: '流年', ganZhi: context.liuNian }];

  const liuYueSegments = context.liuYueSegments.map(segment => {
    const label = `流月${segment.startDateTime.slice(0, 10)}`;
    return {
      ...attachPeriodEvidence(
        analyzePeriodLayer(label, segment.ganZhi, dayMaster, commonPeriodSources),
        natalBaseline.favorable,
      ),
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
      ...attachPeriodEvidence(
        analyzePeriodLayer(label, day.ganZhi, dayMaster, previousSources),
        natalBaseline.favorable,
      ),
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
    ...natalBaseline,
    ...localInsights,
    strengthCalculationBasis: 'Yuan 子平参考口径：明干各 1.0；藏干按 1 个=1.0、2 个=0.7/0.3、3 个=0.7/0.2/0.1 加权；再叠加月令同类+1.5、印星+1.2、食伤-0.8、财星-1.0、官杀-1.2，计算扶抑比值与正格/从格。此为工程化传统命理模型，不是科学测量。',
    calculationConvention: {
      version: 'lifekline-bazi-v2',
      yearBoundary: '立春',
      monthBoundary: '十二节',
      dayBoundary: '23:00子初',
      timeBasis: '真太阳时',
    },
    natalPillars,
    natalRelations: calculateRelations(natalSources),
    daYun,
    liuNian,
    liuYueSegments,
    days,
    interpretationBoundary: '本地确定历法、十神、藏干、加权五行、工程化旺衰格局喜忌和合冲刑害；AI 只能在这些结果上进行传统文化解释，不得重算或覆盖，事件映射不是客观预测。',
  };
};
