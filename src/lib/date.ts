const DAY_MS = 24 * 60 * 60 * 1000;

export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && toDateKey(date) === value;
}

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string): Date {
  if (!isDateOnly(value)) throw new Error('Invalid date. Use YYYY-MM-DD.');
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function addDays(dateKey: string, days: number): string {
  if (!Number.isInteger(days)) throw new Error('Days must be a whole number.');
  const date = parseDateOnly(dateKey);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function differenceInDays(fromKey: string, toKey: string): number {
  const from = parseDateOnly(fromKey);
  const to = parseDateOnly(toKey);
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) -
    Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / DAY_MS);
}

export function formatDate(dateKey: string, options?: Intl.DateTimeFormatOptions): string {
  const date = parseDateOnly(dateKey);
  return new Intl.DateTimeFormat(undefined, options ?? {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(date);
}

export function getMonthGrid(year: number, monthIndex: number): Array<string | null> {
  const first = new Date(year, monthIndex, 1, 12);
  const daysInMonth = new Date(year, monthIndex + 1, 0, 12).getDate();
  const mondayFirstOffset = (first.getDay() + 6) % 7;
  const cells: Array<string | null> = Array.from({ length: mondayFirstOffset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateKey(new Date(year, monthIndex, day, 12)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function startOfCurrentDay(): string {
  return toDateKey(new Date());
}
