
export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
}

export interface UserInput {
  name?: string;
  gender: Gender;
  birthYear: string;   // 出生年份 (如 1990)
  yearPillar: string;  // 年柱
  monthPillar: string; // 月柱
  dayPillar: string;   // 日柱
  hourPillar: string;  // 时柱
  startAge: string;    // 起运年龄 (虚岁) - Changed to string to handle input field state easily, parse later
  firstDaYun: string;  // 第一步大运干支
  
  // New API Configuration Fields
  modelName: string;   // 使用的模型名称
  apiBaseUrl: string;
  apiKey: string;
}

export type BaziProfile =
  | {
      version: 1;
      source: 'auto';
      name: string;
      gender: Gender;
      birthDate: string;
      birthTime: string;
      cityName: string;
      longitude: number;
      updatedAt: string;
    }
  | {
      version: 1;
      source: 'manual';
      name: string;
      gender: Gender;
      birthYear: string;
      yearPillar: string;
      monthPillar: string;
      dayPillar: string;
      hourPillar: string;
      startAge: string;
      firstDaYun: string;
      updatedAt: string;
    };

export interface ResolvedBaziProfile {
  profile: BaziProfile;
  name: string;
  gender: Gender;
  birthYear: string;
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: string;
  firstDaYun: string;
}

export type FortunePeriodType = 'week' | 'month';

export type FiveElement = '木' | '火' | '土' | '金' | '水';
export type YinYang = '阳' | '阴';
export type TenGod = '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财' | '七杀' | '正官' | '偏印' | '正印';
export type TenGodCategory = '比劫' | '食伤' | '财' | '官杀' | '印';
export type FortuneFavorability = '有利' | '不利' | '中性' | '混合';

export interface BaziGanZhiAnalysis {
  ganZhi: string;
  stem: {
    value: string;
    element: FiveElement;
    yinYang: YinYang;
    tenGod: TenGod;
  };
  branch: {
    value: string;
    element: FiveElement;
    hiddenStems: Array<{
      value: string;
      element: FiveElement;
      yinYang: YinYang;
      tenGod: TenGod;
    }>;
  };
}

export interface BaziRelation {
  kind: '天干五合' | '天干相冲' | '地支六合' | '地支相冲' | '地支相刑' | '地支相害' | '地支相破' | '地支三合' | '地支三会';
  participants: string[];
  detail: string;
}

export interface PeriodGanZhiAnalysis {
  label: string;
  ganZhi: string;
  analysis: BaziGanZhiAnalysis | null;
  relations: BaziRelation[];
  evidence: {
    stemCategory: TenGodCategory;
    branchMainCategory: TenGodCategory;
    stemFavorability: FortuneFavorability;
    branchMainFavorability: FortuneFavorability;
    combinedFavorability: FortuneFavorability;
    triggeredNatalPillars: string[];
    spousePalaceTriggered: boolean;
    monthPillarTriggered: boolean;
    hourPillarTriggered: boolean;
  } | null;
}

export interface BaziInteractionContext {
  ruleVersion: 'ziping-common-v1';
  dayMaster: {
    value: string;
    element: FiveElement;
    yinYang: YinYang;
  };
  monthCommand: {
    branch: string;
    mainElement: FiveElement;
    relationToDayMaster: string;
  };
  elementCounts: Record<FiveElement, number>;
  elementCountBasis: string;
  weightedFiveElements: Record<FiveElement, number>;
  fiveElementStatus: Record<FiveElement, '偏缺' | '偏弱' | '平衡' | '偏旺' | '过旺'>;
  tenGodCategoryScores: Record<TenGodCategory, number>;
  tenGodDominance: {
    dominant: TenGodCategory;
    secondary: TenGodCategory;
    ranking: Array<{ category: TenGodCategory; score: number }>;
  };
  strength: {
    sameScore: number;
    resourceScore: number;
    outputScore: number;
    wealthScore: number;
    authorityScore: number;
    monthBonus: number;
    supportTotal: number;
    drainTotal: number;
    ratio: number;
    level: '强' | '偏强' | '中和' | '偏弱' | '弱';
  };
  structure: {
    type: '正格' | '从格';
    subtype: '扶抑正格' | '从旺' | '从儿' | '从财' | '从官杀';
    baseSupportRatio: number;
    visibleSupportCount: number;
    rootSupportCount: number;
  };
  favorable: {
    categories: TenGodCategory[];
    unfavorableCategories: TenGodCategory[];
    elements: FiveElement[];
    unfavorableElements: FiveElement[];
  };
  strengthCalculationBasis: string;
  shenSha: {
    peachBlossom: {
      targets: string[];
      natalHits: string[];
    };
    tianYi: {
      targets: string[];
      natalHits: string[];
    };
  };
  ruleInsights: {
    personalityTags: string[];
    careerAxis: '管理制度型' | '市场经营型' | '研究专业型' | '喜用导向型';
    careerTags: string[];
    careerRiskFlags: string[];
    wealthMode: '主动经营型' | '有财机但承压明显' | '财不是核心驱动力' | '稳健积累型';
    wealthFlags: string[];
    relationshipStar: '财' | '官杀';
    relationshipFlags: string[];
  };
  calculationConvention: {
    version: 'lifekline-bazi-v2';
    yearBoundary: '立春';
    monthBoundary: '十二节';
    dayBoundary: '23:00子初';
    timeBasis: '真太阳时';
  };
  natalPillars: Array<{
    label: string;
    analysis: BaziGanZhiAnalysis;
  }>;
  natalRelations: BaziRelation[];
  daYun: PeriodGanZhiAnalysis;
  liuNian: PeriodGanZhiAnalysis;
  liuYueSegments: Array<PeriodGanZhiAnalysis & {
    startDateTime: string;
    endDateTime: string;
  }>;
  days: Array<PeriodGanZhiAnalysis & {
    date: string;
    weekday: string;
  }>;
  interpretationBoundary: string;
}

