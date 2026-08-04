import { BaziProfile, Gender, ResolvedBaziProfile } from '../types';
import { calculateBazi } from './baziCalculator';
import { JIAZI } from './promptBuilder';

export const BAZI_PROFILE_STORAGE_KEY = 'lifekline_bazi_profile_v1';

export interface StorageOperationResult {
  ok: boolean;
  message?: string;
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isGender = (value: unknown): value is Gender => value === Gender.MALE || value === Gender.FEMALE;
const isPillar = (value: unknown) => isString(value) && JIAZI.includes(value.trim());

export const isValidBaziProfile = (value: unknown): value is BaziProfile => {
  if (!value || typeof value !== 'object') return false;
  const profile = value as Record<string, unknown>;
  if (profile.version !== 1 || !isString(profile.name) || !isGender(profile.gender) || !isString(profile.updatedAt)) {
    return false;
  }

  if (profile.source === 'auto') {
    const hasValidShape = /^\d{4}-\d{2}-\d{2}$/.test(String(profile.birthDate)) &&
      /^\d{2}:\d{2}$/.test(String(profile.birthTime)) &&
      isString(profile.cityName) && Boolean(profile.cityName.trim()) &&
      typeof profile.longitude === 'number' && Number.isFinite(profile.longitude) &&
      profile.longitude >= -180 && profile.longitude <= 180;
    if (!hasValidShape) return false;
    try {
      calculateBazi({
        birthDate: String(profile.birthDate),
        birthTime: String(profile.birthTime),
        longitude: Number(profile.longitude),
        gender: profile.gender,
      });
      return true;
    } catch {
      return false;
    }
  }

  if (profile.source === 'manual') {
    const birthYear = Number(profile.birthYear);
    const startAge = Number(profile.startAge);
    return isString(profile.birthYear) && Number.isInteger(birthYear) && birthYear >= 1 && birthYear <= 9999 &&
      isPillar(profile.yearPillar) && isPillar(profile.monthPillar) &&
      isPillar(profile.dayPillar) && isPillar(profile.hourPillar) &&
      isString(profile.startAge) && Number.isInteger(startAge) && startAge >= 1 && startAge <= 100 &&
      isPillar(profile.firstDaYun);
  }

  return false;
};

export const loadBaziProfile = (): BaziProfile | null => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(BAZI_PROFILE_STORAGE_KEY);
    if (!saved) return null;
    const parsed: unknown = JSON.parse(saved);
    if (isValidBaziProfile(parsed)) return parsed;
    window.localStorage.removeItem(BAZI_PROFILE_STORAGE_KEY);
    return null;
  } catch {
    try {
      window.localStorage.removeItem(BAZI_PROFILE_STORAGE_KEY);
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
    return null;
  }
};

export const saveBaziProfile = (profile: BaziProfile): StorageOperationResult => {
  if (typeof window === 'undefined') return { ok: false, message: '当前环境不支持浏览器缓存。' };

  try {
    window.localStorage.setItem(BAZI_PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return { ok: true };
  } catch {
    return { ok: false, message: '浏览器未允许保存生辰资料，本次仍可继续生成。' };
  }
};

export const clearBaziProfile = (): StorageOperationResult => {
  if (typeof window === 'undefined') return { ok: false, message: '当前环境不支持浏览器缓存。' };

  try {
    window.localStorage.removeItem(BAZI_PROFILE_STORAGE_KEY);
    return { ok: true };
  } catch {
    return { ok: false, message: '浏览器未允许清除缓存，请在浏览器网站设置中删除。' };
  }
};

export const resolveBaziProfile = (profile: BaziProfile): ResolvedBaziProfile => {
  if (profile.source === 'manual') {
    return {
      profile,
      name: profile.name,
      gender: profile.gender,
      birthYear: profile.birthYear,
      yearPillar: profile.yearPillar,
      monthPillar: profile.monthPillar,
      dayPillar: profile.dayPillar,
      hourPillar: profile.hourPillar,
      startAge: profile.startAge,
      firstDaYun: profile.firstDaYun,
    };
  }

  const calculated = calculateBazi({
    birthDate: profile.birthDate,
    birthTime: profile.birthTime,
    longitude: profile.longitude,
    gender: profile.gender,
  });

  return {
    profile,
    name: profile.name,
    gender: profile.gender,
    birthYear: profile.birthDate.slice(0, 4),
    yearPillar: calculated.yearPillar,
    monthPillar: calculated.monthPillar,
    dayPillar: calculated.dayPillar,
    hourPillar: calculated.hourPillar,
    startAge: String(calculated.startAge),
    firstDaYun: calculated.firstDaYun,
  };
};
