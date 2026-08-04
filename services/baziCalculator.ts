import { Solar } from 'lunar-javascript';

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
  yunStartDateTime: string;
  daYunSequence: Array<{
    ganZhi: string;
    startYear: number;
    endYear: number;
  }>;
}

interface DateTimeParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function parseBirthDateTime(birthDate: string, birthTime: string): DateTimeParts {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(birthTime);

  if (!dateMatch || !timeMatch) {
    throw new Error('出生日期或时间格式不正确');
  }

  const [, yearText, monthText, dayText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const parts: DateTimeParts = {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
    hour: Number(hourText),
    minute: Number(minuteText),
    second: 0,
  };

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
  const isValid =
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day &&
    date.getUTCHours() === parts.hour &&
    date.getUTCMinutes() === parts.minute;

  if (!isValid) {
    throw new Error('出生日期或时间无效');
  }

  return parts;
}

function equationOfTime(year: number, month: number, day: number): number {
  const startDate = new Date(Date.UTC(year, 0, 1));
  const currentDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfYear = (currentDate.getTime() - startDate.getTime()) / 86400000;
  const b = (2 * Math.PI * dayOfYear) / 365;

  return 229.18 * (
    0.000075 +
    0.001868 * Math.cos(b) -
    0.032077 * Math.sin(b) -
    0.014615 * Math.cos(2 * b) -
    0.040849 * Math.sin(2 * b)
  );
}

function toTrueSolarTime(parts: DateTimeParts, longitude: number): DateTimeParts {
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('出生地经度无效');
  }

  const longitudeCorrectionMinutes = (longitude - 120) * 4;
  const eotMinutes = equationOfTime(parts.year, parts.month, parts.day);
  const totalCorrectionMs = Math.round((longitudeCorrectionMinutes + eotMinutes) * 60 * 1000);
  const adjusted = new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  ) + totalCorrectionMs);

  return {
    year: adjusted.getUTCFullYear(),
    month: adjusted.getUTCMonth() + 1,
    day: adjusted.getUTCDate(),
    hour: adjusted.getUTCHours(),
    minute: adjusted.getUTCMinutes(),
    second: adjusted.getUTCSeconds(),
  };
}

export function calculateBazi(input: BaziInput): BaziResult {
  const { birthDate, birthTime, longitude = 116.4 } = input;
  const birthDateTime = parseBirthDateTime(birthDate, birthTime);
  const trueSolarTime = toTrueSolarTime(birthDateTime, longitude);
  const solar = Solar.fromYmdHms(
    trueSolarTime.year,
    trueSolarTime.month,
    trueSolarTime.day,
    trueSolarTime.hour,
    trueSolarTime.minute,
    trueSolarTime.second,
  );
  const eightChar = solar.getLunar().getEightChar();
  eightChar.setSect(1);
  const gender = input.gender === 'Male' ? 1 : 0;
  const yun = eightChar.getYun(gender);
  const daYunSequence = yun.getDaYun(11)
    .filter(daYun => daYun.getGanZhi())
    .map(daYun => ({
      ganZhi: daYun.getGanZhi(),
      startYear: daYun.getStartYear(),
      endYear: daYun.getEndYear(),
    }));
  const firstDaYun = daYunSequence[0];

  if (!firstDaYun) {
    throw new Error('大运计算失败');
  }

  return {
    yearPillar: eightChar.getYear(),
    monthPillar: eightChar.getMonth(),
    dayPillar: eightChar.getDay(),
    hourPillar: eightChar.getTime(),
    startAge: yun.getDaYun(2).find(daYun => daYun.getGanZhi())?.getStartAge() || 1,
    firstDaYun: firstDaYun.ganZhi,
    yunStartDateTime: yun.getStartSolar().toYmdHms(),
    daYunSequence,
  };
}
