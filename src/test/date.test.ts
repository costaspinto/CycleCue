import { describe, expect, it } from 'vitest';
import { addDays, differenceInDays, getMonthGrid, isDateOnly } from '../lib/date';

describe('date utilities', () => {
  it('validates strict real calendar dates', () => {
    expect(isDateOnly('2026-02-28')).toBe(true);
    expect(isDateOnly('2026-02-30')).toBe(false);
    expect(isDateOnly('28-02-2026')).toBe(false);
  });

  it('adds days without UTC date shifting', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('calculates date difference in whole calendar days', () => {
    expect(differenceInDays('2026-11-01', '2026-11-23')).toBe(22);
  });

  it('returns a Monday-first month grid with complete weeks', () => {
    const grid = getMonthGrid(2026, 10);
    expect(grid.length % 7).toBe(0);
    expect(grid.filter(Boolean)).toHaveLength(30);
    expect(grid[6]).toBe('2026-11-01');
  });
});
