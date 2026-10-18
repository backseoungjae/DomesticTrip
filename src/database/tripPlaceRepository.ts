import type { SQLiteDatabase } from 'expo-sqlite';

import type { TourPlace } from '@/features/places/domain/TourPlace';
import {
  addTripPlace,
  moveTripPlace,
  removeTripPlace,
  validateTripPlaces,
} from '@/features/trips/domain/tripPlaces';
import type { Trip, TripPlace } from '@/features/trips/domain/types';

import { readDatabase, writeDatabase } from './client';
import { readTripPlaces, requireTrip, type StoredTripPlace } from './records';

function validateSnapshot(snapshot: TourPlace): void {
  if (
    !snapshot.contentId.trim() ||
    !snapshot.title.trim() ||
    !['ko', 'en'].includes(snapshot.sourceLanguage)
  ) {
    throw new RangeError('Place needs its original language, content ID and title');
  }
  for (const value of [snapshot.address, snapshot.imageUrl, snapshot.copyright]) {
    if (value != null && typeof value !== 'string') throw new RangeError('Invalid snapshot text');
  }
  for (const [value, limit] of [
    [snapshot.latitude, 90],
    [snapshot.longitude, 180],
  ] as const) {
    if (value != null && (!Number.isFinite(value) || Math.abs(value) > limit)) {
      throw new RangeError('Invalid place coordinates');
    }
  }
}

async function insertPlace(db: SQLiteDatabase, entry: TripPlace, createdAt: string): Promise<void> {
  const snapshot = entry.placeSnapshot;
  await db.runAsync(
    `INSERT INTO trip_places (
      id, trip_id, day_number, position, source_language, content_id, title,
      address, image_url, latitude, longitude, copyright, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    entry.id,
    entry.tripId,
    entry.dayNumber,
    entry.position,
    snapshot.sourceLanguage,
    snapshot.contentId,
    snapshot.title,
    snapshot.address,
    snapshot.imageUrl,
    snapshot.latitude ?? null,
    snapshot.longitude ?? null,
    snapshot.copyright ?? null,
    createdAt,
  );
}

/** Call only inside writeDatabase. Snapshots and created_at of retained rows stay intact. */
async function persistPlaces(
  db: SQLiteDatabase,
  trip: Trip,
  before: readonly TripPlace[],
  after: readonly TripPlace[],
): Promise<StoredTripPlace[]> {
  validateTripPlaces(trip, after);
  const previousIds = new Set(before.map((entry) => entry.id));
  const nextIds = new Set(after.map((entry) => entry.id));
  const now = new Date().toISOString();

  // Positive temporary positions above both ranges prevent UNIQUE collisions
  // during swaps. No intermediate order can escape this transaction.
  let maximum = 0;
  for (const entry of [...before, ...after]) maximum = Math.max(maximum, entry.position);
  const offset = maximum + 1;
  if (!Number.isSafeInteger(maximum + offset)) throw new RangeError('Position exceeds safe range');

  for (const entry of before) {
    if (!nextIds.has(entry.id)) {
      await db.runAsync('DELETE FROM trip_places WHERE trip_id = ? AND id = ?', trip.id, entry.id);
    }
  }
  await db.runAsync(
    'UPDATE trip_places SET position = position + ? WHERE trip_id = ?',
    offset,
    trip.id,
  );
  for (const entry of after) {
    if (previousIds.has(entry.id)) {
      await db.runAsync(
        'UPDATE trip_places SET day_number = ?, position = ? WHERE trip_id = ? AND id = ?',
        entry.dayNumber,
        entry.position,
        trip.id,
        entry.id,
      );
    } else {
      await insertPlace(db, entry, now);
    }
  }
  await db.runAsync('UPDATE trips SET updated_at = ? WHERE id = ?', now, trip.id);
  return readTripPlaces(db, trip);
}

export const tripPlaceRepository = {
  list(tripId: string): Promise<StoredTripPlace[]> {
    return readDatabase(async (db) => readTripPlaces(db, await requireTrip(db, tripId)));
  },

  /** Append at the end of the selected Day; repeated tourism content is allowed. */
  add(
    tripId: string,
    id: string,
    dayNumber: number,
    snapshot: TourPlace,
  ): Promise<StoredTripPlace[]> {
    // Copy before waiting in the queue, so later changes to an API result cannot
    // change the snapshot that the user chose to save.
    const placeSnapshot = { ...snapshot };
    return writeDatabase(async (db) => {
      if (!id.trim()) throw new RangeError('Itinerary entry ID is required');
      validateSnapshot(placeSnapshot);
      const trip = await requireTrip(db, tripId);
      const before = await readTripPlaces(db, trip);
      const after = addTripPlace(trip, before, { id, tripId, dayNumber, placeSnapshot });
      return persistPlaces(db, trip, before, after);
    });
  },

  remove(tripId: string, id: string): Promise<StoredTripPlace[]> {
    return writeDatabase(async (db) => {
      const trip = await requireTrip(db, tripId);
      const before = await readTripPlaces(db, trip);
      return persistPlaces(db, trip, before, removeTripPlace(trip, before, id));
    });
  },

  /** Also reorders within the same Day. Position is the final 1-based position. */
  move(
    tripId: string,
    id: string,
    dayNumber: number,
    position?: number,
  ): Promise<StoredTripPlace[]> {
    return writeDatabase(async (db) => {
      const trip = await requireTrip(db, tripId);
      const before = await readTripPlaces(db, trip);
      return persistPlaces(db, trip, before, moveTripPlace(trip, before, id, dayNumber, position));
    });
  },
};
