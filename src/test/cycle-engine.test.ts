import { describe, expect, it } from 'vitest';
import { calculateCyclePrediction, getCycleDay, getCycleIntervals, isDateWithinRange } from '../lib/cycle-engine';
import { createEmptyState } from '../lib/storage';

describe('cycle prediction engine', () => {
  it('calculates intervals in chronological order and ignores duplicate dates', () => {
    expect(getCycleIntervals(['2026-10-01', '2026-10-29', '2026-10-29', '2026-11-26'])).toEqual([28, 28]);
  });

  it('uses the configured cycle length when there is not enough history', () => {
    const state = { ...createEmptyState(), periodStarts: ['2026-11-01'] };
    const prediction = calculateCyclePrediction(state);
    expect(prediction.averageCycleLength).toBe(28);
    expect(prediction.nextPeriodDate).toBe('2026-11-29');
    expect(prediction.confidenceLabel).toBe('More data needed');
  });

  it('uses the median of recent valid intervals to reduce outlier impact', () => {
    const state = {
      ...createEmptyState(),
      periodStarts: ['2026-08-01', '2026-08-28', '2026-09-25', '2026-10-25'],
    };
    const prediction = calculateCyclePrediction(state);
    expect(prediction.averageCycleLength).toBe(28);
    expect(prediction.nextPeriodDate).toBe('2026-11-22');
  });

  it('does not classify a date range when the input is invalid', () => {
    expect(isDateWithinRange('not-a-date', '2026-11-01', '2026-11-07')).toBe(false);
    expect(isDateWithinRange('2026-11-05', null, null)).toBe(false);
  });

  it('counts cycle day from day one and rejects dates before the last start', () => {
    expect(getCycleDay('2026-11-01', '2026-11-01')).toBe(1);
    expect(getCycleDay('2026-11-01', '2026-11-23')).toBe(23);
    expect(getCycleDay('2026-11-01', '2026-10-31')).toBeNull();
  });
});
