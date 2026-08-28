/**
 * Słowa łańcucha: skąd wychodzimy, co znaczy skojarzenie i co dopisujemy,
 * gdy czas minie.
 *
 * Nie oceniamy skojarzeń — nie mamy modelu semantyki i nie będziemy udawać,
 * że mamy. Kategorie z banku dają tylko sygnał *blisko / skok*, a jedyne twarde
 * odrzucenie to słowo, które już w tym łańcuchu było.
 */

import {
  CATEGORY_IDS, categoryLabel, categoryWords, stem, type CategoryId,
} from '@/wordbank/pl/story-topics';
import { keyOf, phonemes, rhymeQuality, type RhymeQuality } from '@/wordbank/pl/phonetics';
import type { ChainLevel } from './config';

export type ChainCategory = { id: CategoryId; label: string };

/**
 * Słowo startowe bierzemy z kategorii, w których siedzą konkretne rzeczy —
 * z „kota" łańcuch rusza od razu, z „przemijania" stoi. Wybrać można każdy
 * temat z banku (patrz `ALL_CHAIN_CATEGORIES`), ale losujemy stąd.
 */
export const CHAIN_CATEGORIES: ChainCategory[] = (
  ['dom', 'kuchnia', 'miasto', 'podroze', 'muzyka', 'las', 'morze', 'zwierzeta',
   'sport', 'kosmos', 'noc', 'dziecinstwo'] as CategoryId[]
).map((id) => ({ id, label: categoryLabel(id) }));

const STARTERS = new Set(CHAIN_CATEGORIES.map((c) => c.id));

/** Reszta tematów Historii — do wybrania ręcznie w kreatorze. */
export const OTHER_CHAIN_CATEGORIES: ChainCategory[] = CATEGORY_IDS
  .filter((id) => !STARTERS.has(id))
  .map((id) => ({ id, label: categoryLabel(id) }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pl'));

export { categoryLabel };

// ---------------------------------------------------------------------------
// Gdzie w banku mieszka słowo
// ---------------------------------------------------------------------------

let stemIndex: Map<string, CategoryId[]> | null = null;

function categoryIndex(): Map<string, CategoryId[]> {
  if (stemIndex) return stemIndex;
  const index = new Map<string, CategoryId[]>();
  for (const id of CATEGORY_IDS) {
    for (const w of categoryWords(id)) {
      const key = stem(w);
      const hit = index.get(key);
      if (hit) { if (!hit.includes(id)) hit.push(id); }
      else index.set(key, [id]);
    }
  }
  stemIndex = index;
  return index;
}

/** Kategorie banku, w które trafia słowo. Puste = nie znamy go. */
export function categoriesOf(word: string): CategoryId[] {
  return categoryIndex().get(stem(word)) ?? [];
}

export type LinkSignal = 'blisko' | 'skok' | 'powtórka';

/**
 * Sygnał, nie werdykt.
 *
 * `blisko` — oba słowa siedzą w tej samej rodzinie banku,
 * `skok` — w różnych (albo skojarzenia w banku nie ma),
 * `powtórka` — słowo już w tym łańcuchu było; to jedyne twarde odrzucenie.
 */
export function linkSignal(prev: string, assoc: string, used: Iterable<string>): LinkSignal {
  const a = assoc.trim().toLowerCase();
  if (!a) return 'powtórka';
  for (const w of used) if (w.trim().toLowerCase() === a) return 'powtórka';
  if (a === prev.trim().toLowerCase()) return 'powtórka';

  const before = categoriesOf(prev);
  const after = categoriesOf(a);
  if (!before.length || !after.length) return 'skok';
  return after.some((c) => before.includes(c)) ? 'blisko' : 'skok';
}

// ---------------------------------------------------------------------------
// Słowo startowe
// ---------------------------------------------------------------------------

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Krótkie, konkretne — takie słowo od razu coś pokazuje. */
function startPool(category: string): string[] {
  const ids: CategoryId[] = category
    ? [category as CategoryId]
    : CHAIN_CATEGORIES.map((c) => c.id);
  return [...new Set(ids.flatMap((id) => categoryWords(id)))]
    .filter((w) => w.length >= 3 && w.length <= 9);
}

export function pickStartWord(category = ''): string {
  const pool = startPool(category);
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'kot';
}

// ---------------------------------------------------------------------------
// Co dopisujemy, gdy czas minie
// ---------------------------------------------------------------------------

/** Indeks całego banku po ogonkach fonetycznych — auto-ogniwo szuka w nim rymu. */
type RhymeIndex = { one: Map<string, string[]>; two: Map<string, string[]> };
let rhymeIndex: RhymeIndex | null = null;

function buildIndex(): RhymeIndex {
  if (rhymeIndex) return rhymeIndex;
  const one = new Map<string, string[]>();
  const two = new Map<string, string[]>();
  const seen = new Set<string>();
  for (const id of CATEGORY_IDS) {
    for (const w of categoryWords(id)) {
      if (seen.has(w)) continue;
      seen.add(w);
      const p = phonemes(w);
      for (const [map, n] of [[one, 1], [two, 2]] as const) {
        const key = keyOf(p, n);
        if (!key) continue;
        const hit = map.get(key);
        if (hit) hit.push(w); else map.set(key, [w]);
      }
    }
  }
  rhymeIndex = { one, two };
  return rhymeIndex;
}

export type AutoLink = { assoc: string; rhyme: string; q: RhymeQuality; cheap: boolean };

/**
 * Ogniwo dopisane przez nas.
 *
 * Łańcuch nigdy nie umiera: nie zdążyłeś — dostajesz słowo od nas, oznaczone
 * jako nasze, i idziesz dalej. Przerwanie ćwiczenia w połowie uczy zatrzymywania
 * się, a to jest dokładnie ten nawyk, który zabija freestyle.
 */
export function autoLink(from: string, used: Set<string>, def: ChainLevel): AutoLink | null {
  const index = buildIndex();
  const taken = new Set([...used].map((w) => w.toLowerCase()));
  taken.add(from.toLowerCase());

  const before = categoriesOf(from);
  // Na poziomach z wymogiem skoku nasze skojarzenie też musi zmienić rodzinę —
  // inaczej podpowiadalibyśmy ruch, którego sami nie przyjmujemy.
  const ids = CHAIN_CATEGORIES.map((c) => c.id).filter(
    (id) => !def.requireJump || !before.includes(id),
  );

  for (const assoc of shuffle([...new Set(ids.flatMap((id) => categoryWords(id)))])) {
    if (taken.has(assoc.toLowerCase())) continue;
    const p = phonemes(assoc);
    const pool = def.minQ === 3
      ? index.two.get(keyOf(p, 2)) ?? []
      : index.one.get(keyOf(p, 1)) ?? [];

    for (const rhyme of shuffle(pool)) {
      if (rhyme === assoc || taken.has(rhyme.toLowerCase())) continue;
      const v = rhymeQuality(assoc, rhyme);
      const q = def.capCheap && v.cheap ? (Math.min(v.q, 1) as RhymeQuality) : v.q;
      if (q < def.minQ) continue;
      return { assoc, rhyme, q, cheap: v.cheap };
    }
  }
  return null;
}
