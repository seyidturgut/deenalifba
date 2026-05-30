import * as SQLite from "expo-sqlite";

/**
 * Yerel SQLite — harf performans kayıtları ve SM-2 durumunun ilişkisel saklanması.
 * Offline-first: tüm veri cihazda. Uzak senkron YOK (PROJECT PROFILE §2, §4.B).
 *
 * MMKV hızlı KV (ayarlar, ilerleme bayrakları) için; SQLite ise sorgu/zaman
 * temelli veriler (vadesi gelen harfler, geçmiş denemeler) için kullanılır.
 */

let dbInstance: SQLite.SQLiteDatabase | null = null;

const SCHEMA = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS srs_state (
    letter_id        INTEGER PRIMARY KEY NOT NULL,
    repetitions      INTEGER NOT NULL DEFAULT 0,
    ease_factor      REAL    NOT NULL DEFAULT 2.5,
    interval_days    INTEGER NOT NULL DEFAULT 0,
    due_at           INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS attempts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    letter_id     INTEGER NOT NULL,
    step          TEXT    NOT NULL,          -- 'trace' | 'puzzle' | 'sounds' | 'recall'
    quality       INTEGER NOT NULL,          -- 0..3 kalite skoru
    created_at    INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_state(due_at);
  CREATE INDEX IF NOT EXISTS idx_attempts_letter ON attempts(letter_id);
`;

/** Veritabanını açar (idempotent) ve şemayı kurar. */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  const db = await SQLite.openDatabaseAsync("alif.db");
  await db.execAsync(SCHEMA);
  dbInstance = db;
  return db;
}
