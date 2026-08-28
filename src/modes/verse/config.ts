/** Ustawienia trybu „Piosenka". */

export type VerseLink = {
  /** Słowo główne, z którego wyszło skojarzenie. */
  from: string;
  /** Skojarzenie — nowe słowo główne. */
  assoc: string;
  /** Wypełniacz: rymuje się z assoc, domyka linijkę. */
  rhyme: string;
  /** Tekst zwrotki napisany przez użytkownika. */
  verse: string;
};

export type VerseConfig = {
  verses: number;
  start: 'random' | 'own';
  startWord: string;
};

export const defaultVerseConfig: VerseConfig = {
  verses: 4,
  start: 'random',
  startWord: '',
};

export const VERSE_COUNTS = [2, 4, 6, 8] as const;

export function verseWord(n: number): string {
  if (n === 1) return 'zwrotka';
  if (n % 10 >= 2 && n % 10 <= 4 && (n < 10 || n > 20)) return 'zwrotki';
  return 'zwrotek';
}
