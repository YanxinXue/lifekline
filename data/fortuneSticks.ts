import { FortuneStick } from '../types';

const LEVELS = [
  { level: '上上', fortuneLevel: '大吉', tone: '顺势有成，贵人助力明显' },
  { level: '上吉', fortuneLevel: '吉', tone: '形势向好，稳进可得成果' },
  { level: '中吉', fortuneLevel: '中吉', tone: '稳中有进，需靠执行积累' },
  { level: '中平', fortuneLevel: '平', tone: '平稳无大波，宜守中待时' },
  { level: '中下', fortuneLevel: '小凶', tone: '稍有阻滞，宜谨慎修正' },
  { level: '下下', fortuneLevel: '凶', tone: '当前不利，宜止损避险' },
];

const STORIES = [
  '姜太公遇文王', '张良得书', '韩信拜将', '苏秦佩印', '陶朱归湖',
  '刘备三顾', '孔明借东风', '王祥卧冰', '孟母三迁', '吕蒙读书',
  '班超投笔', '岳飞精忠', '文王拘羑', '伊尹耕莘', '伯乐相马',
  '管鲍分金', '萧何月下追韩信', '范蠡泛舟', '廉颇负荆', '蔺相如完璧',
];

const THEMES = [
  '云开月现', '春木逢阳', '舟行顺水', '久旱逢霖', '花发枝头',
  '山路初平', '灯火照夜', '金石待磨', '雁过衡阳', '风静潮回',
  '竹报平安', '龙门得水', '芝兰生庭', '明珠出海', '枯木逢春',
  '良马识途', '宝镜重明', '鸿雁传书', '玉树临风', '炉火炼金',
];

const POEM_ENDINGS = [
  '守得初心终有应，贵人相引到前程。',
  '莫嫌此际行来缓，一步安然一步成。',
  '若问前途休躁进，云收雨歇见天晴。',
  '凡事从容宜自守，待逢佳信再经营。',
  '眼前小阻非长困，修整根基待晓明。',
];

const pick = <T,>(items: T[], index: number): T => items[index % items.length];

const getLevelConfig = (id: number) => {
  if ([1, 8, 18, 28, 35, 45, 55, 68, 80, 88, 96].includes(id)) return LEVELS[0];
  if (id % 10 === 0 || id % 9 === 0) return LEVELS[1];
  if (id % 7 === 0 || id % 5 === 0) return LEVELS[2];
  if (id % 11 === 0 || id % 13 === 0) return LEVELS[4];
  if ([4, 23, 36, 47, 64, 73, 91, 99].includes(id)) return LEVELS[5];
  return LEVELS[3];
};

const buildMeaning = (level: string, tone: string, theme: string) => {
  if (level === '上上' || level === '上吉') {
    return `${theme}之象。${tone}，适合顺势推进，但仍需以诚待人、以稳收功。`;
  }
  if (level === '中吉') {
    return `${theme}之象。${tone}，今日宜先稳住基本盘，再寻找可推进的小机会。`;
  }
  if (level === '中平') {
    return `${theme}之象。${tone}，不宜大起大落，重在整理、观察与维持秩序。`;
  }
  return `${theme}之象。${tone}，当前要少冒险、多查漏，先避开明显损耗。`;
};

export const FORTUNE_STICKS: FortuneStick[] = Array.from({ length: 100 }, (_, index) => {
  const id = index + 1;
  const levelConfig = getLevelConfig(id);
  const story = pick(STORIES, id - 1);
  const theme = pick(THEMES, id * 3);
  const poemEnding = pick(POEM_ENDINGS, id + levelConfig.level.length);

  return {
    id,
    title: `黄大仙灵签 第${id}签`,
    level: levelConfig.level,
    fortuneLevel: levelConfig.fortuneLevel,
    story,
    poem: `${theme}入签中，${story}示吉凶。\n${poemEnding}`,
    meaning: buildMeaning(levelConfig.level, levelConfig.tone, theme),
    career: levelConfig.level === '下下'
      ? '事业宜守不宜攻，先处理风险、流程和人事阻滞。'
      : '事业可按节奏推进，重要事项先定优先级，再争取关键支持。',
    wealth: ['上上', '上吉', '中吉'].includes(levelConfig.level)
      ? '财运重在正财与稳健机会，不宜因短期诱惑偏离计划。'
      : '财务宜保守，控制支出，避免高风险投入和人情借贷。',
    love: ['上上', '上吉'].includes(levelConfig.level)
      ? '感情有沟通转暖之象，适合表达诚意、修复误会。'
      : '关系中宜少猜测、多确认，避免用情绪推动决定。',
    health: ['中下', '下下'].includes(levelConfig.level)
      ? '注意休息、饮食和旧疾信号，身体不适应及时处理。'
      : '身心状态尚稳，保持规律作息即可增益今日运势。',
    advice: ['上上', '上吉'].includes(levelConfig.level)
      ? '今日宜主动争取、见贵人、推进已准备充分的事项。'
      : levelConfig.level === '中吉'
        ? '今日宜稳步执行，把小事做扎实，成果会逐渐显现。'
        : '今日宜收敛锋芒、减少争执，把精力放在修正和准备上。',
    caution: ['中下', '下下'].includes(levelConfig.level)
      ? '忌冲动签约、贸然投资、强行争胜，凡事多留退路。'
      : '顺境中仍忌轻诺和贪多，保持分寸才能守住好运。',
  };
});
