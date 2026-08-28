/**
 * Program: co ćwiczyć dalej i które słowa ci pokazać.
 *
 * Cała logika „uczenia się" siedzi tutaj — storage tylko liczy, komponenty
 * tylko rysują.
 */

import { coreCount, corePool, rhymeCount, rhymeWords, RHYME_ENDINGS } from '@/wordbank/pl/rhymes';
import type { Progress, WordStat } from '@/storage/rhymeProgress';

const DAY = 86_400_000;
const NO_STAT: WordStat = { hits: 0, misses: 0, lapses: 0, lapsed: false, last: 0, shown: 0 };

const stat = (p: Progress, w: string): WordStat => p.words[w] ?? NO_STAT;

/** Nigdy nie wpisane, choć już ci je pokazaliśmy. */
const isDue = (s: WordStat) => s.hits === 0 && s.misses > 0;

/**
 * Wypadło ci: umiałeś to słowo, a przy ostatnim pokazaniu znowu go nie było.
 * Flaga gaśnie sama, gdy wpiszesz je ponownie.
 */
const isLapsed = (s: WordStat) => s.hits > 0 && s.lapsed;

/** Wszystko, co należy do twojego banku w tej rodzinie — nasze słowa i twoje. */
function fullPool(ending: string, p: Progress): string[] {
  const core = corePool(ending);
  const inCore = new Set(core);
  const own = (p.own[ending] ?? []).filter((w) => !inCore.has(w));
  return [...core, ...own, ...rhymeWords(ending).filter((w) => !inCore.has(w))];
}

export type EndingReport = {
  ending: string;
  /** ile słów z trzonu rodziny wpisałeś choć raz */
  known: number;
  /** wpisane co najmniej dwa razy — te masz naprawdę */
  mastered: number;
  coreSize: number;
  bankSize: number;
  pct: number;
  rounds: number;
  best: number;
  /** twoje słowa spoza banku */
  own: number;
  /** pokazane, a wciąż niewpisane */
  due: number;
  /** umiałeś je, a ostatnio nie wyszły */
  lapsed: number;
  /** dni od ostatniej rundy, null = nigdy */
  daysSince: number | null;
};

export function endingReport(ending: string, p: Progress): EndingReport {
  const core = corePool(ending);
  const own = p.own[ending] ?? [];
  let known = 0;
  let mastered = 0;
  for (const w of core) {
    const s = stat(p, w);
    if (s.hits > 0) known++;
    if (s.hits > 1) mastered++;
  }
  // Pokrycie liczymy po trzonie, ale zaległości po wszystkim, co ci
  // pokazaliśmy — również po słowach z ogona i po twoich własnych.
  let due = 0;
  let lapsed = 0;
  for (const w of fullPool(ending, p)) {
    const s = stat(p, w);
    if (isDue(s)) due++;
    else if (isLapsed(s)) lapsed++;
  }
  const e = p.endings[ending];
  return {
    ending,
    known,
    mastered,
    due,
    lapsed,
    coreSize: core.length,
    bankSize: rhymeCount(ending),
    pct: core.length ? known / core.length : 0,
    rounds: e?.rounds ?? 0,
    best: e?.best ?? 0,
    own: own.length,
    daysSince: e?.last ? Math.floor((Date.now() - e.last) / DAY) : null,
  };
}

export function allReports(p: Progress): EndingReport[] {
  return RHYME_ENDINGS.map((e) => endingReport(e, p));
}

export type ProgressTotals = {
  known: number;
  mastered: number;
  core: number;
  own: number;
  rounds: number;
  due: number;
  lapsed: number;
  touched: number;
};

export function totals(reports: EndingReport[]): ProgressTotals {
  return reports.reduce<ProgressTotals>(
    (t, r) => ({
      known: t.known + r.known,
      mastered: t.mastered + r.mastered,
      core: t.core + r.coreSize,
      own: t.own + r.own,
      rounds: t.rounds + r.rounds,
      due: t.due + r.due,
      lapsed: t.lapsed + r.lapsed,
      touched: t.touched + (r.rounds > 0 ? 1 : 0),
    }),
    { known: 0, mastered: 0, core: 0, own: 0, rounds: 0, due: 0, lapsed: 0, touched: 0 },
  );
}

/**
 * Jak bardzo ta rodzina woła o powtórkę.
 * Nietknięta wygrywa zawsze; dalej liczy się niskie pokrycie, zaległe słowa
 * i to, jak dawno tu byłeś.
 */
function weakness(r: EndingReport): number {
  if (r.rounds === 0) return 10;
  const stale = Math.min((r.daysSince ?? 0) / 14, 1);
  const dueShare = r.coreSize ? Math.min((r.due + r.lapsed) / r.coreSize, 1) : 0;
  return (1 - r.pct) * 3 + dueShare * 2 + stale;
}

/**
 * Końcówka na następną rundę. Losujemy z trzech najsłabszych, żeby program
 * nie zakleszczył się na jednej rodzinie, dopóki jej nie wyczyścisz.
 */
export function pickPlanEnding(p: Progress): string {
  const ranked = allReports(p).sort((a, b) => weakness(b) - weakness(a));
  const top = ranked.slice(0, 3);
  return (top[Math.floor(Math.random() * top.length)] ?? ranked[0]).ending;
}

