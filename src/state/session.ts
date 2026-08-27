import { create } from 'zustand';
import type { Track } from '@/types';

type SessionState = {
  track: Track | null;
  setTrack: (t: Track | null) => void;
  updateTrack: (patch: Partial<Track>) => void;
};

export const useSession = create<SessionState>((set) => ({
  track: null,
  setTrack: (t) => set({ track: t }),
  updateTrack: (patch) =>
    set((s) => (s.track ? { track: { ...s.track, ...patch } } : s)),
}));
