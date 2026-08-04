import { beforeEach, describe, expect, it } from 'vitest';
import { Gender, type BaziProfile } from '../types';
import {
  BAZI_PROFILE_STORAGE_KEY,
  clearBaziProfile,
  isValidBaziProfile,
  loadBaziProfile,
  resolveBaziProfile,
  saveBaziProfile,
} from './baziProfileStorage';

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, 'window', { value: { localStorage: storage }, configurable: true });

const manualProfile: BaziProfile = {
  version: 1,
  source: 'manual',
  name: '测试用户',
  gender: Gender.MALE,
  birthYear: '1990',
  yearPillar: '庚午',
  monthPillar: '丁亥',
  dayPillar: '甲子',
  hourPillar: '乙丑',
  startAge: '6',
  firstDaYun: '戊子',
  updatedAt: '2026-08-03T00:00:00.000Z',
};

describe('baziProfileStorage', () => {
  beforeEach(() => storage.clear());

  it('saves, loads and clears a valid manual profile', () => {
    expect(saveBaziProfile(manualProfile).ok).toBe(true);
    expect(loadBaziProfile()).toEqual(manualProfile);
    expect(clearBaziProfile().ok).toBe(true);
    expect(loadBaziProfile()).toBeNull();
  });

  it('removes corrupted or incompatible cached data', () => {
    storage.setItem(BAZI_PROFILE_STORAGE_KEY, '{broken');
    expect(loadBaziProfile()).toBeNull();
    expect(storage.getItem(BAZI_PROFILE_STORAGE_KEY)).toBeNull();

    storage.setItem(BAZI_PROFILE_STORAGE_KEY, JSON.stringify({ ...manualProfile, version: 2 }));
    expect(loadBaziProfile()).toBeNull();
  });

  it('rejects invalid pillars and resolves automatic profiles from raw birth data', () => {
    expect(isValidBaziProfile({ ...manualProfile, dayPillar: '错误' })).toBe(false);
    const automaticProfile: BaziProfile = {
      version: 1,
      source: 'auto',
      name: '自动排盘',
      gender: Gender.MALE,
      birthDate: '1986-09-22',
      birthTime: '10:30',
      cityName: '武汉',
      longitude: 114.3,
      updatedAt: '2026-08-03T00:00:00.000Z',
    };
    const resolved = resolveBaziProfile(automaticProfile);
    expect(saveBaziProfile(automaticProfile).ok).toBe(true);
    expect(loadBaziProfile()).toMatchObject({ cityName: '武汉', longitude: 114.3 });
    expect(resolved.birthYear).toBe('1986');
    expect(resolved.yearPillar).toHaveLength(2);
    expect(resolved.firstDaYun).toHaveLength(2);
  });

  it('keeps the current flow usable when storage writes are blocked', () => {
    const blockedStorage = {
      getItem: () => null,
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    Object.defineProperty(globalThis, 'window', { value: { localStorage: blockedStorage }, configurable: true });
    expect(saveBaziProfile(manualProfile)).toMatchObject({ ok: false });
    expect(clearBaziProfile()).toMatchObject({ ok: false });
    Object.defineProperty(globalThis, 'window', { value: { localStorage: storage }, configurable: true });
  });
});
