import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { schemaSql } from './schema';

export const databaseName = 'domestictrip.db';
let connection: Promise<SQLiteDatabase> | undefined;
let pending: Promise<void> = Promise.resolve();

async function openDatabase() {
  const db = await openDatabaseAsync(databaseName, { useNewConnection: true });
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA busy_timeout = 5000;
    `);
    await db.withTransactionAsync(async () => {
      await db.execAsync(schemaSql);
    });
    return db;
  } catch (error) {
    try {
      await db.closeAsync();
    } catch {
      /* Preserve the initialization error. */
    }
    throw error;
  }
}

function getDatabase() {
  if (!connection) {
    connection = openDatabase().catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}

// The connection stays private. All reads AND writes use this queue, so an
// unrelated settings query cannot accidentally enter an itinerary transaction.
function transaction<T>(
  begin: 'BEGIN' | 'BEGIN IMMEDIATE',
  task: (db: SQLiteDatabase) => Promise<T>,
): Promise<T> {
  const operation = pending.then(async () => {
    const db = await getDatabase();
    await db.execAsync(begin);
    try {
      const result = await task(db);
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      try {
        await db.execAsync('ROLLBACK');
      } catch {
        // Do not reuse a connection whose transaction could not be rolled back.
        connection = undefined;
        try {
          await db.closeAsync();
        } catch {
          /* Preserve the original failure. */
        }
      }
      throw error;
    }
  });
  pending = operation.then(
    () => undefined,
    () => undefined,
  );
  return operation;
}

/** Do not call another repository inside the callback; use its db argument. */
export function readDatabase<T>(task: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  return transaction('BEGIN', task);
}

export function writeDatabase<T>(task: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
  return transaction('BEGIN IMMEDIATE', task);
}
