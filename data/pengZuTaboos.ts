export interface PengZuTabooExplanation {
  plainMeaning: string;
  reminder: string;
  caution: string;
}

const DEFAULT_PENG_ZU_TABOO_EXPLANATION: PengZuTabooExplanation = {
  plainMeaning: '彭祖百忌中的传统禁忌语，用日干或日支提示当天不宜强行做某类事。',
  reminder: '把它当作风险提醒，重点看它对应的事项类型。',
  caution: '这是民俗参考，不代表现实中一定发生问题，仍应结合宜忌、冲煞和实际条件判断。',
};

export const PENG_ZU_TABOO_EXPLANATIONS: Record<string, PengZuTabooExplanation> = {
  甲不开仓财物耗散: {
    plainMeaning: '甲日传统上不宜开仓、动用大量库存或随意分发财物。',
    reminder: '涉及库存、现金、资产调拨时，先盘点清楚再动作。',
    caution: '不是说一定破财，而是提醒财物出入要有记录和边界。',
  },
  乙不栽植千株不长: {
    plainMeaning: '乙日传统上不宜大规模栽种、移植或启动种植类事项。',
    reminder: '植物、长期培育、基础建设类事项，宜先看环境和时机。',
    caution: '现实中仍以天气、土壤、养护条件为准。',
  },
  丙不修灶必见灾殃: {
    plainMeaning: '丙日传统上不宜修灶、改动炉火或厨房核心设施。',
    reminder: '涉及火、电、燃气、厨房施工时，要优先做安全检查。',
    caution: '这不是灾祸断言，现实上应以施工规范和燃气安全为准。',
  },
  丁不剃头头必生疮: {
    plainMeaning: '丁日传统上不宜剃头、理发或做头面部处理。',
    reminder: '若有皮肤不适、护理项目或医美安排，宜谨慎选择时间和机构。',
    caution: '健康问题不能按黄历判断，异常症状应咨询医生。',
  },
  戊不受田田主不祥: {
    plainMeaning: '戊日传统上不宜接受田产、土地或不动产类交接。',
    reminder: '土地、房产、权属、租赁交割要把合同和产权查清。',
    caution: '法律权属以正式文件为准，黄历只能作为提醒。',
  },
  己不破券二比并亡: {
    plainMeaning: '己日传统上不宜撕毁契券、解除凭据或处理重要文书。',
    reminder: '合同、票据、借据、凭证类事项，不要草率销毁或作废。',
    caution: '合同效力和债权债务应以法律文件与专业意见为准。',
  },
  庚不经络织机虚张: {
    plainMeaning: '庚日传统上不宜织布、开机或启动精细工序。',
    reminder: '适合检查设备、流程、材料，不宜仓促开工。',
    caution: '生产安排仍以设备状态、人员和质量标准为准。',
  },
  辛不合酱主人不尝: {
    plainMeaning: '辛日传统上不宜酿造、调味、封存食物或做发酵类事项。',
    reminder: '食品加工、储存、调配要特别注意卫生和保存条件。',
    caution: '食品安全以实际卫生标准和保质条件为准。',
  },
  壬不泱水更难提防: {
    plainMeaning: '壬日传统上不宜汲水、动水或处理水源水务。',
    reminder: '涉及水、电、管道、出行涉水时，先排查安全隐患。',
    caution: '现实中以工程安全、天气和水文条件为准。',
  },
  癸不词讼理弱敌强: {
    plainMeaning: '癸日传统上不宜主动诉讼、争辩或升级纠纷。',
    reminder: '遇到争议先收集证据、降低情绪，再决定是否推进。',
    caution: '法律判断应咨询专业人士，不应只按黄历决定。',
  },
  子不问卜自惹祸殃: {
    plainMeaning: '子日传统上不宜频繁占问、反复求卜。',
    reminder: '适合减少纠结，把注意力放回可执行的信息和行动。',
    caution: '不要把不确定问题越问越焦虑，现实决策仍靠证据。',
  },
  丑不冠带主不还乡: {
    plainMeaning: '丑日传统上不宜行冠礼、换正式服饰或做身份仪式。',
    reminder: '重要仪式、形象发布、身份确认类事项宜提前准备。',
    caution: '现代生活可弱化理解，重点是不要仓促办正式仪式。',
  },
  寅不祭祀神鬼不尝: {
    plainMeaning: '寅日传统上不宜祭祀或做大型敬神祭祖仪式。',
    reminder: '祭祀类事项宜重在诚敬和安全，不必强求这一天。',
    caution: '属于民俗禁忌，不代表祭祀一定无效或不吉。',
  },
  卯不穿井水泉不香: {
    plainMeaning: '卯日传统上不宜打井、开渠、钻探或动水源。',
    reminder: '涉及水源、地下施工、管线工程时，先确认勘测和审批。',
    caution: '工程可行性以专业勘察和安全规范为准。',
  },
  辰不哭泣必主重丧: {
    plainMeaning: '辰日传统上忌过度哭泣、悲伤或扩大丧事氛围。',
    reminder: '适合节制情绪，避免把悲伤和冲突继续放大。',
    caution: '不要做灾祸联想；真实丧葬和心理支持应以现实需要为准。',
  },
  巳不远行财物伏藏: {
    plainMeaning: '巳日传统上不宜远行，尤其提醒财物和行李风险。',
    reminder: '若必须出行，提前确认路线、证件、付款和贵重物品。',
    caution: '是否出行应以天气、交通、身体状态和安排成熟度为准。',
  },
  午不苫盖屋主更张: {
    plainMeaning: '午日传统上不宜盖屋顶、遮盖、修补屋面。',
    reminder: '房屋遮盖、防水、屋顶施工要确认天气和施工安全。',
    caution: '建筑施工以专业标准、审批和安全防护为准。',
  },
  未不服药毒气入肠: {
    plainMeaning: '未日传统上不宜自行服药、试药或随意调整用药。',
    reminder: '用药前看医嘱、剂量、禁忌和相互作用。',
    caution: '医疗事项必须听医生或药师意见，不能按黄历停药或换药。',
  },
  申不安床鬼祟入房: {
    plainMeaning: '申日传统上不宜安床、移床或布置卧室核心位置。',
    reminder: '卧室调整宜兼顾采光、通风、安全和睡眠习惯。',
    caution: '睡眠问题应优先看健康、压力和环境因素。',
  },
  酉不会客醉坐颠狂: {
    plainMeaning: '酉日传统上不宜宴客、饮酒聚会或高情绪社交。',
    reminder: '社交应控制酒精、言辞和边界，避免失态。',
    caution: '不是不能见人，而是提醒聚会节制和风险管理。',
  },
  戌不吃犬作怪上床: {
    plainMeaning: '戌日传统上忌食犬肉，延伸为饮食和作息要谨慎。',
    reminder: '饮食聚会、夜间作息和卫生习惯不要太随意。',
    caution: '现代可理解为饮食禁忌提醒，不作神怪化解释。',
  },
  亥不嫁娶不利新郎: {
    plainMeaning: '亥日传统上不宜嫁娶，尤其认为对男方不利。',
    reminder: '婚嫁择日应结合双方家庭、流程、冲煞和现实安排。',
    caution: '不代表婚姻一定受损，现代婚期更应看双方意愿和实际条件。',
  },
};

export const getPengZuTabooExplanation = (name: string) => (
  PENG_ZU_TABOO_EXPLANATIONS[name] || DEFAULT_PENG_ZU_TABOO_EXPLANATION
);
