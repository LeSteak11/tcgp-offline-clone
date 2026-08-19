import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'pocket-clone';
const STORE = 'kv';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE);
      },
    });
  }
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  return (await getDb()).get(STORE, key);
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  await (await getDb()).put(STORE, value, key);
}

export async function kvClear(): Promise<void> {
  await (await getDb()).clear(STORE);
}
