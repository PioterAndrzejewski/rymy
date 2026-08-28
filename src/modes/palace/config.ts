/** Ustawienia rundy „Pałac mentalny". */

export type PalaceLevel = {
  level: number;
  /** ile słów trzeba zapamiętać (i tyle samo rymów przy odtwarzaniu) */
  words: number;
  label: string;
};

/**
 * Sześć poziomów: od dwóch słów (żeby w ogóle poczuć mechanizm) do szesnastu
 * (tyle punktów ma już cała zwrotka). Rym robisz przy odtwarzaniu, do słowa,
 * które właśnie wyjąłeś z pokoju — więc liczba rymów rośnie razem z liczbą słów.
 */
export const PALACE_LEVELS: PalaceLevel[] = [
  { level: 1, words: 2, label: 'Przedpokój' },
  { level: 2, words: 4, label: 'Małe mieszkanie' },
  { level: 3, words: 6, label: 'Pełne mieszkanie' },
  { level: 4, words: 9, label: 'Dom z piętrem' },
  { level: 5, words: 12, label: 'Kamienica' },
  { level: 6, words: 16, label: 'Pałac' },
];

export const LEVEL_NUMBERS = PALACE_LEVELS.map((l) => l.level);

export function levelDef(level: number): PalaceLevel {
  return PALACE_LEVELS.find((l) => l.level === level) ?? PALACE_LEVELS[0];
}

export type PalaceConfig = {
  level: number;
  /** sekundy, przez które stoisz w pokoju ze słowem */
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

/**
 * Ile stoisz w pokoju ze słowem.
 *
 * Obchód nic od ciebie nie chce — masz popatrzeć i zobaczyć słowo w tym
 * miejscu. Dwie sekundy wystarczą na obraz, pięć daje czas na dorobienie
 * do niego historyjki.
 */
export const PACE_CHOICES = [1, 2, 3, 5] as const;
export type Pace = (typeof PACE_CHOICES)[number];

export function paceLabel(p: number): string {
  return p <= 1 ? 'błysk' : p <= 2 ? 'szybko' : p <= 3 ? 'normalnie' : 'spokojnie';
}

/**
 * Przerwa między obchodem a odtwarzaniem.
 *
 * Ostatni pokój zostaje jeszcze w pamięci roboczej — bez tych kilkunastu
 * sekund mierzylibyśmy w nim echo, a nie pałac.
 */
export const GAP_MS = 15_000;

/**
 * Przejście między pokojami: wyjście na korytarz, marsz i skręt do drzwi.
 * Musi się zgadzać z etapami w Walk3D (520 + 900 + 700).
 *
 * Nie jest to ozdobnik i dlatego nie jest szybkie: droga między pokojami to
 * jest ta część, którą zapamiętujesz jako trasę. Kiedy przeskakiwała w ćwierć
 * sekundy, pokoje zlewały się w listę slajdów.
 */
export const WALK_MS = 2120;

/**
 * Wejście z progu do pierwszego pokoju (900 + 700 w Walk3D).
 *
 * Dłuższe niż zwykłe przejście, bo tu zaczyna się cała trasa — z przedpokoju
 * trzeba zdążyć zobaczyć, gdzie się w ogóle jest.
 */
export const ENTER_MS = 2300;

export function wordCountLabel(n: number): string {
  return n === 1 ? 'słowo' : n < 5 ? 'słowa' : 'słów';
}

export function rhymeCountLabel(n: number): string {
  return n === 1 ? 'rym' : n < 5 ? 'rymy' : 'rymów';
}

/** Ile trwa cały obchód — do pokazania w kreatorze. */
export function memorizeSeconds(c: PalaceConfig): number {
  const n = levelDef(c.level).words;
  const walk = c.walk3d ? (ENTER_MS + (n - 1) * WALK_MS) / 1000 : 0;
  return Math.round(n * c.pace + walk);
}
