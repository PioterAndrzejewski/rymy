import { create } from 'zustand';
import type { Track } from '@/types';
import { loadLibrary } from '@/storage/tracksLibrary';

type LibraryState = {
  tracks: Track[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export const useLibrary = create<LibraryState>((set) => ({
  tracks: [],
  loading: false,
  error: null,
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const tracks = await loadLibrary();
      set({ tracks, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
}));
