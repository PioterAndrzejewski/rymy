/** Dobór słów do zapamiętania i zadań-rozpraszaczy. */

import {
  CATEGORY_IDS, categoryLabel, categoryWords, type CategoryId,
} from '@/wordbank/pl/story-topics';

export type PalaceCategory = { id: CategoryId; label: string };

/**
 * Kategorie polecane: ich banki to w większości konkretne rzeczowniki, a metoda
 * loci stoi na tym, że słowo da się *zobaczyć* w pokoju. „Smutek" czy „Porażka"
 * też są do wzięcia (niżej), tylko trudniej je postawić na półce.
 */
export const PALACE_PICKS: PalaceCategory[] = (
  ['dom', 'kuchnia', 'miasto', 'podroze', 'muzyka', 'las', 'morze', 'zwierzeta',
   'sport', 'kosmos', 'zakupy', 'samochody'] as CategoryId[]
).map((id) => ({ id, label: categoryLabel(id) }));

const PICKED = new Set(PALACE_PICKS.map((c) => c.id));

/** Cała reszta banku tematów — ten sam zestaw, który widzi tryb Historia. */
export const PALACE_REST: PalaceCategory[] = CATEGORY_IDS
  .filter((id) => !PICKED.has(id))
  .map((id) => ({ id, label: categoryLabel(id) }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pl'));

/** Wszystkie tematy, w kolejności: polecane, potem reszta. */
export const PALACE_CATEGORIES: PalaceCategory[] = [...PALACE_PICKS, ...PALACE_REST];

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Zestaw do zapamiętania.
 *
 * Krótkie, konkretne rzeczowniki — takie da się zobaczyć w pokoju. Odrzucamy
 * też słowa zaczynające się tak samo, bo w odtwarzaniu zlewają się w jedno
 * i mierzylibyśmy literówki zamiast pamięci.
 */
export function pickWords(count: number, category: string): string[] {
  // Mieszane ciągną z kategorii polecanych — pełna lista jest do wybrania
  // ręcznie, ale losowanie ze wszystkich 50 dawałoby zestawy nie do zobaczenia.
  const ids: CategoryId[] = category
    ? [category as CategoryId]
    : PALACE_PICKS.map((c) => c.id);
  const pool = shuffle(
    [...new Set(ids.flatMap((id) => categoryWords(id)))]
      .filter((w) => w.length >= 3 && w.length <= 10),
  );

  const out: string[] = [];
  const prefixes = new Set<string>();
  for (const w of pool) {
    if (out.length >= count) break;
    const p = w.slice(0, 3);
    if (prefixes.has(p)) continue;
    prefixes.add(p);
    out.push(w);
  }
  // Awaryjnie (wąska kategoria) dobijamy czymkolwiek, byle bez powtórek.
  for (const w of pool) {
    if (out.length >= count) break;
    if (!out.includes(w)) out.push(w);
  }
  return out;
}
