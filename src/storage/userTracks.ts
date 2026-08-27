import { openDB, type IDBPDatabase } from 'idb';
import type { TimeSignature } from '@/types';

const DB_NAME = 'rymy';
const STORE = 'userTracks';
const VERSION = 1;

export type UserTrackRecord = {
  id: string;
  name: string;
  bpm: number;
  timeSignature: TimeSignature;
  downbeatOffsetMs: number;
  introBars?: number;
  style?: string;
  blob: Blob;
  mime: string;
  createdAt: number;
};

let dbPromise: Promise<IDBPDatabase> | null = null;
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains(STORE)) {
          d.createObjectStore(STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function addUserTrack(rec: UserTrackRecord): Promise<void> {
  const d = await db();
  await d.put(STORE, rec);
}

export async function listUserTracks(): Promise<UserTrackRecord[]> {
  const d = await db();
  return d.getAll(STORE);
}

export async function getUserTrack(id: string): Promise<UserTrackRecord | undefined> {
  const d = await db();
  return d.get(STORE, id);
}

export async function deleteUserTrack(id: string): Promise<void> {
  const d = await db();
  await d.delete(STORE, id);
}
