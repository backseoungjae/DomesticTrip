declare const calendarDateBrand: unique symbol;

/** A validated Gregorian calendar date, without a time or time zone. */
export type CalendarDate = string & { readonly [calendarDateBrand]: true };

const seoulFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function parseCalendarDate(value: string): CalendarDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    return null;
  }
  return value as CalendarDate;
}

export function calendarDate(value: string): CalendarDate {
  const parsed = parseCalendarDate(value);
  if (!parsed) throw new RangeError('Expected a valid YYYY-MM-DD calendar date');
  return parsed;
}

function daysBeforeYear(year: number): number {
  const previous = year - 1;
  return (
    365 * previous +
    Math.floor(previous / 4) -
    Math.floor(previous / 100) +
    Math.floor(previous / 400)
  );
}

function ordinal(date: CalendarDate): number {
  const [year, month, day] = date.split('-').map(Number);
  let days = daysBeforeYear(year) + day - 1;
  for (let current = 1; current < month; current++) days += daysInMonth(year, current);
  return days;
}

/** Returns end - start in calendar days. No Date parsing or UTC conversion. */
export function differenceInCalendarDays(start: CalendarDate, end: CalendarDate): number {
  return ordinal(end) - ordinal(start);
}

export function addCalendarDays(date: CalendarDate, amount: number): CalendarDate {
  if (!Number.isSafeInteger(amount)) throw new RangeError('Day offset must be an integer');
  const target = ordinal(date) + amount;
  if (target < 0 || target >= daysBeforeYear(10000)) {
    throw new RangeError('Calendar date must be between 0001-01-01 and 9999-12-31');
  }
  let low = 1;
  let high = 9999;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (daysBeforeYear(middle) <= target) low = middle;
    else high = middle - 1;
  }
  const year = low;
  let remaining = target - daysBeforeYear(year);
  let month = 1;
  while (remaining >= daysInMonth(year, month)) {
    remaining -= daysInMonth(year, month);
    month++;
  }
  return calendarDate(
    `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(remaining + 1).padStart(2, '0')}`,
  );
}

/** The only conversion from an instant to a calendar date happens here. */
export function getSeoulToday(now: Date = new Date()): CalendarDate {
  if (!Number.isFinite(now.getTime())) throw new RangeError('Invalid current time');
  const parts = seoulFormatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return calendarDate(`${part('year')?.padStart(4, '0')}-${part('month')}-${part('day')}`);
}
