export function fmtTime(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

/** Human duration for a bar count at a given tempo, e.g. "1:04". */
export function barsToTime(bars: number, bpm: number, beatsPerBar: number): string {
  if (bpm <= 0) return '—';
  return fmtTime((bars * beatsPerBar * 60000) / bpm);
}

/** BPM is stored as a float (backing tracks are rarely exactly on the grid). */
export function roundBpm(bpm: number): number {
  return Math.round(bpm * 10) / 10;
}

/** "70" for whole tempi, "69.7" otherwise. */
export function fmtBpm(bpm: number | undefined | null): string {
  if (bpm == null || !isFinite(bpm)) return '—';
  const r = roundBpm(bpm);
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}
