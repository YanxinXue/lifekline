import {
  FortuneFavorability,
  FortunePeriodContext,
  LocalFortuneScores,
  LocalScoreBreakdown,
  BaziRelation,
  PeriodGanZhiAnalysis,
  TenGodCategory,
} from '../types';
import { buildTimelineRanges } from './fortunePeriodCalculator';

const clampScore = (value: number) => Math.round(Math.min(100, Math.max(0, value)));
const average = (values: number[]) => values.length
  ? values.reduce((total, value) => total + value, 0) / values.length
  : 50;

const FAVORABILITY_VALUE: Record<FortuneFavorability, number> = {
  有利: 1,
  不利: -1,
  中性: 0,
  混合: 0,
};

export const LOCAL_SCORE_CAPS = {
  daYun: 6,
  liuNian: 8,
  liuYue: 10,
  liuRi: 20,
  interaction: 6,
} as const;

const RELATION_RISK_CAPS = {
  daYun: 2,
  liuNian: 3,
  liuYue: 4,
  liuRi: 6,
} as const;

const ADVERSE_RELATION_WEIGHTS: Partial<Record<BaziRelation['kind'], number>> = {
  天干相冲: 1,
  地支相冲: 2,
  地支相刑: 2,
  地支相害: 1,
  地支相破: 1,
};

const TAI_SUI_LABELS: Partial<Record<BaziRelation['kind'], string>> = {
  地支相冲: '冲太岁',
  地支相刑: '刑太岁',
  地支相害: '害太岁',
  地支相破: '破太岁',
};

const calculateRelationRisk = (
  period: PeriodGanZhiAnalysis,
  maximum: number,
  natalYearBranch?: string,
) => {
  const riskRelations = period.relations.filter(relation => ADVERSE_RELATION_WEIGHTS[relation.kind]);
  const riskLabels = riskRelations.map(relation => relation.detail);
  let riskScore = riskRelations.reduce((total, relation) => total + (ADVERSE_RELATION_WEIGHTS[relation.kind] || 0), 0);

  if (period.label === '流年' && period.analysis && natalYearBranch) {
    if (period.analysis.branch.value === natalYearBranch) {
      riskScore += 2;
      riskLabels.unshift('值太岁');
    } else {
      const taiSuiRelation = riskRelations.find(relation => relation.participants.includes('年柱') && TAI_SUI_LABELS[relation.kind]);
      const taiSuiLabel = taiSuiRelation ? TAI_SUI_LABELS[taiSuiRelation.kind] : null;
      if (taiSuiLabel) {
        riskScore += 2;
        riskLabels.unshift(taiSuiLabel);
      }
    }
  }

  return {
    adjustment: -Math.min(maximum, riskScore),
    labels: Array.from(new Set(riskLabels)),
  };
};

const scoreLayer = (
  period: PeriodGanZhiAnalysis,
  maximum: number,
  upperLayerAdjustments: number[] = [],
  relationRiskMaximum = 0,
  natalYearBranch?: string,
) => {
  if (!period.evidence) return { adjustment: 0, evidence: `${period.label}缺少有效干支，按中性处理` };
  const stemValue = FAVORABILITY_VALUE[period.evidence.stemFavorability];
  const branchValue = FAVORABILITY_VALUE[period.evidence.branchMainFavorability];
  const combinedValue = stemValue + branchValue;
  const relationRisk = calculateRelationRisk(period, relationRiskMaximum, natalYearBranch);
  if (combinedValue === 0) {
    const relationEvidence = relationRisk.adjustment
      ? `关系风险${relationRisk.adjustment}（${relationRisk.labels.join('、')}）`
      : '关系风险+0';
    return {
      adjustment: relationRisk.adjustment,
      evidence: `${period.label}${period.ganZhi}：天干${period.evidence.stemCategory}${period.evidence.stemFavorability}、地支主气${period.evidence.branchMainCategory}${period.evidence.branchMainFavorability}，喜忌抵消或中性，${relationEvidence}，净调整${relationRisk.adjustment >= 0 ? '+' : ''}${relationRisk.adjustment}`,
    };
  }

  const direction = combinedValue > 0 ? 1 : -1;
  const sameDirection = stemValue === direction && branchValue === direction;
  const alignedUpperLayerCount = upperLayerAdjustments.filter(value => Math.sign(value) === direction).length;
  let strength = sameDirection ? 0.6 : 0.35;
  if (sameDirection && alignedUpperLayerCount === 1) strength = 0.8;
  if (sameDirection && alignedUpperLayerCount >= 2) strength = 1;
  const favorabilityAdjustment = Math.round(maximum * direction * strength);
  const adjustment = Math.max(-maximum, Math.min(maximum, favorabilityAdjustment + relationRisk.adjustment));
  const strengthLabel = strength === 1 ? '满额触发' : `${Math.round(strength * 100)}%强度`;
  const relationEvidence = relationRisk.adjustment
    ? `，关系风险${relationRisk.adjustment}（${relationRisk.labels.join('、')}）`
    : '，关系风险+0';
  return {
    adjustment,
    evidence: `${period.label}${period.ganZhi}：天干${period.evidence.stemCategory}${period.evidence.stemFavorability}、地支主气${period.evidence.branchMainCategory}${period.evidence.branchMainFavorability}，按${strengthLabel}计算喜忌${favorabilityAdjustment >= 0 ? '+' : ''}${favorabilityAdjustment}${relationEvidence}，净调整${adjustment >= 0 ? '+' : ''}${adjustment}`,
  };
};

