import { describe, expect, it } from 'vitest';
import { buildAssistantTrackerContext } from '../lib/assistant-context';
import type { TrackerState } from '../types';

const state: TrackerState = {
  schemaVersion: 3,
  profile: { cycleLength: 29, periodLength: 5 },
  periodStarts: ['2026-09-01', '2026-09-30', '2026-10-29', 'invalid', '2027-01-01'],
  entries: [
    { id: 'e1', date: '2026-11-10', flow: null, mood: null, symptoms: ['Cramps', 'Headache'] },
    { id: 'e2', date: '2026-11-12', flow: null, mood: null, symptoms: ['Cramps'] },
    { id: 'e3', date: '2026-10-01', flow: null, mood: null, symptoms: ['Nausea'] },
  ],
  fertilityObservations: [
    { id: 'f1', date: '2026-11-15', opkResult: 'positive', cervicalMucus: 'egg-white', basalBodyTempC: 36.5 },
    { id: 'f2', date: '2026-10-01', opkResult: 'negative', cervicalMucus: 'dry', basalBodyTempC: null },
  ],
  recycleBin: [],
  isDemo: false,
};

describe('buildAssistantTrackerContext', () => {
  it('returns a compact summary and excludes invalid/future records', () => {
    const result = buildAssistantTrackerContext(state, new Date('2026-11-24T12:00:00Z'));
    expect(result.usualCycleLengthDays).toBe(29);
    expect(result.usualPeriodLengthDays).toBe(5);
    expect(result.recordedPeriodStarts).toBe(3);
    expect(result.lastPeriodStart).toBe('2026-10-29');
    expect(result.recentAverageCycleDays).toBe(29);
    expect(result.commonSymptomsLast30Days).toEqual([
      { symptom: 'Cramps', count: 2 },
      { symptom: 'Headache', count: 1 },
    ]);
    expect(result.fertilityObservationsLast30Days).toBe(1);
    expect(result.positiveOpkResultsLast30Days).toBe(1);
    expect(result.fertileMucusObservationsLast30Days).toBe(1);
  });

  it('handles empty records without inventing dates or cycle intervals', () => {
    const empty: TrackerState = {
      ...state,
      periodStarts: [],
      entries: [],
      fertilityObservations: [],
    };
    const result = buildAssistantTrackerContext(empty, new Date('2026-11-24T12:00:00Z'));
    expect(result.recordedPeriodStarts).toBe(0);
    expect(result.lastPeriodStart).toBeNull();
    expect(result.recentAverageCycleDays).toBeNull();
    expect(result.commonSymptomsLast30Days).toEqual([]);
    expect(result.fertilityObservationsLast30Days).toBe(0);
  });
});
