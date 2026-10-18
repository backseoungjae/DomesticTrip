import type { CalendarDate } from '@/shared/date/calendarDate';

/** An explicit Seoul instant is used only at the native picker/display boundary. */
export function toPickerDate(date: CalendarDate): Date {
  return new Date(`${date}T12:00:00+09:00`);
}

export function formatTripDate(date: CalendarDate, language: string): string {
  return new Intl.DateTimeFormat(language === 'ko' ? 'ko-KR' : 'en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(toPickerDate(date));
}