const calculateInteractionAdjustment = (adjustments: number[]) => {
  const positiveCount = adjustments.filter(value => value > 0).length;
  const negativeCount = adjustments.filter(value => value < 0).length;
  if (positiveCount >= 3) return Math.min(LOCAL_SCORE_CAPS.interaction, (positiveCount - 2) * 3);
  if (negativeCount >= 3) return -Math.min(LOCAL_SCORE_CAPS.interaction, (negativeCount - 2) * 3);
  return 0;
};

const scoreDay = (
  context: FortunePeriodContext,
  day: FortunePeriodContext['baziInteractions']['days'][number],
): LocalScoreBreakdown => {
  const interactions = context.baziInteractions;
  const month = interactions.liuYueSegments.find(segment => (
    `${day.date} 12:00:00` >= segment.startDateTime && `${day.date} 12:00:00` <= segment.endDateTime
  )) || interactions.liuYueSegments[0];
  const natalYearBranch = interactions.natalPillars[0]?.analysis.branch.value;
  const daYun = scoreLayer(interactions.daYun, LOCAL_SCORE_CAPS.daYun, [], RELATION_RISK_CAPS.daYun);
  const liuNian = scoreLayer(
    interactions.liuNian,
    LOCAL_SCORE_CAPS.liuNian,
    [daYun.adjustment],
    RELATION_RISK_CAPS.liuNian,
    natalYearBranch,
  );
  const liuYue = month
    ? scoreLayer(month, LOCAL_SCORE_CAPS.liuYue, [daYun.adjustment, liuNian.adjustment], RELATION_RISK_CAPS.liuYue)
    : { adjustment: 0, evidence: '当前日期未匹配流月，按中性处理' };
  const liuRi = scoreLayer(
    day,
    LOCAL_SCORE_CAPS.liuRi,
    [daYun.adjustment, liuNian.adjustment, liuYue.adjustment],
    RELATION_RISK_CAPS.liuRi,
  );
  const interactionAdjustment = calculateInteractionAdjustment([
    daYun.adjustment,
    liuNian.adjustment,
    liuYue.adjustment,
    liuRi.adjustment,
  ]);
  const finalScore = clampScore(50 + daYun.adjustment + liuNian.adjustment + liuYue.adjustment + liuRi.adjustment + interactionAdjustment);
  return {
    base: 50,
    daYunAdjustment: daYun.adjustment,
    liuNianAdjustment: liuNian.adjustment,
    liuYueAdjustment: liuYue.adjustment,
    liuRiAdjustment: liuRi.adjustment,
    interactionAdjustment,
    finalScore,
    evidence: [daYun.evidence, liuNian.evidence, liuYue.evidence, liuRi.evidence,
      `同向层级联动调整${interactionAdjustment >= 0 ? '+' : ''}${interactionAdjustment}`],
  };
};

const averageBreakdowns = (items: LocalScoreBreakdown[]): LocalScoreBreakdown => {
  const value = (selector: (item: LocalScoreBreakdown) => number) => Math.round(average(items.map(selector)));
  return {
    base: 50,
    daYunAdjustment: value(item => item.daYunAdjustment),
    liuNianAdjustment: value(item => item.liuNianAdjustment),
    liuYueAdjustment: value(item => item.liuYueAdjustment),
    liuRiAdjustment: value(item => item.liuRiAdjustment),
    interactionAdjustment: value(item => item.interactionAdjustment),
    finalScore: value(item => item.finalScore),
    evidence: [`本阶段按所覆盖的${items.length}个流日逐日计算后取平均值`],
  };
};

