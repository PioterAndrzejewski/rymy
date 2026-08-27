import type { TrackSource } from '@/types';

const KEY = 'rymy.trackOverrides.v1';

export type TrackOverride = { downbeatOffsetMs?: number; bpm?: number; introBars?: number };
type All = Record<string, TrackOverride>;

/**
 * Where a track's tweaks live.
 * - `persist`  — user uploads (IndexedDB): saved to localStorage, survive a refresh.
 * - `session`  — tracks declared in code (public/tracks/tracks.json): kept in memory
 *   only, so reloading the app always restores exactly what the file says.
 */
export type OverrideScope = 'persist' | 'session';

export function scopeFor(source: TrackSource): OverrideScope {
  return source === 'manifest' ? 'session' : 'persist';
}

const sessionOverrides = new Map<string, TrackOverride>();

function readAll(): All {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}'); } catch { return {}; }
}
function writeAll(all: All) { localStorage.setItem(KEY, JSON.stringify(all)); }

export function getOverride(id: string, scope: OverrideScope = 'persist'): TrackOverride | undefined {
  return scope === 'session' ? sessionOverrides.get(id) : readAll()[id];
}

export function patchOverride(id: string, patch: TrackOverride, scope: OverrideScope = 'persist'): void {
  if (scope === 'session') {
    sessionOverrides.set(id, { ...sessionOverrides.get(id), ...patch });
    return;
  }
  const all = readAll();
  all[id] = { ...all[id], ...patch };
  writeAll(all);
}

export function clearOverride(id: string, scope: OverrideScope = 'persist'): void {
  if (scope === 'session') {
    sessionOverrides.delete(id);
    return;
  }
  const all = readAll();
  delete all[id];
  writeAll(all);
}
