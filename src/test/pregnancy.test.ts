import { describe, expect, it } from 'vitest';
import { calculateEstimatedDueDate, getPregnancyEstimate } from '../lib/pregnancy';

describe('pregnancy date calculator', () => {
  it('uses 280 days from LMP for a 28-day cycle', () => {
    expect(calculateEstimatedDueDate({ method: 'lmp', date: '2026-02-01', cycleLength: 28 })).toBe('2026-11-08');
  });

  it('adjusts the LMP estimate for a different typical cycle length', () => {
    expect(calculateEstimatedDueDate({ method: 'lmp', date: '2026-02-01', cycleLength: 35 })).toBe('2026-11-15');
  });

  it('uses a separate dating calculation for conception and IVF transfer', () => {
    expect(calculateEstimatedDueDate({ method: 'conception', date: '2026-02-01' })).toBe('2026-10-25');
    expect(calculateEstimatedDueDate({ method: 'ivf-transfer', date: '2026-02-01', embryoAgeDays: 5 })).toBe('2026-10-20');
  });

  it('returns completed weeks and days from an LMP reference', () => {
    const estimate = getPregnancyEstimate({ method: 'lmp', date: '2026-02-01', today: '2026-04-05' });
    expect(estimate.weeks).toBe(9);
    expect(estimate.days).toBe(0);
    expect(estimate.trimester).toBe(1);
  });

  it('rejects invalid dates and cycle lengths', () => {
    expect(() => calculateEstimatedDueDate({ method: 'lmp', date: '2026-02-31' })).toThrow();
    expect(() => calculateEstimatedDueDate({ method: 'lmp', date: '2026-02-01', cycleLength: 99 })).toThrow();
    expect(() => getPregnancyEstimate({ method: 'lmp', date: '2026-05-01', today: '2026-04-05' })).toThrow();
  });
});
