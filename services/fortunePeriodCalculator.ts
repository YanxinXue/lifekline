import { Solar } from 'lunar-javascript';
import { BaziProfile, FortunePeriodContext, FortunePeriodType } from '../types';
import { calculateBazi } from './baziCalculator';
import { calculateBaziInteractions } from './baziInteractionCalculator';
import { resolveBaziProfile } from './baziProfileStorage';
import { generateDaYunSequence, getDaYunDirection } from './promptBuilder';

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

interface DateParts {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
}

const parseDate = (value: string): DateParts => {
  const match = DATE_PATTERN.exec(value);
  if (!match) throw new Error('日期格式不正确');
  const [, year, month, day] = match;
  return { year: Number(year), month: Number(month), day: Number(day) };
};

const parseDateTime = (value: string): Required<DateParts> => {
  const match = DATE_TIME_PATTERN.exec(value);
  if (!match) throw new Error('日期时间格式不正确');
  const [, year, month, day, hour, minute, second] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
};

const toUtcDate = (parts: DateParts) => new Date(Date.UTC(
  parts.year,
  parts.month - 1,
  parts.day,
  parts.hour || 0,
  parts.minute || 0,
  parts.second || 0,
));

const pad = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
const formatDateTime = (date: Date) => `${formatDate(date)} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;

const addDays = (dateText: string, days: number) => {
  const date = toUtcDate(parseDate(dateText));
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
};

const dateTimeToMs = (dateTime: string) => toUtcDate(parseDateTime(dateTime)).getTime();

const solarAt = (dateTime: string) => {
  const parts = parseDateTime(dateTime);
  return Solar.fromYmdHms(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.second);
};

const clampDateTime = (value: string, minimum: string, maximum: string) => {
  const valueMs = dateTimeToMs(value);
  if (valueMs < dateTimeToMs(minimum)) return minimum;
  if (valueMs > dateTimeToMs(maximum)) return maximum;
  return value;
};

export const getTodayInShanghai = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

export const getWeekDateRange = (referenceDate: string) => {
  const date = toUtcDate(parseDate(referenceDate));
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const startDate = addDays(referenceDate, mondayOffset);
  return { startDate, endDate: addDays(startDate, 6) };
};

export const getSolarMonthRange = (referenceDate: string) => {
  const { year, month, day } = parseDate(referenceDate);
  const lunar = Solar.fromYmdHms(year, month, day, 12, 0, 0).getLunar();
  const previousJie = lunar.getPrevJie(false);
  const nextJie = lunar.getNextJie(false);
  return {
    startDateTime: previousJie.getSolar().toYmdHms(),
    endDateTime: nextJie.getSolar().toYmdHms(),
    startJie: previousJie.getName(),
    endJie: nextJie.getName(),
  };
};

export interface SolarMonthOption {
  value: string;
  label: string;
  ganZhi: string;
  startDateTime: string;
  endDateTime: string;
}

export const getSolarMonthOptions = (centerYear: number): SolarMonthOption[] => {
  const options: SolarMonthOption[] = [];
  const seenStarts = new Set<string>();

  for (let year = centerYear - 1; year <= centerYear + 1; year += 1) {
    for (let month = 1; month <= 12; month += 1) {
      const range = getSolarMonthRange(`${year}-${pad(month)}-15`);
      if (seenStarts.has(range.startDateTime)) continue;
      seenStarts.add(range.startDateTime);
      const value = addDays(range.startDateTime.slice(0, 10), 1);
      const parts = parseDate(value);
      const ganZhi = Solar.fromYmdHms(parts.year, parts.month, parts.day, 12, 0, 0).getLunar().getMonthInGanZhiExact();
      options.push({
        value,
        label: `${range.startDateTime.slice(0, 4)}年 · ${range.startJie}${ganZhi[1]}月（${ganZhi}）`,
        ganZhi,
        startDateTime: range.startDateTime,
        endDateTime: range.endDateTime,
      });
    }
  }

  return options.sort((left, right) => left.startDateTime.localeCompare(right.startDateTime));
};

const buildDays = (startDateTime: string, endDateTime: string) => {
  const startDate = startDateTime.slice(0, 10);
  const endDate = endDateTime.slice(0, 10);
  const days = [];
  let cursor = startDate;

  while (cursor <= endDate && days.length < 40) {
    const parts = parseDate(cursor);
    const date = toUtcDate(parts);
    const noonDateTime = `${cursor} 12:00:00`;
    if (dateTimeToMs(noonDateTime) >= dateTimeToMs(startDateTime) && dateTimeToMs(noonDateTime) <= dateTimeToMs(endDateTime)) {
      const lunar = Solar.fromYmdHms(parts.year, parts.month, parts.day, 12, 0, 0).getLunar();
      days.push({
        date: cursor,
        weekday: WEEKDAYS[date.getUTCDay()],
        ganZhi: lunar.getDayInGanZhiExact(),
      });
    }
    cursor = addDays(cursor, 1);
  }

  return days;
};

const buildLiuYueSegments = (startDateTime: string, endDateTime: string) => {
  const segments: FortunePeriodContext['liuYueSegments'] = [];
  let cursor = startDateTime;
  const endMs = dateTimeToMs(endDateTime);

  for (let guard = 0; guard < 4 && dateTimeToMs(cursor) <= endMs; guard += 1) {
    const lunar = solarAt(cursor).getLunar();
    const nextJieDateTime = lunar.getNextJie(false).getSolar().toYmdHms();
    const segmentEnd = clampDateTime(nextJieDateTime, cursor, endDateTime);
    segments.push({
      ganZhi: lunar.getMonthInGanZhiExact(),
      startDateTime: cursor,
      endDateTime: segmentEnd,
    });
    if (dateTimeToMs(nextJieDateTime) >= endMs) break;
    cursor = formatDateTime(new Date(dateTimeToMs(nextJieDateTime) + 1000));
  }

  return segments;
};

const isBeforeAnniversary = (target: DateParts, start: Required<DateParts>) => {
  const targetTuple = [target.month, target.day, target.hour || 12, target.minute || 0, target.second || 0];
  const startTuple = [start.month, start.day, start.hour, start.minute, start.second];
  for (let index = 0; index < targetTuple.length; index += 1) {
    if (targetTuple[index] !== startTuple[index]) return targetTuple[index] < startTuple[index];
  }
  return false;
};

const getExactDaYun = (profile: Extract<BaziProfile, { source: 'auto' }>, referenceDate: string) => {
  const calculation = calculateBazi({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    longitude: profile.longitude,
    gender: profile.gender,
  });
  const start = parseDateTime(calculation.yunStartDateTime);
  const target = { ...parseDate(referenceDate), hour: 12, minute: 0, second: 0 };
  let elapsedYears = target.year - start.year;
  if (isBeforeAnniversary(target, start)) elapsedYears -= 1;
  if (elapsedYears < 0) return '童限';
  const index = Math.floor(elapsedYears / 10);
  const lastDaYun = calculation.daYunSequence[calculation.daYunSequence.length - 1];
  return calculation.daYunSequence[index]?.ganZhi || lastDaYun?.ganZhi || '未知';
};

const getManualDaYun = (profile: Extract<BaziProfile, { source: 'manual' }>, referenceDate: string) => {
  const targetYear = parseDate(referenceDate).year;
  const virtualAge = targetYear - Number(profile.birthYear) + 1;
  const startAge = Number(profile.startAge);
  if (virtualAge < startAge) return '童限';
  const { isForward } = getDaYunDirection(profile.yearPillar, profile.gender);
  const sequence = generateDaYunSequence(profile.firstDaYun, isForward, 12);
  return sequence[Math.floor((virtualAge - startAge) / 10)] || sequence[sequence.length - 1] || '未知';
};

export const generateFortunePeriodContext = (
  profile: BaziProfile,
  type: FortunePeriodType,
  referenceDate: string,
): FortunePeriodContext => {
  const referenceParts = parseDate(referenceDate);
  const referenceLunar = Solar.fromYmdHms(referenceParts.year, referenceParts.month, referenceParts.day, 12, 0, 0).getLunar();
  const range = type === 'week'
    ? (() => {
        const week = getWeekDateRange(referenceDate);
        return { startDateTime: `${week.startDate} 00:00:00`, endDateTime: `${week.endDate} 23:59:59` };
      })()
    : getSolarMonthRange(referenceDate);

  const baseContext: Omit<FortunePeriodContext, 'baziInteractions'> = {
    type,
    startDateTime: range.startDateTime,
    endDateTime: range.endDateTime,
    daYun: profile.source === 'auto' ? getExactDaYun(profile, referenceDate) : getManualDaYun(profile, referenceDate),
    daYunBasis: profile.source === 'auto' ? 'exact' : 'manual-age-range',
    liuNian: referenceLunar.getYearInGanZhiExact(),
    liuYueSegments: buildLiuYueSegments(range.startDateTime, range.endDateTime),
    days: buildDays(range.startDateTime, range.endDateTime),
  };
  return {
    ...baseContext,
    baziInteractions: calculateBaziInteractions(resolveBaziProfile(profile), baseContext),
  };
};

export const shiftPeriodReferenceDate = (
  context: FortunePeriodContext,
  direction: -1 | 1,
) => {
  if (context.type === 'week') {
    return addDays(context.startDateTime.slice(0, 10), direction * 7);
  }
  return direction < 0
    ? addDays(context.startDateTime.slice(0, 10), -1)
    : addDays(context.endDateTime.slice(0, 10), 1);
};

export const buildTimelineRanges = (context: FortunePeriodContext) => {
  if (context.type === 'week') return context.days.map(day => day.date);
  const ranges: string[] = [];
  const firstDay = context.days[0];
  const lastDay = context.days[context.days.length - 1];
  if (!firstDay || !lastDay) return ranges;
  const lastDate = lastDay.date;
  let startDate = firstDay.date;

  while (startDate <= lastDate && ranges.length < 6) {
    const endDate = addDays(startDate, 6) > lastDate ? lastDate : addDays(startDate, 6);
    ranges.push(startDate === endDate ? startDate : `${startDate} 至 ${endDate}`);
    startDate = addDays(endDate, 1);
  }

  return ranges;
};
