/** Ustawienia rundy „Łańcuch skojarzeń". */

import type { RhymeQuality } from '@/wordbank/pl/phonetics';

export type ChainLevel = {
  level: number;
  label: string;
  /** ile ogniw domyka rundę */
  links: number;
  /** ile sekund ma jedno ogniwo (skojarzenie + rym razem) */
  seconds: number;
  /**
   * Poziomy różnią się tylko długością łańcucha i czasem — te trzy pola
   * zostają jednakowe dla wszystkich, żeby wybór poziomu był prosty.
   */
  /** minimalna jakość rymu, która zamyka ogniwo */
  minQ: RhymeQuality;
  /** tanie rymy gramatyczne lecą do q = 1 */
  capCheap: boolean;
  /** skojarzenie musi zmienić kategorię */
  requireJump: boolean;
  /** świeżość słów punktowana ostro */
  strictFresh: boolean;
};

/** Wolny łańcuch: bez timera, bez limitu — wejście dla kogoś, kto tu pierwszy raz. */
export const FREE_LEVEL = 0;

export const CHAIN_LEVELS: ChainLevel[] = [
  { level: 1, label: 'Poziom 1', links: 4, seconds: 20, minQ: 1, capCheap: false, requireJump: false, strictFresh: false },
  { level: 2, label: 'Poziom 2', links: 6, seconds: 15, minQ: 1, capCheap: false, requireJump: false, strictFresh: false },
  { level: 3, label: 'Poziom 3', links: 8, seconds: 12, minQ: 1, capCheap: false, requireJump: false, strictFresh: false },
  { level: 4, label: 'Poziom 4', links: 10, seconds: 10, minQ: 1, capCheap: false, requireJump: false, strictFresh: false },
  { level: 5, label: 'Poziom 5', links: 12, seconds: 8, minQ: 1, capCheap: false, requireJump: false, strictFresh: false },
  { level: 6, label: 'Poziom 6', links: 16, seconds: 6, minQ: 1, capCheap: false, requireJump: false, strictFresh: false },
];

/** Wolny łańcuch udaje poziom, żeby reszta kodu miała jedną ścieżkę. */
export const FREE_DEF: ChainLevel = {
  level: FREE_LEVEL,
  label: 'Wolny łańcuch',
  links: 0,
  seconds: 0,
  minQ: 1,
  capCheap: false,
  requireJump: false,
  strictFresh: false,
};

export const CHAIN_LEVEL_NUMBERS = CHAIN_LEVELS.map((l) => l.level);

export function levelDef(level: number): ChainLevel {
  return level === FREE_LEVEL ? FREE_DEF : CHAIN_LEVELS.find((l) => l.level === level) ?? CHAIN_LEVELS[0];
}

export function isFree(level: number): boolean {
  return level === FREE_LEVEL;
}

export type StartMode = 'random' | 'category' | 'own';

export type ChainConfig = {
  level: number;
  start: StartMode;
  /** kategoria słowa startowego, gdy `start === 'category'` */
  category: string;
  /** twoje słowo startowe, gdy `start === 'own'` */
  startWord: string;
  /** 0 = metronom wyłączony */
  bpm: number;
  voice: boolean;
  /** szczery przegląd po rundzie */
  review: boolean;
};

export const defaultChainConfig: ChainConfig = {
  level: FREE_LEVEL,
  start: 'random',
  category: '',
  startWord: '',
  bpm: 0,
  voice: false,
  review: true,
};

export const CHAIN_BPMS = [0, 60, 75, 90, 110];

export function linkWord(n: number): string {
  return n === 1 ? 'ogniwo' : n % 10 >= 2 && n % 10 <= 4 && (n < 10 || n > 20) ? 'ogniwa' : 'ogniw';
}

/** Ile słów musisz podać: każde ogniwo to skojarzenie + rym do niego. */
export function wordCount(def: ChainLevel): number {
  return def.links * 2;
}

export function levelSummary(def: ChainLevel): string {
  if (def.level === FREE_LEVEL) return 'bez timera, bez limitu';
  return `${wordCount(def)} słów do podania · ${def.seconds} s na ogniwo`;
}
