/**
 * Co pamiętamy między sesjami trybu „Wypluj się z rymów".
 *
 * Bez tego każda runda zaczyna się od zera: pokazujemy dziesięć słów, których
 * nie wpisałeś, ty je czytasz i zapominasz. Bank rymów w głowie buduje się
 * przez powtarzane przypominanie — więc trzymamy, co wyszło samo, co nie
 * wyszło mimo podpowiedzi, i kiedy to było.
 *
 * Wszystko lokalnie, jeden klucz w localStorage. Nic nie wychodzi na zewnątrz.
 */

const KEY = 'rymy.rhymeProgress.v1';

export type WordStat = {
  /** ile razy wpisałeś to słowo sam */
  hits: number;
  /** ile razy pokazaliśmy ci je jako przegapione */
  misses: number;
  /** ile razy wypadło ci słowo, które wcześniej już umiałeś */
  lapses: number;
  /**
   * Czy właśnie ci wypadło: umiesz je, ale przy ostatnim pokazaniu go nie było.
   * Trzymamy to jawnie, a nie jako porównanie `shown > last` — dwie rundy
   * potrafią wpaść w tę samą milisekundę i flaga by się nie zapaliła.
   */
  lapsed: boolean;
  /** kiedy ostatnio je wpisałeś (ms) */
  last: number;
  /** kiedy ostatnio ci je pokazaliśmy (ms) */
  shown: number;
};

export type EndingStat = {
  rounds: number;
  /** najlepszy wynik w jednej rundzie */
  best: number;
  /** wszystkie rymy wpisane w tej rodzinie */
  total: number;
  last: number;
};

export type Progress = {
  /** klucz: słowo z banku (małymi literami) */
  words: Record<string, WordStat>;
  endings: Record<string, EndingStat>;
  /** twoje rymy, których nie ma w naszym banku — od nich rośnie słownik */
  own: Record<string, string[]>;
};

export const emptyProgress: Progress = { words: {}, endings: {}, own: {} };

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress;
    const p = JSON.parse(raw) as Partial<Progress>;
    const words = p.words ?? {};
    // zapisy sprzed `lapses` czyta się dalej — brakujące pole to po prostu 0
    for (const k of Object.keys(words)) words[k] = { ...NEW_STAT, ...words[k] };
    return { words, endings: p.endings ?? {}, own: p.own ?? {} };
  } catch {
    return emptyProgress;
  }
}

function save(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // pełny storage albo tryb prywatny — ćwiczyć można dalej, po prostu bez historii
  }
}

export function clearProgress(): void {
  try { localStorage.removeItem(KEY); } catch { /* jw. */ }
}

export type RoundRecord = {
  ending: string;
  /** rymy z banku, które wpisałeś */
  produced: string[];
  /** twoje rymy spoza banku — dopisują się do twojego własnego banku */
  ownWords: string[];
  /** słowa, które pokazaliśmy jako przegapione — tylko te liczą się jako miss */
  shownMisses: string[];
};

const NEW_STAT: WordStat = { hits: 0, misses: 0, lapses: 0, lapsed: false, last: 0, shown: 0 };

/**
 * Zapisuje jedną rundę i zwraca nowy stan.
 *
 * Miss dostają wyłącznie słowa faktycznie pokazane. Gdybyśmy liczyli całą
 * rodzinę, po jednej rundzie na -ość miałbyś 200 „zaległości" i lista powtórek
 * straciłaby sens.
 */
export function recordRound(rounds: RoundRecord[]): Progress {
  const p = loadProgress();
  const now = Date.now();

  for (const r of rounds) {
    if (!r.ending) continue;

    // Własne słowa liczą się jak każde inne — twój bank też ma prawo wracać.
    for (const w of [...r.produced, ...r.ownWords]) {
      const s = p.words[w] ?? NEW_STAT;
      p.words[w] = { ...s, hits: s.hits + 1, last: now, lapsed: false };
    }
    for (const w of r.shownMisses) {
      const s = p.words[w] ?? NEW_STAT;
      // Słowo, które już kiedyś wpisałeś, a teraz nie — to nie jest zwykłe
      // przegapienie, tylko coś, co ci wypadło. Liczymy osobno.
      const lapse = s.hits > 0;
      p.words[w] = {
        ...s,
        misses: s.misses + 1,
        lapses: s.lapses + (lapse ? 1 : 0),
        lapsed: lapse || s.lapsed,
        shown: now,
      };
    }

    const e = p.endings[r.ending] ?? { rounds: 0, best: 0, total: 0, last: 0 };
    const scored = r.produced.length + r.ownWords.length;
    p.endings[r.ending] = {
      rounds: e.rounds + 1,
      best: Math.max(e.best, scored),
      total: e.total + scored,
      last: now,
    };

    if (r.ownWords.length) {
      const seen = new Set(p.own[r.ending] ?? []);
      for (const w of r.ownWords) seen.add(w);
      p.own[r.ending] = [...seen].sort((a, b) => a.localeCompare(b, 'pl'));
    }
  }

  save(p);
  return p;
}

/** Usuwa własne słowo z listy — na wypadek literówki, która przeszła walidację. */
export function forgetOwnWord(ending: string, word: string): Progress {
  const p = loadProgress();
  p.own[ending] = (p.own[ending] ?? []).filter((w) => w !== word);
  if (!p.own[ending].length) delete p.own[ending];
  save(p);
  return p;
}
