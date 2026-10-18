import { readDatabase, writeDatabase } from './client';

export async function readSetting(key: string): Promise<string | null> {
  return readDatabase(async (db) => {
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM app_settings WHERE key = ?',
      key,
    );
    return row?.value ?? null;
  });
}

export async function writeSetting(key: string, value: string): Promise<void> {
  await writeDatabase(async (db) => {
    await db.runAsync(
      'INSERT INTO app_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      key,
      value,
    );
  });
}
