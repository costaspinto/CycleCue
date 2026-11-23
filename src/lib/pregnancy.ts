import { addDays, differenceInDays, isDateOnly } from './date';

export type PregnancyDatingMethod = 'lmp' | 'conception' | 'ivf-transfer';
export interface PregnancyEstimate {
  dueDate: string;
  gestationalDays: number;
  weeks: number;
  days: number;
  trimester: 1 | 2 | 3;
  daysUntilDue: number;
  datingMethod: PregnancyDatingMethod;
  isPastDue: boolean;
}

export function calculateEstimatedDueDate(input: {
  method: PregnancyDatingMethod;
  date: string;
  cycleLength?: number;
  embryoAgeDays?: 3 | 5;
}): string {
  if (!isDateOnly(input.date)) throw new Error('Enter a valid date.');
  if (input.method === 'lmp') {
    const cycleLength = input.cycleLength ?? 28;
    if (!Number.isInteger(cycleLength) || cycleLength < 15 || cycleLength > 60) throw new Error('Cycle length must be between 15 and 60 days.');
    return addDays(input.date, 280 + (cycleLength - 28));
  }
  if (input.method === 'conception') return addDays(input.date, 266);
  const embryoAge = input.embryoAgeDays ?? 5;
  if (embryoAge !== 3 && embryoAge !== 5) throw new Error('Embryo age must be 3 or 5 days.');
  // IVF due date = transfer date + (266 - embryo age at transfer).
  return addDays(input.date, 266 - embryoAge);
}

export function getPregnancyEstimate(input: {
  method: PregnancyDatingMethod;
  date: string;
  today: string;
  cycleLength?: number;
  embryoAgeDays?: 3 | 5;
}): PregnancyEstimate {
  if (!isDateOnly(input.today)) throw new Error('Current date is invalid.');
  if (!isDateOnly(input.date) || input.date > input.today) throw new Error('The pregnancy dating reference must be today or earlier.');
  const dueDate = calculateEstimatedDueDate(input);
  const gestationalDays = input.method === 'lmp'
    ? differenceInDays(input.date, input.today)
    : differenceInDays(addDays(input.date, input.method === 'conception' ? -14 : -(14 + (input.embryoAgeDays ?? 5))), input.today);
  const safeGestationalDays = Math.max(0, gestationalDays);
  const weeks = Math.floor(safeGestationalDays / 7);
  const days = safeGestationalDays % 7;
  const trimester: 1 | 2 | 3 = weeks < 14 ? 1 : weeks < 28 ? 2 : 3;
  return {
    dueDate,
    gestationalDays: safeGestationalDays,
    weeks,
    days,
    trimester,
    daysUntilDue: differenceInDays(input.today, dueDate),
    datingMethod: input.method,
    isPastDue: input.today > dueDate,
  };
}
