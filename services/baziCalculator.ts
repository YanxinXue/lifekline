const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

export interface BaziInput {
  birthDate: string;
  birthTime: string;
  longitude?: number;
  gender: 'Male' | 'Female';
}

export interface BaziResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  startAge: number;       // 起运年龄 (虚岁)
  firstDaYun: string;     // 第一步大运
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function sunEclipticLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
  const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360;
  const Mrad = toRad(M);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const sunLong = (L0 + C) % 360;
  return sunLong < 0 ? sunLong + 360 : sunLong;
}

function getSolarTermDate(year: number, termIndex: number): Date {
  const {month, day, lon} = ALL_TERMS[termIndex];
  let jd = new Date(Date.UTC(year, month - 1, day)).getTime() / 86400000 + 2440587.5;
  
  for (let i = 0; i < 5; i++) {
    const sunLon = sunEclipticLongitude(jd);
    let diff = lon - sunLon;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    jd += diff / 0.9856;
  }
  
  return new Date((jd - 2440587.5) * 86400000);
}

function equationOfTime(year: number, month: number, day: number): number {
  const startDate = new Date(Date.UTC(year, 0, 1));
  const currentDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfYear = (currentDate.getTime() - startDate.getTime()) / 86400000;
  const N = dayOfYear;
  const B = (2 * Math.PI * N) / 365;
  return 229.18 * (
    0.000075 +
    0.001868 * Math.cos(B) -
    0.032077 * Math.sin(B) -
    0.014615 * Math.cos(2 * B) -
    0.040849 * Math.sin(2 * B)
  );
}

function getMonthBranch(baziMonth: number): number {
  return (baziMonth + 2) % 12;
}

function getMonthStem(yearStem: number, baziMonth: number): number {
  const base = ((yearStem % 5) * 2 + 2) % 10;
  return (base + baziMonth) % 10;
}

// Jie terms indices in TERM_DATES/Term_LON (0-indexed): 
// Index mapping for 24节气 (0=小寒, 1=大寒, ..., 23=冬至)
// 12 Jie (节) used for month boundaries:
// 2=立春(寅月), 4=惊蛰(卯月), 6=清明(辰月), 8=立夏(巳月), 10=芒种(午月), 12=小暑(未月),
// 14=立秋(申月), 16=白露(酉月), 18=寒露(戌月), 20=立冬(亥月), 22=大雪(子月), 0=小寒(丑月)
const JIE_INDICES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 0];

// 完整的24节气日期表 [月, 日], 和对应黄经角度 [0-indexed from 小寒]
const ALL_TERMS: {month: number, day: number, lon: number}[] = [
  {month: 1, day: 6, lon: 285},  // 0: 小寒
  {month: 1, day: 20, lon: 300}, // 1: 大寒
  {month: 2, day: 4, lon: 315},  // 2: 立春
  {month: 2, day: 19, lon: 330}, // 3: 雨水
  {month: 3, day: 6, lon: 345},  // 4: 惊蛰
  {month: 3, day: 21, lon: 0},   // 5: 春分
  {month: 4, day: 5, lon: 15},   // 6: 清明
  {month: 4, day: 20, lon: 30},  // 7: 谷雨
  {month: 5, day: 5, lon: 45},   // 8: 立夏
  {month: 5, day: 21, lon: 60},  // 9: 小满
  {month: 6, day: 6, lon: 75},   // 10: 芒种
  {month: 6, day: 21, lon: 90},  // 11: 夏至
  {month: 7, day: 7, lon: 105},  // 12: 小暑
  {month: 7, day: 23, lon: 120}, // 13: 大暑
  {month: 8, day: 7, lon: 135},  // 14: 立秋
  {month: 8, day: 23, lon: 150}, // 15: 处暑
  {month: 9, day: 8, lon: 165},  // 16: 白露
  {month: 9, day: 23, lon: 180}, // 17: 秋分
  {month: 10, day: 8, lon: 195}, // 18: 寒露
  {month: 10, day: 23, lon: 210},// 19: 霜降
  {month: 11, day: 7, lon: 225}, // 20: 立冬
  {month: 11, day: 22, lon: 240},// 21: 小雪
  {month: 12, day: 7, lon: 255}, // 22: 大雪
  {month: 12, day: 22, lon: 270},// 23: 冬至
];

