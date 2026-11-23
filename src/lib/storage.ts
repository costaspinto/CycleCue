import type { CervicalMucus, FlowLevel, FertilityObservation, Mood, OpkResult, RecycleRecord, Symptom, SymptomEntry, TrackerState } from '../types';
import { isDateOnly } from './date';
import { isValidRecycleRecord, purgeExpiredRecords } from './recycle-bin';

const STORAGE_KEY = 'cyclecue.tracker.v3';
const LEGACY_STORAGE_KEYS = ['bloomcycle.tracker.v1', 'cyclecue.tracker.v1', 'cyclecue.tracker.v2'];
const MAX_PERIODS = 60;
const MAX_ENTRIES = 180;
const MAX_RECYCLE_RECORDS = 500;
const VALID_OPK: OpkResult[] = ['positive', 'negative', 'not-tested'];
const VALID_MUCUS: CervicalMucus[] = ['dry', 'sticky', 'creamy', 'watery', 'egg-white', 'unknown'];
const VALID_FLOW: FlowLevel[] = ['light', 'medium', 'heavy', 'spotting'];
const VALID_MOOD: Mood[] = ['good', 'okay', 'low', 'anxious'];
const VALID_SYMPTOMS: Symptom[] = [
  'Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Fatigue', 'Acne', 'Backache', 'Nausea',
];

export type StorageStatus = 'saved' | 'unavailable' | 'corrupt';
export interface LoadResult {
  state: TrackerState | null;
  status: StorageStatus;
}

function isSymptomEntry(value: unknown): value is SymptomEntry {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row['id'] === 'string' && row['id'].length > 0 && row['id'].length <= 80
    && isDateOnly(row['date'])
    && (row['flow'] === null || VALID_FLOW.includes(row['flow'] as FlowLevel))
    && (row['mood'] === null || VALID_MOOD.includes(row['mood'] as Mood))
    && Array.isArray(row['symptoms'])
    && row['symptoms'].length <= VALID_SYMPTOMS.length
    && row['symptoms'].every((item: unknown) => VALID_SYMPTOMS.includes(item as Symptom));
}

function isFertilityObservation(value: unknown): value is FertilityObservation {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item['id'] === 'string' && item['id'].length > 0 && item['id'].length <= 80
    && isDateOnly(item['date'])
    && VALID_OPK.includes(item['opkResult'] as OpkResult)
    && VALID_MUCUS.includes(item['cervicalMucus'] as CervicalMucus)
    && (item['basalBodyTempC'] === null || (typeof item['basalBodyTempC'] === 'number' && Number.isFinite(item['basalBodyTempC']) && item['basalBodyTempC'] >= 30 && item['basalBodyTempC'] <= 42));
}

export function isTrackerState(value: unknown): value is TrackerState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (![1, 2, 3].includes(candidate['schemaVersion'] as number) || typeof candidate['isDemo'] !== 'boolean') return false;

  const profile = candidate['profile'];
  if (!profile || typeof profile !== 'object') return false;
  const profileRecord = profile as Record<string, unknown>;
  const cycleLength = profileRecord['cycleLength'];
  const periodLength = profileRecord['periodLength'];
  if (typeof cycleLength !== 'number' || !Number.isInteger(cycleLength) || cycleLength < 15 || cycleLength > 60) return false;
  if (typeof periodLength !== 'number' || !Number.isInteger(periodLength) || periodLength < 1 || periodLength > 10) return false;

  const periodStarts = candidate['periodStarts'];
  if (!Array.isArray(periodStarts) || periodStarts.length > MAX_PERIODS || !periodStarts.every(isDateOnly)) return false;

  const entries = candidate['entries'];
  if (!Array.isArray(entries) || entries.length > MAX_ENTRIES || !entries.every(isSymptomEntry)) return false;

  if (candidate['schemaVersion'] === 2 || candidate['schemaVersion'] === 3) {
    const recycleBin = candidate['recycleBin'];
    if (!Array.isArray(recycleBin) || recycleBin.length > MAX_RECYCLE_RECORDS || !recycleBin.every(isValidRecycleRecord)) return false;
  }
  if (candidate['schemaVersion'] === 3) {
    const observations = candidate['fertilityObservations'];
    if (!Array.isArray(observations) || observations.length > 240 || !observations.every(isFertilityObservation)) return false;
  }
  return true;
}

