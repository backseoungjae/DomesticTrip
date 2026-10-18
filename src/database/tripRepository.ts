import { updateTrip, validateTripInput } from '@/features/trips/domain/trip';
import type {
  TripInput,
  TripUpdateResult,
  TripValidationResult,
} from '@/features/trips/domain/types';

import { readDatabase, writeDatabase } from './client';
import {
  findTrip,
  mapTrip,
  readTripPlaces,
  requireTrip,
  type StoredTrip,
  type StoredTripPlace,
  type TripRow,
} from './records';

type CreateResult =
  { readonly ok: true; readonly trip: StoredTrip } | Extract<TripValidationResult, { ok: false }>;
type UpdateResult =
  { readonly ok: true; readonly trip: StoredTrip } | Extract<TripUpdateResult, { ok: false }>;

export const tripRepository = {
  list(): Promise<StoredTrip[]> {
    return readDatabase(async (db) => {
      const rows = await db.getAllAsync<TripRow>('SELECT * FROM trips ORDER BY start_date, id');
      return rows.map(mapTrip);
    });
  },

  get(id: string): Promise<StoredTrip | null> {
    return readDatabase((db) => findTrip(db, id));
  },

  getWithPlaces(id: string): Promise<{ trip: StoredTrip; places: StoredTripPlace[] } | null> {
    return readDatabase(async (db) => {
      const trip = await findTrip(db, id);
      return trip ? { trip, places: await readTripPlaces(db, trip) } : null;
    });
  },

  /** IDs are supplied by the caller; an existing ID never overwrites a trip. */
  create(id: string, input: TripInput): Promise<CreateResult> {
    const draft = { ...input };
    return writeDatabase(async (db) => {
      if (!id.trim()) throw new RangeError('Trip ID is required');
      const result = validateTripInput(draft, 'create');
      if (!result.ok) return result;
      const now = new Date().toISOString();
      const { title, startDate, endDate } = result.details;
      await db.runAsync(
        'INSERT INTO trips (id, title, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        title,
        startDate,
        endDate,
        now,
        now,
      );
      return { ok: true, trip: { id, ...result.details, createdAt: now, updatedAt: now } };
    });
  },

  update(id: string, input: TripInput): Promise<UpdateResult> {
    const draft = { ...input };
    return writeDatabase(async (db) => {
      const existing = await requireTrip(db, id);
      const places = await readTripPlaces(db, existing);
      const result = updateTrip(existing, draft, places);
      if (!result.ok) return result;
      const now = new Date().toISOString();
      await db.runAsync(
        'UPDATE trips SET title = ?, start_date = ?, end_date = ?, updated_at = ? WHERE id = ?',
        result.trip.title,
        result.trip.startDate,
        result.trip.endDate,
        now,
        id,
      );
      return { ok: true, trip: { ...result.trip, createdAt: existing.createdAt, updatedAt: now } };
    });
  },

  /** FK ON DELETE CASCADE removes its places in the same transaction. */
  remove(id: string): Promise<void> {
    return writeDatabase(async (db) => {
      await requireTrip(db, id);
      await db.runAsync('DELETE FROM trips WHERE id = ?', id);
    });
  },
};
