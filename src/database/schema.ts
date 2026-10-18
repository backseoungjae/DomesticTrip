// Only the current tables. CREATE IF NOT EXISTS preserves Phase 1 language settings.
export const schemaSql = `
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    title TEXT NOT NULL CHECK(length(trim(title)) > 0),
    start_date TEXT NOT NULL CHECK(start_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    end_date TEXT NOT NULL CHECK(end_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' AND end_date >= start_date),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS trips_start_date_id ON trips(start_date, id);
  CREATE TABLE IF NOT EXISTS trip_places (
    id TEXT PRIMARY KEY NOT NULL CHECK(length(trim(id)) > 0),
    trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL CHECK(typeof(day_number) = 'integer' AND day_number >= 1),
    position INTEGER NOT NULL CHECK(typeof(position) = 'integer' AND position >= 1),
    source_language TEXT NOT NULL CHECK(source_language IN ('ko', 'en')),
    content_id TEXT NOT NULL CHECK(length(trim(content_id)) > 0),
    title TEXT NOT NULL CHECK(length(trim(title)) > 0),
    address TEXT,
    image_url TEXT,
    latitude REAL CHECK(latitude IS NULL OR latitude BETWEEN -90 AND 90),
    longitude REAL CHECK(longitude IS NULL OR longitude BETWEEN -180 AND 180),
    copyright TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(trip_id, day_number, position)
  );
`;
