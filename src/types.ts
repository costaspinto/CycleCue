export type FlowLevel = 'light' | 'medium' | 'heavy' | 'spotting';
export type Mood = 'good' | 'okay' | 'low' | 'anxious';
export type Symptom =
  | 'Cramps'
  | 'Headache'
  | 'Bloating'
  | 'Tender breasts'
  | 'Fatigue'
  | 'Acne'
  | 'Backache'
  | 'Nausea';

export interface SymptomEntry {
  id: string;
  date: string;
  flow: FlowLevel | null;
  mood: Mood | null;
  symptoms: Symptom[];
}

export interface TrackerProfile {
  cycleLength: number;
  periodLength: number;
}

export type OpkResult = 'positive' | 'negative' | 'not-tested';
export type CervicalMucus = 'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white' | 'unknown';

export interface FertilityObservation {
  id: string;
  date: string;
  opkResult: OpkResult;
  cervicalMucus: CervicalMucus;
  basalBodyTempC: number | null;
}

export type RecycleRecord =
  | { id: string; type: 'period'; deletedAt: string; expiresAt: string; date: string }
  | { id: string; type: 'checkin'; deletedAt: string; expiresAt: string; entry: SymptomEntry }
  | { id: string; type: 'fertility'; deletedAt: string; expiresAt: string; observation: FertilityObservation };

export interface TrackerState {
  schemaVersion: 3;
  profile: TrackerProfile;
  periodStarts: string[];
  entries: SymptomEntry[];
  fertilityObservations: FertilityObservation[];
  recycleBin: RecycleRecord[];
  isDemo: boolean;
}

export interface CyclePrediction {
  averageCycleLength: number;
  nextPeriodDate: string | null;
  estimatedOvulationDate: string | null;
  fertileWindowStart: string | null;
  fertileWindowEnd: string | null;
  confidenceLabel: 'More data needed' | 'Variable pattern' | 'Pattern estimate';
  completedIntervals: number;
  variabilityDays: number | null;
}

export type AppSection =
  | 'overview'
  | 'calendar'
  | 'insights'
  | 'pregnancy'
  | 'fertility'
  | 'nutrition'
  | 'movement'
  | 'wellness'
  | 'habits'
  | 'recycle'
  | 'assistant'
  | 'about'
  | 'settings';
