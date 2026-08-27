import type { Track, TransportSnapshot } from '@/types';

export function computeTransport(timeMs: number, track: Track): TransportSnapshot {
  const beatMs = 60000 / track.bpm;
  const [beatsPerBar] = track.timeSignature;
  const barMs = beatMs * beatsPerBar;
  const adj = timeMs - track.downbeatOffsetMs;
  if (adj < 0 || barMs <= 0) return { timeMs, bar: -1, beat: -1, barPhase: 0 };
  const bar = Math.floor(adj / barMs);
  const posInBar = adj - bar * barMs;
  const beat = Math.floor(posInBar / beatMs);
  return { timeMs, bar, beat, barPhase: posInBar / barMs };
}
