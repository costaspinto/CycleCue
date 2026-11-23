import type { CyclePrediction, TrackerState } from '../types';
import { addDays, differenceInDays, isDateOnly } from './date';

const MIN_CYCLE_DAYS = 15;
const MAX_CYCLE_DAYS = 60;

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
  return sorted[middle] ?? 0;
}

export function getCycleIntervals(periodStarts: string[]): number[] {
  const sorted = [...new Set(periodStarts.filter(isDateOnly))].sort();
  const intervals: number[] = [];
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (!previous || !current) continue;
    const interval = differenceInDays(previous, current);
    if (interval >= MIN_CYCLE_DAYS && interval <= MAX_CYCLE_DAYS) intervals.push(interval);
  }
  return intervals.slice(-6);
}

export function calculateCyclePrediction(state: TrackerState): CyclePrediction {
  const intervals = getCycleIntervals(state.periodStarts);
  const averageCycleLength = intervals.length > 0
    ? Math.round(median(intervals) * 10) / 10
    : state.profile.cycleLength;
  const latestStart = [...new Set(state.periodStarts.filter(isDateOnly))].sort().at(-1) ?? null;
  const variabilityDays = intervals.length > 1
    ? Math.max(...intervals) - Math.min(...intervals)
    : null;

  let confidenceLabel: CyclePrediction['confidenceLabel'] = 'More data needed';
  if (intervals.length >= 3 && variabilityDays !== null && variabilityDays <= 7) {
    confidenceLabel = 'Pattern estimate';
  } else if (intervals.length >= 2 && variabilityDays !== null && variabilityDays > 7) {
    confidenceLabel = 'Variable pattern';
  }

  if (!latestStart) {
    return {
      averageCycleLength,
      nextPeriodDate: null,
      estimatedOvulationDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
      confidenceLabel,
      completedIntervals: intervals.length,
      variabilityDays,
    };
  }

  const nextPeriodDate = addDays(latestStart, Math.round(averageCycleLength));
  const estimatedOvulationDate = addDays(nextPeriodDate, -14);
  return {
    averageCycleLength,
    nextPeriodDate,
    estimatedOvulationDate,
    fertileWindowStart: addDays(estimatedOvulationDate, -5),
    fertileWindowEnd: addDays(estimatedOvulationDate, 1),
    confidenceLabel,
    completedIntervals: intervals.length,
    variabilityDays,
  };
}

export function getCycleDay(lastPeriodStart: string | null, today: string): number | null {
  if (!lastPeriodStart || !isDateOnly(lastPeriodStart) || !isDateOnly(today)) return null;
  const difference = differenceInDays(lastPeriodStart, today);
  return difference < 0 ? null : difference + 1;
}

export function isDateWithinRange(date: string, start: string | null, end: string | null): boolean {
  if (!isDateOnly(date) || !start || !end || !isDateOnly(start) || !isDateOnly(end)) return false;
  return date >= start && date <= end;
}
