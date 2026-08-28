/** Dobór słów do zapamiętania i zadań-rozpraszaczy. */

import { categoryWords, type CategoryId } from '@/wordbank/pl/story-topics';
import { corePool, randomRhymeEnding } from '@/wordbank/pl/rhymes';

/** Kategorie mają w banku konkretne rzeczowniki — o takie w loci chodzi. */
export const PALACE_CATEGORIES: { id: CategoryId; label: string }[] = [
  { id: 'dom', label: 'Dom' },
  { id: 'kuchnia', label: 'Kuchnia' },
  { id: 'miasto', label: 'Miasto' },
  { id: 'podroze', label: 'Podróże' },
  { id: 'muzyka', label: 'Muzyka' },
  { id: 'las', label: 'Las' },
  { id: 'morze', label: 'Morze' },
  { id: 'zwierzeta', label: 'Zwierzęta' },
  { id: 'sport', label: 'Sport' },
  { id: 'kosmos', label: 'Kosmos' },
];

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
  const ids: CategoryId[] = category
    ? [category as CategoryId]
    : PALACE_CATEGORIES.map((c) => c.id);
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

export type Distraction = { seed: string; ending: string };

/**
 * Zadania między zapamiętaniem a odtwarzaniem: „podaj rym do X".
 *
 * To nie jest ozdobnik — bez luki wypełnionej czymś werbalnym test mierzy
 * pamięć roboczą, a nie pałac. Rymowanie jest tu podwójnie na miejscu:
 * rozprasza i jest tym, co i tak ćwiczysz w pozostałych trybach.
 */
export function pickDistractions(count: number, avoid: string[]): Distraction[] {
  const taken = new Set(avoid.map((w) => w.toLowerCase()));
  const out: Distraction[] = [];
  const usedEndings = new Set<string>();

  for (let guard = 0; out.length < count && guard < count * 20; guard++) {
    const ending = randomRhymeEnding();
    if (usedEndings.has(ending)) continue;
    const pool = corePool(ending).filter((w) => !taken.has(w.toLowerCase()));
    if (pool.length < 3) continue;
    usedEndings.add(ending);
    const seed = pool[Math.floor(Math.random() * pool.length)];
    taken.add(seed.toLowerCase());
    out.push({ seed, ending });
  }
  return out;
}
