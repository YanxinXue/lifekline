import { describe, expect, it } from 'vitest';
import { calculateBazi } from './baziCalculator';

describe('baziCalculator', () => {
  it('uses the 23:00 Zi-hour day boundary after true-solar-time correction', () => {
    const before = calculateBazi({
      birthDate: '2026-08-05',
      birthTime: '22:30',
      longitude: 120,
      gender: 'Male',
    });
    const after = calculateBazi({
      birthDate: '2026-08-05',
      birthTime: '23:30',
      longitude: 120,
      gender: 'Male',
    });

    expect(before.dayPillar).not.toBe(after.dayPillar);
  });
});
