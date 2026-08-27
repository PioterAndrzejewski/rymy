export type TimeSignature = [number, number]; // [beatsPerBar, beatUnit]

// 'none' = the metronome-only pseudo-track (no audio file at all)
export type TrackSource = 'manifest' | 'user' | 'none';

export type Track = {
  id: string;
  name: string;
  bpm: number;
  timeSignature: TimeSignature;
  downbeatOffsetMs: number;
  introBars?: number;   // leading bars where no words are cued (song intro)
  style?: string;
  source: TrackSource;
  path?: string;        // present when source === 'manifest'
};

export type ManifestTrack = Omit<Track, 'source'>;

export type ManifestFile = { tracks: ManifestTrack[] };

export type Word = {
  text: string;
  rhymeEnding: string;
  pos?: 'noun' | 'verb' | 'adj' | 'other';
  syllables?: number;
  stress?: number;
  topics?: string[];
};

export type Subdivision = { wordsPerBar: number; barsPerWord: number };

export type BarPlan = {
  barIndex: number;
  words: Word[]; // length === wordsPerBar; empty for filler bars when barsPerWord > 1
};

export type Filter = {
  level?: number;
  rhymeEnding?: string;
  topic?: string;
  pos?: Word['pos'];
};

export type WordProvider = {
  id: string;
  getWords(opts: { count: number; seed: number; filter?: Filter }): Promise<Word[]>;
};

export type TransportSnapshot = {
  timeMs: number;
  bar: number;   // -1 before downbeat offset
  beat: number;  // -1 before downbeat offset
  barPhase: number; // 0..1 progress through current bar
};