function migrateState(value: unknown): TrackerState | null {
  if (!isTrackerState(value)) return null;
  const version = (value as unknown as { schemaVersion: number }).schemaVersion;
  if (version === 3) return purgeExpiredRecords(value);
  const previous = value as unknown as {
    profile: TrackerState['profile'];
    periodStarts: string[];
    entries: SymptomEntry[];
    recycleBin?: RecycleRecord[];
    isDemo: boolean;
  };
  return {
    schemaVersion: 3,
    profile: previous.profile,
    periodStarts: previous.periodStarts,
    entries: previous.entries,
    fertilityObservations: [],
    recycleBin: previous.recycleBin ?? [],
    isDemo: previous.isDemo,
  };
}

function parseStoredValue(raw: string): TrackerState | null {
  try {
    return migrateState(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

export function loadTrackerState(storageKey = STORAGE_KEY): LoadResult {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return { state: null, status: 'unavailable' };
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      const migrated = parseStoredValue(raw);
      if (!migrated) {
        window.localStorage.removeItem(storageKey);
        return { state: null, status: 'corrupt' };
      }
      if (JSON.stringify(migrated) !== raw) window.localStorage.setItem(storageKey, JSON.stringify(migrated));
      return { state: migrated, status: 'saved' };
    }

    const isGuestStorage = storageKey.endsWith(':guest') || storageKey === STORAGE_KEY;
    const scopedV2Key = storageKey.startsWith('cyclecue.tracker.v3:')
      ? storageKey.replace('cyclecue.tracker.v3:', 'cyclecue.tracker.v2:')
      : null;
    const migrationKeys = [...(scopedV2Key ? [scopedV2Key] : []), ...(isGuestStorage ? LEGACY_STORAGE_KEYS : [])];
    let legacyCorrupt = false;
    for (const legacyKey of migrationKeys) {
      const legacyRaw = window.localStorage.getItem(legacyKey);
      if (!legacyRaw) continue;
      const migrated = parseStoredValue(legacyRaw);
      if (migrated) {
        window.localStorage.setItem(storageKey, JSON.stringify(migrated));
        window.localStorage.removeItem(legacyKey);
        return { state: migrated, status: 'saved' };
      }
      window.localStorage.removeItem(legacyKey);
      legacyCorrupt = true;
    }
    if (legacyCorrupt) return { state: null, status: 'corrupt' };
    return { state: null, status: 'saved' };
  } catch {
    return { state: null, status: 'unavailable' };
  }
}

export function saveTrackerState(state: TrackerState, storageKey = STORAGE_KEY): StorageStatus {
  if (!isTrackerState(state)) return 'corrupt';
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'unavailable';
    window.localStorage.setItem(storageKey, JSON.stringify(state));
    return 'saved';
  } catch {
    return 'unavailable';
  }
}

export function clearTrackerState(storageKey = STORAGE_KEY): StorageStatus {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'unavailable';
    window.localStorage.removeItem(storageKey);
    return 'saved';
  } catch {
    return 'unavailable';
  }
}

export function exportTrackerState(state: TrackerState): string {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString(), product: 'CycleCue' }, null, 2);
}

export function createDemoState(today: string): TrackerState {
  const current = new Date(`${today}T12:00:00`);
  const add = (offset: number): string => {
    const date = new Date(current);
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  return {
    schemaVersion: 3,
    profile: { cycleLength: 28, periodLength: 5 },
    periodStarts: [add(-78), add(-50), add(-22)],
    fertilityObservations: [],
    entries: [
      { id: 'demo-entry-1', date: today, flow: null, mood: 'okay', symptoms: ['Fatigue'] },
    ],
    recycleBin: [],
    isDemo: true,
  };
}

export function createEmptyState(): TrackerState {
  return {
    schemaVersion: 3,
    profile: { cycleLength: 28, periodLength: 5 },
    periodStarts: [],
    entries: [],
    fertilityObservations: [],
    recycleBin: [],
    isDemo: false,
  };
}

export function createSymptomEntry(input: Omit<SymptomEntry, 'id'>): SymptomEntry {
  return {
    ...input,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `entry-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
  };
}
