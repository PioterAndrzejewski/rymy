export type FamilyConfig = {
  level: number;
  /** 'random' = drawn when the exercise starts */
  ending: string | 'random';
  /** round length in seconds */
  seconds: number;
  /** 0 = metronome off */
  bpm: number;
};

export const defaultFamilyConfig: FamilyConfig = {
  level: 2,
  ending: 'random',
  seconds: 30,
  bpm: 0,
};

export const DURATIONS = [10, 20, 30, 60];

export function fmtDuration(seconds: number): string {
  return seconds >= 60 && seconds % 60 === 0
    ? `${seconds / 60} min`
    : `${seconds} s`;
}
