import type { Track } from '@/types';
import { getOverride } from '@/storage/trackOverrides';

export const CLICK_TRACK_ID = 'no-track';

export function isClickOnly(track: Track | null | undefined): boolean {
  return track?.source === 'none';
}

/** The metronome-only pseudo-track. Its tempo/intro persist like a user track. */
export function makeClickTrack(): Track {
  const ov = getOverride(CLICK_TRACK_ID, 'persist');
  return {
    id: CLICK_TRACK_ID,
    name: 'Bez podkładu — sam metronom',
    bpm: ov?.bpm ?? 90,
    timeSignature: [4, 4],
    downbeatOffsetMs: 0,
    introBars: ov?.introBars ?? 0,
    source: 'none',
  };
}