// 六十甲子表
const JIAZI: string[] = [];
for (let i = 0; i < 60; i++) {
  JIAZI.push(STEMS[i % 10] + BRANCHES[i % 12]);
}

// 判断年干阴阳 (阳干: 甲丙戊庚壬, 索引0,2,4,6,8)
const YANG_STEMS = ['甲', '丙', '戊', '庚', '壬'];

function getNextJie(year: number, birthTimeMs: number): Date {
  // Find the next Jie (节) after birth time
  for (let i = 0; i < 12; i++) {
    const jieIdx = JIE_INDICES[i];
    const jieDate = getSolarTermDate(year, jieIdx);
    if (jieDate.getTime() > birthTimeMs) {
      return jieDate;
    }
  }
  // If no Jie found this year, return first Jie of next year
  return getSolarTermDate(year + 1, JIE_INDICES[0]);
}

function getPrevJie(year: number, birthTimeMs: number): Date {
  // Find the previous Jie (节) before birth time
  let bestJie: Date | null = null;
  
  // Check all Jie of this year
  for (let i = 0; i < 12; i++) {
    const jieIdx = JIE_INDICES[i];
    const jieDate = getSolarTermDate(year, jieIdx);
    if (jieDate.getTime() <= birthTimeMs) {
      if (!bestJie || jieDate.getTime() > bestJie.getTime()) {
        bestJie = jieDate;
      }
    }
  }
  
  // If no Jie found this year (birth is before first Jie), check last Jie of previous year
  if (!bestJie) {
    bestJie = getSolarTermDate(year - 1, JIE_INDICES[11]);
  }
  
  return bestJie;
}

