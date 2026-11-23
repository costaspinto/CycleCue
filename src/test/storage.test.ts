import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEmptyState, createSymptomEntry, isTrackerState, loadTrackerState, saveTrackerState } from '../lib/storage';

describe('tracker storage validation', () => {
  beforeEach(() => window.localStorage.clear());

  it('accepts a valid empty state', () => {
    expect(isTrackerState(createEmptyState())).toBe(true);
  });

  it('rejects out-of-range profile values and malformed dates', () => {
    const invalidProfile = { ...createEmptyState(), profile: { cycleLength: 999, periodLength: 5 } };
    const invalidDate = { ...createEmptyState(), periodStarts: ['2026-02-31'] };
    expect(isTrackerState(invalidProfile)).toBe(false);
    expect(isTrackerState(invalidDate)).toBe(false);
  });

  it('round trips validated state through local storage', () => {
    const state = { ...createEmptyState(), entries: [createSymptomEntry({ date: '2026-11-23', flow: null, mood: 'okay', symptoms: ['Fatigue'] })] };
    expect(saveTrackerState(state)).toBe('saved');
    expect(loadTrackerState().state).toEqual(state);
  });

  it('removes corrupt persisted values rather than trusting them', () => {
    window.localStorage.setItem('bloomcycle.tracker.v1', '{ broken json');
    const result = loadTrackerState();
    expect(result.state).toBeNull();
    expect(result.status).toBe('corrupt');
    expect(window.localStorage.getItem('bloomcycle.tracker.v1')).toBeNull();
  });

  it('migrates the previous guest tracker key to the current v3 schema', () => {
    const legacy = {
      schemaVersion: 2,
      profile: { cycleLength: 29, periodLength: 4 },
      periodStarts: ['2026-10-01', '2026-10-30'],
      entries: [],
      recycleBin: [],
      isDemo: false,
    };
    window.localStorage.setItem('bloomcycle.tracker.v1', JSON.stringify(legacy));
    const result = loadTrackerState('cyclecue.tracker.v3:guest');
    expect(result.status).toBe('saved');
    expect(result.state?.schemaVersion).toBe(3);
    expect(result.state?.fertilityObservations).toEqual([]);
    expect(window.localStorage.getItem('bloomcycle.tracker.v1')).toBeNull();
  });

  it('migrates scoped v2 data without reading another account key', () => {
    const legacy = {
      schemaVersion: 2,
      profile: { cycleLength: 28, periodLength: 5 },
      periodStarts: ['2026-10-01'],
      entries: [],
      recycleBin: [],
      isDemo: false,
    };
    window.localStorage.setItem('cyclecue.tracker.v2:user-1', JSON.stringify(legacy));
    window.localStorage.setItem('cyclecue.tracker.v2:user-2', JSON.stringify(legacy));
    const result = loadTrackerState('cyclecue.tracker.v3:user-1');
    expect(result.state?.periodStarts).toEqual(['2026-10-01']);
    expect(window.localStorage.getItem('cyclecue.tracker.v2:user-2')).not.toBeNull();
  });

  it('returns unavailable instead of throwing when storage access fails', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(loadTrackerState().status).toBe('unavailable');
    getItemSpy.mockRestore();
  });
});
