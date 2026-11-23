import type { FertilityObservation, RecycleRecord, SymptomEntry, TrackerState } from '../types';
import { isDateOnly } from './date';

const RETENTION_DAYS = 30;
const DAY_MS = 86_400_000;

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `deleted-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function retentionDates(now: Date): { deletedAt: string; expiresAt: string } {
  const deletedAt = now.toISOString();
  return { deletedAt, expiresAt: new Date(now.getTime() + RETENTION_DAYS * DAY_MS).toISOString() };
}

export function purgeExpiredRecords(state: TrackerState, now = new Date()): TrackerState {
  const nowMs = now.getTime();
  return { ...state, recycleBin: state.recycleBin.filter((record) => Date.parse(record.expiresAt) > nowMs) };
}

export function movePeriodToRecycleBin(state: TrackerState, date: string, now = new Date()): TrackerState {
  if (!state.periodStarts.includes(date)) return state;
  const record: RecycleRecord = { id: makeId(), type: 'period', date, ...retentionDates(now) };
  return { ...state, periodStarts: state.periodStarts.filter((item) => item !== date), recycleBin: [...state.recycleBin, record], isDemo: false };
}

export function moveFertilityObservationToRecycleBin(state: TrackerState, observationId: string, now = new Date()): TrackerState {
  const observation = state.fertilityObservations.find((item) => item.id === observationId);
  if (!observation) return state;
  const record: RecycleRecord = { id: makeId(), type: 'fertility', observation, ...retentionDates(now) };
  return { ...state, fertilityObservations: state.fertilityObservations.filter((item) => item.id !== observationId), recycleBin: [...state.recycleBin, record], isDemo: false };
}

export function moveCheckInToRecycleBin(state: TrackerState, entryId: string, now = new Date()): TrackerState {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return state;
  const record: RecycleRecord = { id: makeId(), type: 'checkin', entry, ...retentionDates(now) };
  return { ...state, entries: state.entries.filter((item) => item.id !== entryId), recycleBin: [...state.recycleBin, record], isDemo: false };
}

export function restoreRecycleRecord(state: TrackerState, recordId: string, now = new Date()): TrackerState {
  const record = state.recycleBin.find((item) => item.id === recordId);
  if (!record || Date.parse(record.expiresAt) <= now.getTime()) return purgeExpiredRecords(state, now);
  const remaining = state.recycleBin.filter((item) => item.id !== recordId);
  if (record.type === 'period') {
    if (state.periodStarts.includes(record.date)) return { ...state, recycleBin: remaining };
    return { ...state, periodStarts: [...state.periodStarts, record.date].sort(), recycleBin: remaining, isDemo: false };
  }
  if (record.type === 'fertility') {
    if (state.fertilityObservations.some((item) => item.id === record.observation.id)) return { ...state, recycleBin: remaining };
    return { ...state, fertilityObservations: [...state.fertilityObservations, record.observation].sort((a, b) => a.date.localeCompare(b.date)), recycleBin: remaining, isDemo: false };
  }
  const entries = state.entries.filter((item) => item.date !== record.entry.date);
  return { ...state, entries: [...entries, record.entry].sort((a, b) => a.date.localeCompare(b.date)), recycleBin: remaining, isDemo: false };
}

export function permanentlyDeleteRecycleRecord(state: TrackerState, recordId: string): TrackerState {
  return { ...state, recycleBin: state.recycleBin.filter((item) => item.id !== recordId) };
}

export function moveAllHealthRecordsToRecycleBin(state: TrackerState, now = new Date()): TrackerState {
  const dates = state.periodStarts.map<RecycleRecord>((date) => ({ id: makeId(), type: 'period', date, ...retentionDates(now) }));
  const checkIns = state.entries.map<RecycleRecord>((entry) => ({ id: makeId(), type: 'checkin', entry, ...retentionDates(now) }));
  const fertility = state.fertilityObservations.map<RecycleRecord>((observation) => ({ id: makeId(), type: 'fertility', observation, ...retentionDates(now) }));
  return { ...state, periodStarts: [], entries: [], fertilityObservations: [], recycleBin: [...state.recycleBin, ...dates, ...checkIns, ...fertility], isDemo: false };
}

export function getDaysUntilExpiry(record: RecycleRecord, now = new Date()): number {
  return Math.max(0, Math.ceil((Date.parse(record.expiresAt) - now.getTime()) / DAY_MS));
}

export function getRecycleRecordLabel(record: RecycleRecord): string {
  if (record.type === 'period') return `Period start · ${record.date}`;
  if (record.type === 'fertility') return `Fertility observation · ${record.observation.date}`;
  const symptomSummary = record.entry.symptoms.length ? record.entry.symptoms.join(', ') : 'No symptoms selected';
  return `Daily check-in · ${record.entry.date} · ${symptomSummary}`;
}

export function getRecycleRecordDate(record: RecycleRecord): string {
  return record.type === 'period' ? record.date : record.type === 'fertility' ? record.observation.date : record.entry.date;
}

export function isValidRecycleRecord(value: unknown): value is RecycleRecord {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  if (typeof item['id'] !== 'string' || typeof item['deletedAt'] !== 'string' || typeof item['expiresAt'] !== 'string') return false;
  if (!Number.isFinite(Date.parse(item['deletedAt'])) || !Number.isFinite(Date.parse(item['expiresAt']))) return false;
  if (item['type'] === 'period') return isDateOnly(item['date']);
  if (item['type'] === 'checkin') {
    const entry = item['entry'] as SymptomEntry | undefined;
    return Boolean(entry && typeof entry.id === 'string' && entry.id.length > 0 && entry.id.length <= 80
      && isDateOnly(entry.date)
      && (entry.flow === null || ['light', 'medium', 'heavy', 'spotting'].includes(entry.flow))
      && (entry.mood === null || ['good', 'okay', 'low', 'anxious'].includes(entry.mood))
      && Array.isArray(entry.symptoms) && entry.symptoms.length <= 8
      && entry.symptoms.every((symptom) => ['Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Fatigue', 'Acne', 'Backache', 'Nausea'].includes(symptom)));
  }
  if (item['type'] === 'fertility') {
    const observation = item['observation'] as FertilityObservation | undefined;
    return Boolean(observation && typeof observation.id === 'string' && observation.id.length > 0 && observation.id.length <= 80 && isDateOnly(observation.date)
      && ['positive', 'negative', 'not-tested'].includes(observation.opkResult)
      && ['dry', 'sticky', 'creamy', 'watery', 'egg-white', 'unknown'].includes(observation.cervicalMucus)
      && (observation.basalBodyTempC === null || (typeof observation.basalBodyTempC === 'number' && Number.isFinite(observation.basalBodyTempC) && observation.basalBodyTempC >= 30 && observation.basalBodyTempC <= 42)));
  }
  return false;
}