export function calculateBazi(input: BaziInput): BaziResult {
  const { birthDate, birthTime, longitude = 116.4 } = input;
  const [yearStr, monthStr, dayStr] = birthDate.split('-');
  const [hourStr, minuteStr] = birthTime.split(':');
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);
  const day = parseInt(dayStr);
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  // True solar time: longitude correction + equation of time
  const longitudeCorrection = (longitude - 120) * 4;
  const eot = equationOfTime(year, month, day);
  const trueSolarMinute = minute + longitudeCorrection + eot;

  let adjustedHour = hour;
  let adjustedMinute = trueSolarMinute;
  let adjustedDay = day;
  let adjustedMonth = month;
  let adjustedYear = year;

  if (adjustedMinute >= 60) {
    adjustedHour += Math.floor(adjustedMinute / 60);
    adjustedMinute = ((adjustedMinute % 60) + 60) % 60;
  } else if (adjustedMinute < 0) {
    const borrow = Math.ceil(Math.abs(adjustedMinute) / 60);
    adjustedHour -= borrow;
    adjustedMinute = adjustedMinute + borrow * 60;
  }

  if (adjustedHour >= 24) {
    adjustedHour -= 24;
    const nextDay = new Date(adjustedYear, adjustedMonth - 1, adjustedDay + 1);
    adjustedYear = nextDay.getFullYear();
    adjustedMonth = nextDay.getMonth() + 1;
    adjustedDay = nextDay.getDate();
  } else if (adjustedHour < 0) {
    adjustedHour += 24;
    const prevDay = new Date(adjustedYear, adjustedMonth - 1, adjustedDay - 1);
    adjustedYear = prevDay.getFullYear();
    adjustedMonth = prevDay.getMonth() + 1;
    adjustedDay = prevDay.getDate();
  }

  const adjustedTimeUTC = Date.UTC(adjustedYear, adjustedMonth - 1, adjustedDay, adjustedHour);

  // Year pillar: 立春 boundary (立春 starts new year)
  const liChun = getSolarTermDate(year, 2);  // 立春
  const beforeLiChun = adjustedTimeUTC < liChun.getTime();
  const yearForPillar = beforeLiChun ? year - 1 : year;
  const yearCycle = ((yearForPillar - 4) % 60 + 60) % 60;
  const yearStem = yearCycle % 10;
  const yearBranch = yearCycle % 12;

  // Month pillar: find which Jie (节) we're after
  // Must find the LATEST 节 that has already passed
  let baziMonth = 11;  // default 丑月 (before 立春)
  for (let m = 0; m < 12; m++) {
    const jieDate = getSolarTermDate(adjustedYear, JIE_INDICES[m]);
    if (adjustedTimeUTC >= jieDate.getTime()) {
      baziMonth = m;
    } else {
      break;
    }
  }

  const monthBranch = getMonthBranch(baziMonth);
  const monthStem = getMonthStem(yearStem, baziMonth);
  const monthStemChar = STEMS[monthStem];
  const monthBranchChar = BRANCHES[monthBranch];

  // Day pillar: 1900-01-31 = 甲子日 (cycle 0)
  const daysSinceRef = Math.floor(
    (Date.UTC(adjustedYear, adjustedMonth - 1, adjustedDay) - Date.UTC(1900, 0, 31)) / 86400000
  );
  let dayCycle = ((daysSinceRef % 60) + 60) % 60;

  // 子时 (23:00-00:59): next day's pillar
  if (adjustedHour >= 23) {
    dayCycle = (dayCycle + 1) % 60;
  }

  const dayStem = dayCycle % 10;
  const dayBranch = dayCycle % 12;

  // Hour pillar
  const hourBranch = Math.floor((adjustedHour + 1) / 2) % 12;
  const hourStem = ((dayStem % 5) * 2 + hourBranch) % 10;

  // ============================================================
  // DaYun (大运) calculation
  // ============================================================
  
  // 1. Determine direction (顺行/逆行)
  const yearStemChar = STEMS[yearStem];
  const isYangYear = YANG_STEMS.includes(yearStemChar);
  const isForward = input.gender === 'Male' ? isYangYear : !isYangYear;

  // 2. Calculate 起运 (Start Age in 虚岁)
  const birthTimeMs = adjustedTimeUTC;
  let diffMs: number;
  if (isForward) {
    const nextJie = getNextJie(year, birthTimeMs);
    diffMs = nextJie.getTime() - birthTimeMs;
  } else {
    const prevJie = getPrevJie(year, birthTimeMs);
    diffMs = birthTimeMs - prevJie.getTime();
  }
  
  // Convert milliseconds to days
  const diffDays = diffMs / (24 * 60 * 60 * 1000);
  
  // 起运规则: 3天 = 1岁, 1天 = 4个月
  const ageYears = Math.floor(diffDays / 3);
  const ageMonths = Math.floor((diffDays % 3) * 4);
  
  // 虚岁 = 实际岁数 + 1 (出生即1虚岁) + 是否超过半岁
  const startAge = ageMonths >= 6 ? ageYears + 2 : ageYears + 1;

  // 3. Calculate first DaYun (第一步大运)
  const monthPillarIndex = JIAZI.findIndex(jz => jz === monthStemChar + monthBranchChar);
  const firstDaYunIndex = isForward
    ? (monthPillarIndex + 1 + 60) % 60  // 顺行: 月柱 + 1
    : (monthPillarIndex - 1 + 60) % 60;  // 逆行: 月柱 - 1
  const firstDaYun = JIAZI[firstDaYunIndex];

  return {
    yearPillar: STEMS[yearStem] + BRANCHES[yearBranch],
    monthPillar: STEMS[monthStem] + BRANCHES[monthBranch],
    dayPillar: STEMS[dayStem] + BRANCHES[dayBranch],
    hourPillar: STEMS[hourStem] + BRANCHES[hourBranch],
    startAge,
    firstDaYun,
  };
}
