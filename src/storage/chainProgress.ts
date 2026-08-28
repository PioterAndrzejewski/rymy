/**
 * Wyniki trybu „Łańcuch skojarzeń".
 *
 * Zapisujemy nie tylko punkty. `pairs` to twój prywatny słownik skojarzeń —
 * z czego na co skaczesz — a `words` mówi, ile razy dane słowo już padło.
 * Bez tego drugiego pasek „Rozrzut" nie miałby o co się oprzeć: te same
 * dwadzieścia słów co sesja mają przestać się opłacać.
 *
 * Wszystko lokalnie, jeden klucz w localStorage. Nic nie wychodzi na zewnątrz.
 */

import type { RhymeQuality } from '@/wordbank/pl/phonetics';

const KEY = 'rymy.chain.v1';

/** Jedno ogniwo: słowo wyjściowe → skojarzenie → rym do skojarzenia. */
export type ChainLink = {
  from: string;
  assoc: string;
  rhyme: string;
  q: RhymeQuality;
  cheap: boolean;
  signal: 'blisko' | 'skok';
  /** ile trwało domknięcie ogniwa */
  ms: number;
  /** dopisane przez nas po upływie czasu */
  auto: boolean;
  /** skreślone przez ciebie w szczerym przeglądzie */
  weak: boolean;
};

export type ChainScores = {
  length: number;
  tempo: number;
  quality: number;
  spread: number;
  total: number;
};

export type ChainRun = {
  ts: number;
  level: number;
  /** słowo, od którego wyszedł łańcuch */
  seed: string;
  links: ChainLink[];
  scores: ChainScores;
  passed: boolean;
  msPerLink: number;
  /** najdłuższa seria ogniw domkniętych samodzielnie */
  combo: number;
  voice: boolean;
};

export type ChainBest = {
  total: number;
  /** ile ogniw domknąłeś sam */
  links: number;
  msPerLink: number;
  ts: number;
};

export type ChainProgress = {
  /** ostatnie 50 rund, najnowsze na końcu */
  runs: ChainRun[];
  best: Record<number, ChainBest>;
  /** ile razy użyłeś słowa — stąd świeżość */
  words: Record<string, number>;
  /** twoje skojarzenia: słowo → to, co ci z niego przyszło */
  pairs: Record<string, string[]>;
  /** gdzie łańcuchy chodzą najczęściej */
  categories: Record<string, number>;
};

export const emptyChain: ChainProgress = { runs: [], best: {}, words: {}, pairs: {}, categories: {} };

const MAX_RUNS = 50;
/** Ile skojarzeń pamiętamy dla jednego słowa — dalej to już nie słownik, tylko log. */
const MAX_PAIRS_PER_WORD = 8;

export function loadChain(): ChainProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyChain;
    const p = JSON.parse(raw) as Partial<ChainProgress>;
    return {
      runs: Array.isArray(p.runs) ? p.runs : [],
      best: p.best ?? {},
      words: p.words ?? {},
      pairs: p.pairs ?? {},
      categories: p.categories ?? {},
    };
  } catch {
    return emptyChain;
  }
}

function save(p: ChainProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // pełny storage albo tryb prywatny — ćwiczyć można dalej, po prostu bez historii
  }
}

export function clearChain(): void {
  try { localStorage.removeItem(KEY); } catch { /* jw. */ }
}

export type ChainRunInput = {
  level: number;
  seed: string;
  links: ChainLink[];
  scores: ChainScores;
  passed: boolean;
  combo: number;
  voice: boolean;
  /** kategorie, przez które przeszedł łańcuch */
  categories: string[];
};

/** Zapisuje rundę i zwraca stan już po zapisie. */
export function recordChainRun(input: ChainRunInput): ChainProgress {
  const p = loadChain();
  const own = input.links.filter((l) => !l.auto);
  const msPerLink = own.length
    ? Math.round(own.reduce((n, l) => n + l.ms, 0) / own.length)
    : 0;

  const run: ChainRun = {
    ts: Date.now(),
    level: input.level,
    seed: input.seed,
    links: input.links,
    scores: input.scores,
    passed: input.passed,
    msPerLink,
    combo: input.combo,
    voice: input.voice,
  };
  p.runs = [...p.runs, run].slice(-MAX_RUNS);

  // Słowa dopisane przez nas nie są twoje — ani do świeżości, ani do słownika.
  for (const l of own) {
    for (const w of [l.assoc, l.rhyme]) {
      const key = w.toLowerCase();
      if (!key) continue;
      p.words[key] = (p.words[key] ?? 0) + 1;
    }
    const from = l.from.toLowerCase();
    const to = l.assoc.toLowerCase();
    if (from && to) {
      const seen = p.pairs[from] ?? [];
      p.pairs[from] = [to, ...seen.filter((w) => w !== to)].slice(0, MAX_PAIRS_PER_WORD);
    }
  }

  for (const c of input.categories) {
    p.categories[c] = (p.categories[c] ?? 0) + 1;
  }

  // „Wolny łańcuch" (poziom 0) nie ma celu, więc nie ma też czego zaliczać —
  // rekord długości trzymamy jednak, bo to on stoi kreską na taśmie.
  const prev = p.best[input.level];
  p.best[input.level] = {
    total: Math.max(prev?.total ?? 0, input.scores.total),
    links: Math.max(prev?.links ?? 0, own.length),
    msPerLink: msPerLink > 0
      ? Math.min(prev?.msPerLink || Number.MAX_SAFE_INTEGER, msPerLink)
      : prev?.msPerLink ?? 0,
    ts: run.ts,
  };

  save(p);
  return p;
}

export function bestFor(level: number, p: ChainProgress): ChainBest | undefined {
  return p.best[level];
}

/**
 * Jak świeże jest słowo: 1 = jeszcze go nie było, 0 = wraca w kółko.
 * Spadek jest szybki na początku — trzecie użycie tego samego słowa już nie
 * powinno wyglądać jak nowe.
 */
export function freshness(word: string, p: ChainProgress): number {
  const used = p.words[word.trim().toLowerCase()] ?? 0;
  return 1 / (1 + used);
}