/** Krótkie uzasadnienie wyboru — żeby program nie był czarną skrzynką. */
export function planReason(r: EndingReport): string {
  if (r.rounds === 0) return 'jeszcze jej nie ćwiczyłeś';
  if (r.lapsed > 0) return `${r.lapsed} ${r.lapsed === 1 ? 'słowo ci wypadło' : 'słów ci wypadło'}`;
  if (r.due > 0) return `${r.due} ${r.due === 1 ? 'słowo wraca' : 'słów wraca'} z poprzednich rund`;
  if (r.daysSince !== null && r.daysSince >= 7) return `ostatnio ${r.daysSince} dni temu`;
  return `znasz ${Math.round(r.pct * 100)}% trzonu`;
}

export type ReviewKind =
  | 'due'     // pokazywaliśmy, wciąż nie wchodzi
  | 'lapsed'  // umiałeś, a teraz nie użyłeś
  | 'new';    // jeszcze go nie widziałeś

export type ReviewPick = { word: string; kind: ReviewKind };

/**
 * Trzy słowa po rundzie — nie trzynaście.
 *
 * Długa lista czyta się jak spis treści i nic z niej nie zostaje; krótka ma
 * szansę wrócić. Dlatego zamiast jednego rankingu bierzemy po jednym słowie
 * z każdej kolejki na zmianę, żeby w komplecie były trzy różne rzeczy:
 * coś, co ciągle ci ucieka, coś, co już umiałeś, i coś zupełnie nowego.
 *
 * Kolejki (w tej kolejności pierwszeństwa przy dobieraniu):
 *  1. zaległe — najczęściej przegapione, potem najdawniej pokazane,
 *  2. wypadnięte — twoje słowa, których dziś nie użyłeś, najdawniej wpisane
 *     na przedzie (tu też trafiają twoje własne rymy),
 *  3. nowe z trzonu, jeszcze nie widziane,
 *  4. reszta rodziny.
 */
export function reviewPicks(
  ending: string,
  used: Set<string>,
  p: Progress,
  limit: number,
): ReviewPick[] {
  const core = corePool(ending);
  const inCore = new Set(core);
  const coreRank = new Map(core.map((w, i) => [w, i]));
  const pool = fullPool(ending, p).filter((w) => !used.has(w));

  /**
   * Nowe słowa mieszamy między sobą. Trzon przy równej ocenie jest ułożony
   * alfabetycznie, więc bez tego dostawałbyś w kółko „barwność, biegłość,
   * bierność…" i uczyłbyś się słownika od litery B. Jitter liczymy raz,
   * żeby komparator pozostał spójny.
   */
  const jitter = new Map(pool.map((w) => [w, Math.random() * 40]));
  const rank = (w: string) => (coreRank.get(w) ?? 1e6) + (jitter.get(w) ?? 0);

  const due: string[] = [];
  const lapsed: string[] = [];
  const fresh: string[] = [];
  const rest: string[] = [];

  for (const w of pool) {
    const s = stat(p, w);
    if (isDue(s)) due.push(w);
    else if (s.hits > 0) lapsed.push(w);
    else if (inCore.has(w) && s.shown === 0) fresh.push(w);
    else rest.push(w);
  }

  due.sort((a, b) => stat(p, b).misses - stat(p, a).misses || stat(p, a).shown - stat(p, b).shown);
  // najdawniej używane na przód — te najbardziej zdążyły wywietrzeć
  lapsed.sort((a, b) => stat(p, a).last - stat(p, b).last);
  fresh.sort((a, b) => rank(a) - rank(b));
  rest.sort((a, b) => rank(a) - rank(b));

  const queues: Array<{ kind: ReviewKind; words: string[] }> = [
    { kind: 'due', words: due },
    { kind: 'lapsed', words: lapsed },
    { kind: 'new', words: fresh },
  ];

  const out: ReviewPick[] = [];
  // rundy po kolejkach: najpierw po jednym z każdej, potem dobieramy z tego,
  // co zostało — priorytet zawsze od góry listy
  while (out.length < limit && queues.some((q) => q.words.length)) {
    for (const q of queues) {
      if (out.length >= limit) break;
      const word = q.words.shift();
      if (word) out.push({ word, kind: q.kind });
    }
  }
  // Ogon rodziny to ostatnia deska ratunku, a nie równorzędna kolejka —
  // inaczej przy pustych powtórkach jeden z trzech slotów szedł na
  // „powierzchowność" zamiast na słowo, które faktycznie zaśpiewasz.
  while (out.length < limit && rest.length) {
    out.push({ word: rest.shift()!, kind: 'new' });
  }
  return out;
}

/** Słowa, które wracają: pokazane, wciąż niewpisane. */
export function dueWords(ending: string, p: Progress): string[] {
  return fullPool(ending, p)
    .filter((w) => isDue(stat(p, w)))
    .sort((a, b) => stat(p, b).misses - stat(p, a).misses);
}

/** Umiałeś je, a ostatnio ci wypadły — z twoimi własnymi rymami włącznie. */
export function lapsedWords(ending: string, p: Progress): string[] {
  return fullPool(ending, p)
    .filter((w) => isLapsed(stat(p, w)))
    .sort((a, b) => stat(p, a).last - stat(p, b).last);
}

/** Słowa, które już masz — wpisane samodzielnie. */
export function knownWords(ending: string, p: Progress): string[] {
  return corePool(ending).filter((w) => stat(p, w).hits > 0);
}

export { coreCount };