export interface FortunePeriodContext {
  type: FortunePeriodType;
  startDateTime: string;
  endDateTime: string;
  daYun: string;
  daYunBasis: 'exact' | 'manual-age-range';
  liuNian: string;
  liuYueSegments: Array<{
    ganZhi: string;
    startDateTime: string;
    endDateTime: string;
  }>;
  days: Array<{
    date: string;
    weekday: string;
    ganZhi: string;
  }>;
  baziInteractions: BaziInteractionContext;
}

export interface FortuneDimension {
  score: number;
  summary: string;
  advice: string;
}

export interface LocalScoreBreakdown {
  base: 50;
  daYunAdjustment: number;
  liuNianAdjustment: number;
  liuYueAdjustment: number;
  liuRiAdjustment: number;
  interactionAdjustment: number;
  finalScore: number;
  evidence: string[];
}

export interface LocalFortuneScores {
  ruleVersion: 'lifekline-short-score-v4';
  timeline: Array<{
    dateRange: string;
    score: number;
    breakdown: LocalScoreBreakdown;
  }>;
  dimensions: {
    career: number;
    wealth: number;
    relationship: number;
    health: number;
  };
  overallScore: number;
  trend: 'up' | 'stable' | 'volatile' | 'cautious';
  calculationBoundary: string;
}

export interface ShortTermFortuneResult {
  period: FortunePeriodContext;
  scoreDetails: LocalFortuneScores;
  overallScore: number;
  trend: 'up' | 'stable' | 'volatile' | 'cautious';
  summary: string;
  career: FortuneDimension;
  wealth: FortuneDimension;
  relationship: FortuneDimension;
  health: FortuneDimension;
  timeline: Array<{
    dateRange: string;
    score: number;
    title: string;
    analysis: string;
  }>;
  opportunities: string[];
  risks: string[];
  actions: string[];
  disclaimer: string;
}

export interface KLinePoint {
  age: number;
  year: number;
  ganZhi: string; // 当年的流年干支 (如：甲辰)
  daYun?: string; // 当前所在的大运（如：甲子大运），用于图表标记
  open: number;
  close: number;
  high: number;
  low: number;
  score: number;
  reason: string; // 这里现在需要存储详细的流年描述
}

export interface AnalysisData {
  bazi: string[]; // [Year, Month, Day, Hour] pillars
  summary: string;
  summaryScore: number; // 0-10
  
  personality: string;      // 性格分析
  personalityScore: number; // 0-10
  
  industry: string;
  industryScore: number; // 0-10

  fengShui: string;       // 发展风水 (New)
  fengShuiScore: number;  // 0-10 (New)
  
  wealth: string;
  wealthScore: number; // 0-10
  
  marriage: string;
  marriageScore: number; // 0-10
  
  health: string;
  healthScore: number; // 0-10
  
  family: string;
  familyScore: number; // 0-10

  // Crypto / Web3 Specifics
  crypto: string;       // 币圈交易分析
  cryptoScore: number;  // 投机运势评分
  cryptoYear: string;   // 暴富流年 (e.g., 2025 乙巳)
  cryptoStyle: string;  // 适合流派 (现货/合约/链上Alpha)
}

export interface LifeDestinyResult {
  chartData: KLinePoint[];
  analysis: AnalysisData;
}

export interface FortuneStick {
  id: number;
  title: string;
  level: string;
  fortuneLevel: string;
  story: string;
  poem: string;
  meaning: string;
  overall: string;
  essence: string;
  generalDetail: string;
  loveDetail: string;
  careerDetail: string;
  examDetail: string;
  wealthDetail: string;
  businessDetail: string;
  propertyDetail: string;
  healthDetail: string;
  changeDetail: string;
  pregnancyDetail: string;
  lawsuitDetail: string;
  lostFoundDetail: string;
  travelDetail: string;
  storyDetail: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
  advice: string;
  caution: string;
}

export interface DivinationApiConfig {
  apiKey: string;
  apiBaseUrl: string;
  modelName: string;
}

export interface DivinationQuestionInput {
  question: string;
}

export interface AiFortuneInterpretation {
  career: string;
  wealth: string;
  love: string;
  health: string;
  advice: string;
  caution: string;
}

export interface DivinationResult {
  stick: FortuneStick;
  generatedAt: string;
  aiInterpretation?: AiFortuneInterpretation;
}

export interface AlmanacDay {
  solarDate: string;
  weekday: string;
  lunarDate: string;
  yearGanZhi: string;
  monthGanZhi: string;
  dayGanZhi: string;
  zodiac: string;
  clash: string;
  sha: string;
  suitable: string[];
  avoid: string[];
  luckyGods: string[];
  star: string;
  starLuck: string;
  pengZu: string[];
  generatedAt: string;
}

export interface AlmanacQuestionInput {
  matter: string;
}

export interface AlmanacInterpretation {
  summary: string;
  suitable: string;
  risk: string;
  suggestion: string;
}
