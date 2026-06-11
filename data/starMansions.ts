export interface StarMansionExplanation {
  group: string;
  plainMeaning: string;
  suitableFor: string[];
  caution: string;
}

const DEFAULT_STAR_MANSION_EXPLANATION: StarMansionExplanation = {
  group: '二十八宿',
  plainMeaning: '星宿是传统黄历里按二十八宿轮值形成的民俗参考。',
  suitableFor: ['结合宜忌判断', '日常参考', '低风险安排'],
  caution: '星宿吉凶只能作为加减分，不能单独决定事情成败。',
};

export const STAR_MANSION_EXPLANATIONS: Record<string, StarMansionExplanation> = {
  角: {
    group: '东方青龙',
    plainMeaning: '角宿为青龙之首，传统上偏开启、生发、动工和建立秩序。',
    suitableFor: ['开业', '动土', '修造', '出行', '求名'],
    caution: '适合启动类事项，但仍要确认资源、手续和风险。',
  },
  亢: {
    group: '东方青龙',
    plainMeaning: '亢宿有高亢、刚强之象，传统上容易带来争执和阻力。',
    suitableFor: ['整理', '防守', '复盘'],
    caution: '不宜把冲突升级；合作、签约类事项要更谨慎。',
  },
  氐: {
    group: '东方青龙',
    plainMeaning: '氐宿偏根基、居所和内在稳定，但黄历中多作谨慎看待。',
    suitableFor: ['安顿', '整理', '修补'],
    caution: '涉及婚嫁、搬迁、重大承诺时，建议结合宜忌再判断。',
  },
  房: {
    group: '东方青龙',
    plainMeaning: '房宿偏家宅、婚姻、财富和安定，是传统上较受重视的吉宿。',
    suitableFor: ['嫁娶', '入宅', '修造', '开市', '求财'],
    caution: '财务和家宅事项仍要以合同、预算和现实条件为准。',
  },
  心: {
    group: '东方青龙',
    plainMeaning: '心宿偏情绪、内心和权柄，传统上多提醒谨慎，忌躁进。',
    suitableFor: ['静养', '反思', '低调处理'],
    caution: '不宜做情绪化决定，重要沟通先降温。',
  },
  尾: {
    group: '东方青龙',
    plainMeaning: '尾宿有收束与延续之象，传统上利婚嫁、修造和积累。',
    suitableFor: ['嫁娶', '修造', '纳财', '养殖', '储备'],
    caution: '适合稳步推进，不代表可以忽略成本和执行细节。',
  },
  箕: {
    group: '东方青龙',
    plainMeaning: '箕宿有风动、清理和扩散之象，偏向整理、传播和出行。',
    suitableFor: ['清理', '出行', '沟通', '交易'],
    caution: '信息容易发散，签约和承诺要避免口头不清。',
  },
  斗: {
    group: '北方玄武',
    plainMeaning: '斗宿偏度量、分配和积累，传统上利纳财、修造和事务安排。',
    suitableFor: ['纳财', '开市', '修造', '安顿', '计划'],
    caution: '资源分配要清楚，避免只看“吉”而忽略账目。',
  },
  牛: {
    group: '北方玄武',
    plainMeaning: '牛宿有劳作、负重之象，传统上多提醒辛苦阻滞。',
    suitableFor: ['整理', '检修', '保守推进'],
    caution: '不宜强行启动高成本事项，先评估投入产出。',
  },
  女: {
    group: '北方玄武',
    plainMeaning: '女宿偏内务、人际和细节，但传统黄历多列为谨慎之宿。',
    suitableFor: ['家务', '整理', '低调沟通'],
    caution: '婚嫁、合作、公开承诺类事项应更谨慎。',
  },
  虚: {
    group: '北方玄武',
    plainMeaning: '虚宿有空耗、不实之象，传统上提醒避免虚张和冒进。',
    suitableFor: ['休整', '复盘', '清理旧事'],
    caution: '不宜做大额投入或凭想象推进，先补证据。',
  },
  危: {
    group: '北方玄武',
    plainMeaning: '危宿本身带“危”象，传统上重在风险提示和谨慎行事。',
    suitableFor: ['修整', '防护', '风险排查'],
    caution: '涉及出行、施工、安全、医疗时，现实风控优先。',
  },
  室: {
    group: '北方玄武',
    plainMeaning: '室宿偏房屋、居所、营建和安定，传统上常作吉宿。',
    suitableFor: ['修造', '入宅', '安床', '婚嫁', '祭祀'],
    caution: '家宅工程仍要确认预算、审批和施工安全。',
  },
  壁: {
    group: '北方玄武',
    plainMeaning: '壁宿偏文书、藏书、修饰和保护，利文化、整理与修造。',
    suitableFor: ['读书', '修造', '整理文书', '入宅', '祭祀'],
    caution: '适合补强和整理，不代表所有项目都适合扩张。',
  },
  奎: {
    group: '西方白虎',
    plainMeaning: '奎宿偏文采、规制和仓库，但黄历中常提醒慎用。',
    suitableFor: ['学习', '整理', '修文书'],
    caution: '重大婚嫁、开张或施工事项不要只凭星宿判断。',
  },
  娄: {
    group: '西方白虎',
    plainMeaning: '娄宿偏聚集、收纳、牧养和家宅，传统上多作吉宿。',
    suitableFor: ['嫁娶', '开市', '纳财', '修造', '安葬'],
    caution: '财物聚集类事项仍要看实际现金流和保管风险。',
  },
  胃: {
    group: '西方白虎',
    plainMeaning: '胃宿偏仓储、饮食、财库和经营，传统上利积累。',
    suitableFor: ['开市', '纳财', '交易', '储备', '宴会'],
    caution: '经营和饮食事项要同时注意合规、卫生和成本。',
  },
  昴: {
    group: '西方白虎',
    plainMeaning: '昴宿偏肃杀、审断和分辨，传统黄历多列为凶宿。',
    suitableFor: ['审查', '断舍离', '风险排查'],
    caution: '不宜轻率开启喜庆或高承诺事项，避免言辞过硬。',
  },
  毕: {
    group: '西方白虎',
    plainMeaning: '毕宿偏完成、覆盖、收束和稳定，传统上多作吉宿。',
    suitableFor: ['修造', '安葬', '纳财', '祭祀', '收尾'],
    caution: '适合完成和收束，未准备好的新项目不宜硬开。',
  },
  觜: {
    group: '西方白虎',
    plainMeaning: '觜宿偏口舌、争辩和锋芒，传统上提醒防口舌是非。',
    suitableFor: ['复盘', '审查', '低调沟通'],
    caution: '谈判、表态、公开发言要避免激化矛盾。',
  },
  参: {
    group: '西方白虎',
    plainMeaning: '参宿偏行动、军旅、远行和执行力，传统上多作吉宿。',
    suitableFor: ['出行', '求职', '修造', '交易', '执行任务'],
    caution: '行动类事项仍需看路线、安全和资源准备。',
  },
  井: {
    group: '南方朱雀',
    plainMeaning: '井宿偏水井、秩序、公共事务和资源供给，传统上为吉宿。',
    suitableFor: ['祭祀', '修造', '求医', '开市', '整理'],
    caution: '水务、医疗、公共事务仍以专业规范为准。',
  },
  鬼: {
    group: '南方朱雀',
    plainMeaning: '鬼宿偏阴事、慎重和隐忧，传统上多列为凶宿。',
    suitableFor: ['安葬', '清理', '低调处理'],
    caution: '不宜做喜庆或冒进事项，也不要做灾祸化联想。',
  },
  柳: {
    group: '南方朱雀',
    plainMeaning: '柳宿有摇动、离散之象，传统上提醒人事不稳。',
    suitableFor: ['清理', '休整', '低调沟通'],
    caution: '婚嫁、合作、搬迁类事项建议更谨慎。',
  },
  星: {
    group: '南方朱雀',
    plainMeaning: '星宿偏光耀、名声和显露，但黄历中多提醒慎用。',
    suitableFor: ['展示准备', '整理形象', '复盘'],
    caution: '公开发布、签约和高调行动要避免准备不足。',
  },
  张: {
    group: '南方朱雀',
    plainMeaning: '张宿有张开、铺陈和喜庆之象，传统上常作吉宿。',
    suitableFor: ['开业', '嫁娶', '宴会', '发布', '修造'],
    caution: '适合展示和展开，但仍需控制成本和节奏。',
  },
  翼: {
    group: '南方朱雀',
    plainMeaning: '翼宿偏飞动、辅助和传播，传统上多提醒不宜冒进。',
    suitableFor: ['学习', '准备', '小范围沟通'],
    caution: '出行、发布、签约类事项要避免信息不全。',
  },
  轸: {
    group: '南方朱雀',
    plainMeaning: '轸宿偏车马、出行、收束和照护，传统上多作吉宿。',
    suitableFor: ['出行', '修造', '求医', '安葬', '收尾'],
    caution: '出行和健康相关事项仍以现实安全与专业意见为准。',
  },
};

export const getStarMansionExplanation = (name: string) => (
  STAR_MANSION_EXPLANATIONS[name] || DEFAULT_STAR_MANSION_EXPLANATION
);
