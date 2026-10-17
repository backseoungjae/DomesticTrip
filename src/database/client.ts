import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

// Phase 3 adds trip tables to this database; it must preserve app_settings.
export const databaseName = 'domestictrip.db';
let connection: Promise<SQLiteDatabase> | undefined;

async function openDatabase() {
  const db = await openDatabaseAsync(databaseName);
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

export function getDatabase() {
  if (!connection) {
    connection = openDatabase().catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}
