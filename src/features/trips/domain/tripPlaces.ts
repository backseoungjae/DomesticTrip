import { differenceInCalendarDays } from '@/shared/date/calendarDate';

import type { Trip, TripPlace } from './types';

function assertDayNumber(trip: Trip, dayNumber: number): void {
  const count = differenceInCalendarDays(trip.startDate, trip.endDate) + 1;
  if (count < 1 || !Number.isSafeInteger(dayNumber) || dayNumber < 1 || dayNumber > count) {
    throw new RangeError('Day number is outside the trip');
  }
}

/** Reject inconsistent entries rather than silently placing or dropping them. */
export function validateTripPlaces(trip: Trip, places: readonly TripPlace[]): void {
  assertDayNumber(trip, 1);
  const ids = new Set<string>();
  const positions = new Set<string>();
  for (const place of places) {
    assertDayNumber(trip, place.dayNumber);
    if (place.tripId !== trip.id) throw new Error('Place belongs to another trip');
    if (!Number.isSafeInteger(place.position) || place.position < 1) {
      throw new RangeError('Position must be a positive integer');
    }
    const key = `${place.dayNumber}:${place.position}`;
    if (ids.has(place.id) || positions.has(key)) throw new Error('Duplicate entry or position');
    ids.add(place.id);
    positions.add(key);
  }
}

function normalizePositions(places: readonly TripPlace[]): TripPlace[] {
  const sorted = [...places].sort((a, b) => a.dayNumber - b.dayNumber || a.position - b.position);
  let day = 0;
  let position = 0;
  return sorted.map((place) => {
    if (day !== place.dayNumber) {
      day = place.dayNumber;
      position = 0;
    }
    return { ...place, position: ++position };
  });
}

export function getDayPlaces(
  trip: Trip,
  places: readonly TripPlace[],
  dayNumber: number,
): TripPlace[] {
  validateTripPlaces(trip, places);
  assertDayNumber(trip, dayNumber);
  return normalizePositions(places).filter((place) => place.dayNumber === dayNumber);
}

export function addTripPlace(
  trip: Trip,
  places: readonly TripPlace[],
  entry: Omit<TripPlace, 'position'>,
): TripPlace[] {
  validateTripPlaces(trip, places);
  assertDayNumber(trip, entry.dayNumber);
  if (entry.tripId !== trip.id || places.some((place) => place.id === entry.id)) {
    throw new Error('Entry must have a unique ID and belong to this trip');
  }
  const normalized = normalizePositions(places);
  const position = normalized.filter((place) => place.dayNumber === entry.dayNumber).length + 1;
  return normalizePositions([
    ...normalized,
    { ...entry, position, placeSnapshot: { ...entry.placeSnapshot } },
  ]);
}

/** targetPosition refers to the final destination list, starting at 1. */
export function moveTripPlace(
  trip: Trip,
  places: readonly TripPlace[],
  entryId: string,
  targetDayNumber: number,
  targetPosition?: number,
): TripPlace[] {
  validateTripPlaces(trip, places);
  assertDayNumber(trip, targetDayNumber);
  const entry = places.find((place) => place.id === entryId);
  if (!entry) throw new Error('Itinerary entry not found');
  const remaining = normalizePositions(places.filter((place) => place.id !== entryId));
  const destination = remaining.filter((place) => place.dayNumber === targetDayNumber);
  const position = targetPosition ?? destination.length + 1;
  if (!Number.isSafeInteger(position) || position < 1 || position > destination.length + 1) {
    throw new RangeError('Target position is outside the destination Day');
  }
  destination.splice(position - 1, 0, { ...entry, dayNumber: targetDayNumber });
  return normalizePositions([
    ...remaining.filter((place) => place.dayNumber !== targetDayNumber),
    ...destination.map((place, index) => ({ ...place, position: index + 1 })),
  ]);
}

export function removeTripPlace(
  trip: Trip,
  places: readonly TripPlace[],
  entryId: string,
): TripPlace[] {
  validateTripPlaces(trip, places);
  if (!places.some((place) => place.id === entryId)) throw new Error('Itinerary entry not found');
  return normalizePositions(places.filter((place) => place.id !== entryId));
}