const favorabilityForCategory = (period: PeriodGanZhiAnalysis, categories: TenGodCategory[]) => {
  if (!period.evidence) return 0;
  let value = 0;
  if (categories.includes(period.evidence.stemCategory)) value += FAVORABILITY_VALUE[period.evidence.stemFavorability];
  if (categories.includes(period.evidence.branchMainCategory)) value += FAVORABILITY_VALUE[period.evidence.branchMainFavorability];
  return value;
};

const dimensionSignal = (context: FortunePeriodContext, categories: TenGodCategory[]) => {
  const periods: PeriodGanZhiAnalysis[] = [
    context.baziInteractions.daYun,
    context.baziInteractions.liuNian,
    ...context.baziInteractions.liuYueSegments,
    ...context.baziInteractions.days,
  ];
  return Math.max(-8, Math.min(8, periods.reduce((total, period) => total + favorabilityForCategory(period, categories), 0)));
};

const calculateTrend = (scores: number[], overallScore: number): LocalFortuneScores['trend'] => {
  const range = scores.length ? Math.max(...scores) - Math.min(...scores) : 0;
  if (range >= 18) return 'volatile';
  if (overallScore < 45) return 'cautious';
  const midpoint = Math.max(1, Math.floor(scores.length / 2));
  if (overallScore >= 70 && average(scores.slice(midpoint)) >= average(scores.slice(0, midpoint)) + 3) return 'up';
  return 'stable';
};

export const calculateLocalFortuneScores = (context: FortunePeriodContext): LocalFortuneScores => {
  const dayBreakdowns = context.baziInteractions.days.map(day => ({ date: day.date, breakdown: scoreDay(context, day) }));
  const timelineRanges = buildTimelineRanges(context);
  const timeline = timelineRanges.map(dateRange => {
    const [startDate, endDate = startDate] = dateRange.split(' 至 ');
    const covered = dayBreakdowns.filter(item => item.date >= startDate && item.date <= endDate).map(item => item.breakdown);
    const breakdown = covered.length === 1 ? covered[0] : averageBreakdowns(covered);
    return { dateRange, score: breakdown.finalScore, breakdown };
  });
  const timelineAverage = average(timeline.map(item => item.score));
  const interactions = context.baziInteractions;
  const career = clampScore(timelineAverage + dimensionSignal(context, ['官杀', '印', '食伤']) - Math.min(4, interactions.ruleInsights.careerRiskFlags.length * 2));
  const wealth = clampScore(timelineAverage + dimensionSignal(context, ['财', '食伤']) - Math.min(4, interactions.ruleInsights.wealthFlags.filter(flag => flag.includes('风险')).length * 2));
  const spouseTriggerCount = interactions.days.filter(day => day.evidence?.spousePalaceTriggered).length;
  const relationship = clampScore(timelineAverage + dimensionSignal(context, [interactions.ruleInsights.relationshipStar]) + Math.min(4, spouseTriggerCount));
  const imbalanceCount = Object.values(interactions.fiveElementStatus).filter(status => status === '偏缺' || status === '过旺').length;
  const adverseRelationCount = interactions.days.flatMap(day => day.relations)
    .filter(relation => ['地支相冲', '地支相刑', '地支相害', '地支相破'].includes(relation.kind)).length;
  const health = clampScore(timelineAverage - Math.min(6, imbalanceCount * 2) - Math.min(6, adverseRelationCount));
  const dimensions = { career, wealth, relationship, health };
  const overallScore = clampScore(timelineAverage * 0.6 + average(Object.values(dimensions)) * 0.4);
  return {
    ruleVersion: 'lifekline-short-score-v4',
    timeline,
    dimensions,
    overallScore,
    trend: calculateTrend(timeline.map(item => item.score), overallScore),
    calculationBoundary: '分数由本地版本化规则先计算喜忌方向，再以冲、刑、害、破形成有限关系风险修正；合、六合、三合、三会不自动加分，太岁关系不单独决定全年吉凶，所有关系均不得映射为确定事件。',
  };
};
