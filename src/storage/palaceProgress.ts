/**
 * Wyniki trybu „Pałac mentalny".
 *
 * Metoda loci ma sens dopiero wtedy, gdy widzisz, że ten sam poziom idzie ci
 * z miesiąca na miesiąc szybciej i celniej — więc trzymamy każdą rundę, rekord
 * per poziom i statystykę per pokój (który pokój najczęściej gubisz).
 *
 * Wszystko lokalnie, jeden klucz w localStorage. Nic nie wychodzi na zewnątrz.
 */

const KEY = 'rymy.palace.v1';

/** Jedna pozycja w odtwarzaniu: czego oczekiwaliśmy i co padło. */
export type SlotResult = {
  /** indeks pokoju (0-based) */
  room: number;
  expected: string;
  answer: string;
  /** dokładnie to słowo w tym pokoju */
  exact: boolean;
  /** słowo z zestawu, ale wpisane w złym pokoju */
  misplaced: boolean;
};

export type PalaceRun = {
  ts: number;
  level: number;
  words: string[];
  answers: string[];
  /** trafione na właściwej pozycji */
  exact: number;
  /** pamiętane, ale nie w tym pokoju */
  misplaced: number;
  /** czas samego odtwarzania (ms) */
  recallMs: number;
  msPerWord: number;
  used3d: boolean;
  voice: boolean;
};

export type LevelBest = {
  exact: number;
  /** exact / liczba słów, 0..1 */
  accuracy: number;
  /** najlepszy czas na słowo przy komplecie (0 = jeszcze nie było kompletu) */
  msPerWord: number;
  ts: number;
};

export type PalaceProgress = {
  /** ostatnie 50 rund, najnowsze na końcu */
  runs: PalaceRun[];
  best: Record<number, LevelBest>;
  /** ile razy dany pokój był odwiedzony i ile razy trafiony */
  rooms: Record<number, { visits: number; exact: number }>;
};

export const emptyPalace: PalaceProgress = { runs: [], best: {}, rooms: {} };

const MAX_RUNS = 50;

export function loadPalace(): PalaceProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyPalace;
    const p = JSON.parse(raw) as Partial<PalaceProgress>;
    return {
      runs: Array.isArray(p.runs) ? p.runs : [],
      best: p.best ?? {},
      rooms: p.rooms ?? {},
    };
  } catch {
    return emptyPalace;
  }
}

function save(p: PalaceProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // pełny storage albo tryb prywatny — ćwiczyć można dalej, po prostu bez historii
  }
}

export function clearPalace(): void {
  try { localStorage.removeItem(KEY); } catch { /* jw. */ }
}

/** Porównanie odpowiedzi z zestawem — jedno miejsce prawdy dla wyniku i podsumowania. */
export function scoreSlots(words: string[], answers: string[]): SlotResult[] {
  const norm = (w: string) => w.trim().toLowerCase();
  const setOfWords = words.map(norm);
  return words.map((expected, i) => {
    const answer = answers[i] ?? '';
    const a = norm(answer);
    const exact = a !== '' && a === norm(expected);
    return {
      room: i,
      expected,
      answer,
      exact,
      misplaced: !exact && a !== '' && setOfWords.includes(a),
    };
  });
}

export type RunInput = {
  level: number;
  words: string[];
  answers: string[];
  recallMs: number;
  used3d: boolean;
  voice: boolean;
};

/** Zapisuje rundę i zwraca nowy stan (już po zapisie). */
export function recordPalaceRun(input: RunInput): PalaceProgress {
  const p = loadPalace();
  const slots = scoreSlots(input.words, input.answers);
  const exact = slots.filter((s) => s.exact).length;
  const misplaced = slots.filter((s) => s.misplaced).length;
  const n = input.words.length || 1;

  const run: PalaceRun = {
    ts: Date.now(),
    level: input.level,
    words: input.words,
    answers: input.answers,
    exact,
    misplaced,
    recallMs: input.recallMs,
    msPerWord: Math.round(input.recallMs / n),
    used3d: input.used3d,
    voice: input.voice,
  };

  p.runs = [...p.runs, run].slice(-MAX_RUNS);

  const accuracy = exact / n;
  const prev = p.best[input.level];
  const complete = exact === input.words.length;
  p.best[input.level] = {
    exact: Math.max(prev?.exact ?? 0, exact),
    accuracy: Math.max(prev?.accuracy ?? 0, accuracy),
    // Czas liczy się tylko wtedy, gdy odtworzyłeś komplet — inaczej rekordem
    // byłoby wpisanie dwóch słów i naciśnięcie „koniec".
    msPerWord: complete
      ? Math.min(prev?.msPerWord || Number.MAX_SAFE_INTEGER, run.msPerWord)
      : prev?.msPerWord ?? 0,
    ts: run.ts,
  };

  for (const s of slots) {
    const r = p.rooms[s.room] ?? { visits: 0, exact: 0 };
    p.rooms[s.room] = { visits: r.visits + 1, exact: r.exact + (s.exact ? 1 : 0) };
  }

  save(p);
  return p;
}

export type LevelReport = {
  level: number;
  runs: number;
  best?: LevelBest;
  /** średnia celność z ostatnich pięciu rund na tym poziomie */
  recentAccuracy: number;
  lastMsPerWord: number;
};

export function levelReport(level: number, p: PalaceProgress): LevelReport {
  const runs = p.runs.filter((r) => r.level === level);
  const recent = runs.slice(-5);
  const recentAccuracy = recent.length
    ? recent.reduce((n, r) => n + r.exact / (r.words.length || 1), 0) / recent.length
    : 0;
  return {
    level,
    runs: runs.length,
    best: p.best[level],
    recentAccuracy,
    lastMsPerWord: runs.at(-1)?.msPerWord ?? 0,
  };
}

/**
 * Poziom, który program proponuje: najniższy, którego jeszcze nie masz na 100%,
 * ale nie skaczemy dalej niż o jeden ponad to, co już zaliczyłeś.
 */
export function suggestLevel(levels: number[], p: PalaceProgress): number {
  let suggestion = levels[0];
  for (const lvl of levels) {
    const b = p.best[lvl];
    if (b && b.accuracy >= 1) suggestion = Math.min(levels[levels.length - 1], lvl + 1);
    else return suggestion === lvl ? lvl : Math.min(suggestion, lvl);
  }
  return suggestion;
}
