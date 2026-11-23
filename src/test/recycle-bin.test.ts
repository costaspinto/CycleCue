import { describe, expect, it } from 'vitest';
import { createEmptyState, createSymptomEntry } from '../lib/storage';
import {
  moveAllHealthRecordsToRecycleBin, moveCheckInToRecycleBin, movePeriodToRecycleBin,
  moveFertilityObservationToRecycleBin, purgeExpiredRecords, restoreRecycleRecord,
} from '../lib/recycle-bin';

describe('Recycle Bin', () => {
  const now = new Date('2026-11-23T12:00:00.000Z');

  it('moves and restores a period date', () => {
    const state = { ...createEmptyState(), periodStarts: ['2026-11-01'] };
    const deleted = movePeriodToRecycleBin(state, '2026-11-01', now);
    expect(deleted.periodStarts).toEqual([]);
    expect(deleted.recycleBin).toHaveLength(1);
    expect(deleted.recycleBin[0]?.expiresAt).toBe('2026-12-23T12:00:00.000Z');
    const restored = restoreRecycleRecord(deleted, deleted.recycleBin[0]!.id, now);
    expect(restored.periodStarts).toEqual(['2026-11-01']);
    expect(restored.recycleBin).toHaveLength(0);
  });

  it('moves and restores a symptom check-in', () => {
    const entry = createSymptomEntry({ date: '2026-11-10', flow: 'light', mood: 'okay', symptoms: ['Cramps'] });
    const state = { ...createEmptyState(), entries: [entry] };
    const deleted = moveCheckInToRecycleBin(state, entry.id, now);
    expect(deleted.entries).toHaveLength(0);
    const restored = restoreRecycleRecord(deleted, deleted.recycleBin[0]!.id, now);
    expect(restored.entries).toEqual([entry]);
  });

  it('moves fertility observations to the same recycle workflow', () => {
    const observation = { id: 'fertility-1', date: '2026-11-12', opkResult: 'positive' as const, cervicalMucus: 'egg-white' as const, basalBodyTempC: 36.51 };
    const state = { ...createEmptyState(), fertilityObservations: [observation] };
    const deleted = moveFertilityObservationToRecycleBin(state, observation.id, now);
    expect(deleted.fertilityObservations).toHaveLength(0);
    const restored = restoreRecycleRecord(deleted, deleted.recycleBin[0]!.id, now);
    expect(restored.fertilityObservations).toEqual([observation]);
  });

  it('expires records after the 30-day retention period', () => {
    const state = { ...createEmptyState(), periodStarts: ['2026-11-01'] };
    const deleted = moveAllHealthRecordsToRecycleBin(state, now);
    const afterRetention = purgeExpiredRecords(deleted, new Date('2026-12-24T12:00:00.000Z'));
    expect(afterRetention.recycleBin).toHaveLength(0);
  });
});
