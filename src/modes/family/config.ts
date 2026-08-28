/** How a round is structured once you're rhyming. */
export type SessionMode =
  | 'single' // one word for the whole round
  | 'quota'  // N rhymes, then the next word
  | 'timed'; // a new word every X seconds

export type FamilyConfig = {
  /**
   * 'random' = drawn when the exercise starts (and again for every new word)
   * 'plan'   = drawn by the programme — your weakest family (see review.ts)
   * 'basic'  = seed drawn from BASIC_SONG_WORDS — emotional words from songs
   */
  ending: string | 'random' | 'plan' | 'basic';
  /** round length in seconds */
  seconds: number;
  /** 0 = metronome off */
  bpm: number;
  sessionMode: SessionMode;
  /** rhymes required per word in 'quota' mode */
  quota: number;
  /** seconds per word in 'timed' mode */
  wordSeconds: number;
  /** zacznij rundę z włączonym mikrofonem (da się przełączyć w trakcie) */
  voice: boolean;
};

/** Końcówka nie jest wybrana ręcznie — dobiera ją losowanie albo program. */
export function isAutoEnding(e: FamilyConfig['ending']): e is 'random' | 'plan' | 'basic' {
  return e === 'random' || e === 'plan' || e === 'basic';
}

export const defaultFamilyConfig: FamilyConfig = {
  ending: 'plan',
  seconds: 30,
  bpm: 0,
  sessionMode: 'single',
  quota: 3,
  wordSeconds: 30,
  voice: false,
};

export const DURATIONS = [10, 20, 30, 60, 120];
export const QUOTA_CHOICES = [1, 2, 3, 5];
export const WORD_SECONDS_CHOICES = [2, 3, 5, 10];

export function fmtDuration(seconds: number): string {
  return seconds >= 60 && seconds % 60 === 0
    ? `${seconds / 60} min`
    : `${seconds} s`;
}

export function rhymeWord(n: number): string {
  return n === 1 ? 'rym' : n < 5 ? 'rymy' : 'rymów';
}

export function sessionModeLabel(c: FamilyConfig): string {
  switch (c.sessionMode) {
    case 'quota': return `${c.quota} ${rhymeWord(c.quota)} na słowo`;
    case 'timed': return `słowo co ${c.wordSeconds} s`;
    default: return 'jedno słowo';
  }
}

/** Multi-word rounds need room to breathe — nudge very short rounds up. */
export function minSecondsFor(mode: SessionMode, seconds: number): number {
  return mode === 'single' ? seconds : Math.max(seconds, 60);
}
