import type { FertilityObservation, TrackerState } from '../types';
import { addDays, toDateKey } from './date';

export interface AssistantTrackerContext {
  usualCycleLengthDays: number | null;
  usualPeriodLengthDays: number | null;
  recordedPeriodStarts: number;
  recentAverageCycleDays: number | null;
  lastPeriodStart: string | null;
  commonSymptomsLast30Days: Array<{ symptom: string; count: number }>;
  fertilityObservationsLast30Days: number;
  positiveOpkResultsLast30Days: number;
  fertileMucusObservationsLast30Days: number;
}

const VALID_SYMPTOMS = new Set([
  'Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Fatigue', 'Acne', 'Backache', 'Nausea',
]);

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function dayDifference(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}

function recentObservation(observation: FertilityObservation, cutoff: string, today: string): boolean {
  return isDateKey(observation.date) && observation.date >= cutoff && observation.date <= today;
}

export function buildAssistantTrackerContext(state: TrackerState, now = new Date()): AssistantTrackerContext {
  // Use the same local calendar-day semantics as the tracker UI.
  const today = toDateKey(now);
  const cutoff = addDays(today, -30);

  // Never include future-entered dates in a health summary.
  const periodStarts = [...new Set(state.periodStarts.filter((date) => isDateKey(date) && date <= today))].sort().slice(-12);
  const intervals = periodStarts.slice(1).flatMap((date, index) => {
    const previous = periodStarts[index];
    return previous ? [dayDifference(previous, date)] : [];
  }).filter((days) => days >= 15 && days <= 60).slice(-6);
  const average = intervals.length
    ? Math.round(intervals.reduce((total, value) => total + value, 0) / intervals.length)
    : null;
  const profileCycle = Number.isInteger(state.profile.cycleLength) && state.profile.cycleLength >= 15 && state.profile.cycleLength <= 60
    ? state.profile.cycleLength : null;
  const profilePeriod = Number.isInteger(state.profile.periodLength) && state.profile.periodLength >= 1 && state.profile.periodLength <= 10
    ? state.profile.periodLength : null;

  const symptomCounts = new Map<string, number>();
  for (const entry of state.entries) {
    if (!isDateKey(entry.date) || entry.date < cutoff || entry.date > today || !Array.isArray(entry.symptoms)) continue;
    for (const symptom of entry.symptoms) {
      if (VALID_SYMPTOMS.has(symptom)) symptomCounts.set(symptom, (symptomCounts.get(symptom) ?? 0) + 1);
    }
  }
  const commonSymptomsLast30Days = [...symptomCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5).map(([symptom, count]) => ({ symptom, count }));

  const observations = state.fertilityObservations.filter((item) => recentObservation(item, cutoff, today));
  return {
    usualCycleLengthDays: profileCycle,
    usualPeriodLengthDays: profilePeriod,
    recordedPeriodStarts: periodStarts.length,
    recentAverageCycleDays: average,
    lastPeriodStart: periodStarts.at(-1) ?? null,
    commonSymptomsLast30Days,
    fertilityObservationsLast30Days: observations.length,
    positiveOpkResultsLast30Days: observations.filter((item) => item.opkResult === 'positive').length,
    fertileMucusObservationsLast30Days: observations.filter((item) => item.cervicalMucus === 'egg-white' || item.cervicalMucus === 'watery').length,
  };
}
