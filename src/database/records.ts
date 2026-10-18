import type { SQLiteDatabase } from 'expo-sqlite';

import { validateTripPlaces } from '@/features/trips/domain/tripPlaces';
import type { Trip, TripPlace } from '@/features/trips/domain/types';
import { calendarDate } from '@/shared/date/calendarDate';

export interface StoredTrip extends Trip {
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface StoredTripPlace extends TripPlace {
  readonly createdAt: string;
}

export class RecordNotFoundError extends Error {
  constructor(entity: 'trip' | 'trip_place') {
    super(`${entity} not found`);
    this.name = 'RecordNotFoundError';
  }
}

export interface TripRow {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
}

interface TripPlaceRow {
  id: string;
  trip_id: string;
  day_number: number;
  position: number;
  source_language: 'ko' | 'en';
  content_id: string;
  title: string;
  address: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  copyright: string | null;
  created_at: string;
}

export function mapTrip(row: TripRow): StoredTrip {
  const startDate = calendarDate(row.start_date);
  const endDate = calendarDate(row.end_date);
  if (endDate < startDate || !row.title.trim()) throw new Error('Invalid stored trip');
  return {
    id: row.id,
    title: row.title,
    startDate,
    endDate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findTrip(db: SQLiteDatabase, id: string): Promise<StoredTrip | null> {
  const row = await db.getFirstAsync<TripRow>('SELECT * FROM trips WHERE id = ?', id);
  return row ? mapTrip(row) : null;
}

export async function requireTrip(db: SQLiteDatabase, id: string): Promise<StoredTrip> {
  const trip = await findTrip(db, id);
  if (!trip) throw new RecordNotFoundError('trip');
  return trip;
}

export async function readTripPlaces(db: SQLiteDatabase, trip: Trip): Promise<StoredTripPlace[]> {
  const rows = await db.getAllAsync<TripPlaceRow>(
    'SELECT * FROM trip_places WHERE trip_id = ? ORDER BY day_number, position',
    trip.id,
  );
  const places = rows.map((row): StoredTripPlace => ({
    id: row.id,
    tripId: row.trip_id,
    dayNumber: row.day_number,
    position: row.position,
    placeSnapshot: {
      sourceLanguage: row.source_language,
      contentId: row.content_id,
      title: row.title,
      address: row.address,
      imageUrl: row.image_url,
      latitude: row.latitude,
      longitude: row.longitude,
      copyright: row.copyright,
    },
    createdAt: row.created_at,
  }));
  validateTripPlaces(trip, places);
  return places;
}
