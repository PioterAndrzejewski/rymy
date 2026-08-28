/** Ustawienia rundy „Pałac mentalny". */

export type PalaceLevel = {
  level: number;
  /** ile słów trzeba zapamiętać */
  words: number;
  /** ile zadań z rymami wchodzi między zapamiętywanie a odtwarzanie */
  distractions: number;
  label: string;
};

/**
 * Sześć poziomów: od dwóch słów (żeby w ogóle poczuć mechanizm) do szesnastu
 * (tyle punktów ma już cała zwrotka). Liczba rozpraszaczy = numer poziomu —
 * im więcej pamiętasz, tym dłużej musi to przetrwać.
 */
export const PALACE_LEVELS: PalaceLevel[] = [
  { level: 1, words: 2, distractions: 1, label: 'Przedpokój' },
  { level: 2, words: 4, distractions: 2, label: 'Małe mieszkanie' },
  { level: 3, words: 6, distractions: 3, label: 'Pełne mieszkanie' },
  { level: 4, words: 9, distractions: 4, label: 'Dom z piętrem' },
  { level: 5, words: 12, distractions: 5, label: 'Kamienica' },
  { level: 6, words: 16, distractions: 6, label: 'Pałac' },
];

export const LEVEL_NUMBERS = PALACE_LEVELS.map((l) => l.level);

export function levelDef(level: number): PalaceLevel {
  return PALACE_LEVELS.find((l) => l.level === level) ?? PALACE_LEVELS[0];
}

/** Ile sekund stoisz w pokoju ze słowem. */
export const PACE_CHOICES = [2, 3, 5] as const;
export type Pace = (typeof PACE_CHOICES)[number];

export function paceLabel(p: number): string {
  return p <= 2 ? 'szybko' : p <= 3 ? 'normalnie' : 'spokojnie';
}

export type PalaceConfig = {
  level: number;
  /** sekundy na słowo w fazie zapamiętywania */
  pace: Pace;
  /** spacer 3D zamiast kartek */
  walk3d: boolean;
  /** odtwarzanie z mikrofonu */
  voice: boolean;
  /** kategoria słów, '' = mieszane */
  category: string;
};

export const defaultPalaceConfig: PalaceConfig = {
  level: 1,
  pace: 3,
  walk3d: true,
  voice: false,
  category: '',
};

/** Ile czasu ma jedno zadanie-rozpraszacz (ms). */
export const DISTRACTION_MS = 20_000;

/** Przejście między pokojami — krótkie, żeby nie nudziło. */
export const WALK_MS = 650;

export function wordCountLabel(n: number): string {
  return n === 1 ? 'słowo' : n < 5 ? 'słowa' : 'słów';
}

export function taskCountLabel(n: number): string {
  return n === 1 ? 'zadanie' : n < 5 ? 'zadania' : 'zadań';
}

/** Łączny czas fazy zapamiętywania — do pokazania w kreatorze. */
export function memorizeSeconds(c: PalaceConfig): number {
  const n = levelDef(c.level).words;
  const walk = c.walk3d ? (WALK_MS / 1000) * n : 0;
  return Math.round(n * c.pace + walk);
}
