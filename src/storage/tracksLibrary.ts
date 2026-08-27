import type { ManifestFile, Track } from '@/types';
import { clearOverride, getOverride, scopeFor } from './trackOverrides';
import { getUserTrack, listUserTracks } from './userTracks';

/** Manifest paths are written root-relative; the deploy may live in a subfolder. */
export function publicUrl(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
}

export async function loadLibrary(): Promise<Track[]> {
  const manifest = await fetch(publicUrl('tracks/tracks.json'))
    .then((r) => (r.ok ? (r.json() as Promise<ManifestFile>) : { tracks: [] }))
    .catch(() => ({ tracks: [] as ManifestFile['tracks'] }));

  const manifestTracks: Track[] = (manifest.tracks ?? []).map((t) => ({
    ...t,
    source: 'manifest' as const,
  }));

  const userRecords = await listUserTracks();
  const userTracks: Track[] = userRecords.map((r) => ({
    id: r.id,
    name: r.name,
    bpm: r.bpm,
    timeSignature: r.timeSignature,
    downbeatOffsetMs: r.downbeatOffsetMs,
    introBars: r.introBars,
    style: r.style,
    source: 'user',
  }));

  // manifest wins on id collision
  const byId = new Map<string, Track>();
  for (const t of userTracks) byId.set(t.id, t);
  for (const t of manifestTracks) byId.set(t.id, t);

  return [...byId.values()].map((t) => {
    const scope = scopeFor(t.source);
    // Manifest tracks must never carry persisted tweaks — drop anything an
    // older build (or a track promoted from an upload) left behind.
    if (scope === 'session' && getOverride(t.id, 'persist')) clearOverride(t.id, 'persist');
    const ov = getOverride(t.id, scope);
    return {
      ...t,
      downbeatOffsetMs: ov?.downbeatOffsetMs ?? t.downbeatOffsetMs,
      bpm: ov?.bpm ?? t.bpm,
      introBars: ov?.introBars ?? t.introBars ?? 0,
    };
  });
}

export async function resolveTrackSrc(t: Track): Promise<string> {
  if (t.source === 'manifest') {
    if (!t.path) throw new Error(`manifest track ${t.id} missing path`);
    return publicUrl(t.path);
  }
  const rec = await getUserTrack(t.id);
  if (!rec) throw new Error(`user track ${t.id} not found in IndexedDB`);
  return URL.createObjectURL(rec.blob);
}
