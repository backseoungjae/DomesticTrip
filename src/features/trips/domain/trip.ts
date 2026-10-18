import {
  addCalendarDays,
  differenceInCalendarDays,
  getSeoulToday,
  parseCalendarDate,
  type CalendarDate,
} from '@/shared/date/calendarDate';

import { validateTripPlaces } from './tripPlaces';
import type {
  Trip,
  TripDay,
  TripDetails,
  TripInput,
  TripPlace,
  TripStatus,
  TripUpdateResult,
  TripValidationIssue,
  TripValidationResult,
} from './types';

export function validateTripInput(
  input: TripInput,
  mode: 'create' | 'edit',
  today: CalendarDate = getSeoulToday(),
): TripValidationResult {
  const title = input.title.trim();
  const startDate = parseCalendarDate(input.startDate);
  const endDate = parseCalendarDate(input.endDate);
  const issues: TripValidationIssue[] = [];
  if (!title) issues.push({ field: 'title', code: 'required' });
  if (!startDate) issues.push({ field: 'startDate', code: 'invalid_date' });
  if (!endDate) issues.push({ field: 'endDate', code: 'invalid_date' });
  if (startDate && mode === 'create' && startDate < today) {
    issues.push({ field: 'startDate', code: 'start_before_today' });
  }
  if (startDate && endDate && endDate < startDate) {
    issues.push({ field: 'endDate', code: 'end_before_start' });
  }
  if (issues.length || !startDate || !endDate) return { ok: false, issues };
  return { ok: true, details: { title, startDate, endDate } };
}

export function getTripDayCount(trip: Pick<TripDetails, 'startDate' | 'endDate'>): number {
  const count = differenceInCalendarDays(trip.startDate, trip.endDate) + 1;
  if (count < 1) throw new RangeError('Trip end date must not precede its start date');
  return count;
}

export function getTripDayDate(trip: TripDetails, dayNumber: number): CalendarDate {
  if (!Number.isSafeInteger(dayNumber) || dayNumber < 1 || dayNumber > getTripDayCount(trip)) {
    throw new RangeError('Day number is outside the trip');
  }
  return addCalendarDays(trip.startDate, dayNumber - 1);
}

export function getTripDays(trip: TripDetails): TripDay[] {
  return Array.from({ length: getTripDayCount(trip) }, (_, index) => ({
    dayNumber: index + 1,
    date: addCalendarDays(trip.startDate, index),
  }));
}

export function getTripStatus(
  trip: TripDetails,
  today: CalendarDate = getSeoulToday(),
): TripStatus {
  getTripDayCount(trip);
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'past';
  return 'ongoing';
}

/** No mutation: callers may persist the returned trip only when ok is true. */
export function updateTrip(
  trip: Trip,
  input: TripInput,
  places: readonly TripPlace[],
): TripUpdateResult {
  const result = validateTripInput(input, 'edit');
  if (!result.ok) return { ok: false, reason: 'invalid_input', issues: result.issues };
  validateTripPlaces(trip, places);
  const nextDayCount = getTripDayCount(result.details);
  const affectedPlaces = places
    .filter((place) => place.dayNumber > nextDayCount)
    .sort((a, b) => a.dayNumber - b.dayNumber || a.position - b.position);
  if (affectedPlaces.length) return { ok: false, reason: 'occupied_days', affectedPlaces };
  return { ok: true, trip: { ...trip, ...result.details } };
}
