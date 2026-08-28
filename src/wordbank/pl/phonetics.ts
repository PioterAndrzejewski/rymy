/**
 * Fonetyka polszczyzny na tyle, na ile potrzeba do oceny rymu.
 *
 * Tryb „Wypluj się z rymów" sprawdza rym względem końcówki z banku — tam
 * wystarczy porównać ogonki dwóch stringów. W „Łańcuchu skojarzeń" rymujesz do
 * słowa, które sam przed chwilą wymyśliłeś: banku nie ma, więc trzeba policzyć,
 * *jak dobry* to rym. Stąd ten plik stoi w `wordbank`, a nie w `modes/chain` —
 * ta sama ocena podniesie potem jakość trybu 1.
 *
 * Wszystko jest przybliżeniem: nie robimy transkrypcji IPA, tylko sprowadzamy
 * zapis do postaci, w której to samo brzmienie wygląda tak samo („morze" =
 * „może", „bóg" = „buk", „lód" = „lut").
 */

export type RhymeQuality = 0 | 1 | 2 | 3;
// 0 — nie rym / to samo słowo
// 1 — asonans: zgadza się ostatnia samogłoska (+ zbliżona spółgłoska)
// 2 — czysty: cała ostatnia sylaba od samogłoski
// 3 — dwie sylaby i więcej (rym głęboki / składany)

/** Samogłoski po sprowadzeniu do fonemów (ó i y już zlane z u oraz i). */
const VOWELS = 'aeiouąę';

const FINAL_DEVOICING: Record<string, string> = {
  b: 'p', d: 't', g: 'k', w: 'f', z: 's', ż: 'š', ź: 'ś', Ʒ: 'c', Ǯ: 'ć', ǯ: 'ć',
};

/**
 * Zapis → przybliżone fonemy.
 *
 * Kolejność kroków jest istotna: najpierw zmiękczenia przez „i" (bo „ci" w
 * „ciasto" to jedna głoska, a nie c + i), potem dwuznaki, na końcu wygłos.
 * Dwuznaki dostają pojedyncze znaki, żeby liczenie sylab i ogonków nie musiało
 * pamiętać, że „sz" to jedna spółgłoska.
 */
export function phonemes(word: string): string {
  let w = word.trim().toLowerCase().replace(/[^a-ząćęłńóśźży]/g, '');
  if (!w) return '';

  // zmiękczenia: spółgłoska + i + samogłoska
  w = w
    .replace(/dzi(?=[aąeęoóuy])/g, 'Ǯ')
    .replace(/ci(?=[aąeęoóuy])/g, 'ć')
    .replace(/si(?=[aąeęoóuy])/g, 'ś')
    .replace(/zi(?=[aąeęoóuy])/g, 'ź')
    .replace(/ni(?=[aąeęoóuy])/g, 'ń');

  // dwuznaki → jeden znak
  w = w
    .replace(/ch/g, 'h')
    .replace(/cz/g, 'č')
    .replace(/sz/g, 'š')
    .replace(/dż/g, 'ǯ')
    .replace(/dź/g, 'ǯ')
    .replace(/dz/g, 'Ʒ')
    .replace(/rz/g, 'ż');

  // pary, które brzmią tak samo, a piszą się inaczej
  w = w.replace(/ó/g, 'u').replace(/y/g, 'i').replace(/ł/g, 'w');

  // Wygłosowe „ę" wymawia się jak „e" („idę" rymuje się z „wodę"),
  // wygłosowe „ą" jak „om" („idą" — „domom").
  w = w.replace(/ę$/, 'e').replace(/ą$/, 'om');

  // ubezdźwięcznienie w wygłosie: „lód" = „lut", „bóg" = „buk"
  const last = w.slice(-1);
  if (FINAL_DEVOICING[last]) w = w.slice(0, -1) + FINAL_DEVOICING[last];

  return w;
}

/** „kartonowe" → „aooe". Tyle, ile sylab — samogłoski są ich rdzeniem. */
export function vowelSkeleton(word: string): string {
  return [...phonemes(word)].filter((c) => VOWELS.includes(c)).join('');
}

/** Indeksy samogłosek w ciągu fonemów, od początku. */
function vowelPositions(p: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < p.length; i++) if (VOWELS.includes(p[i])) out.push(i);
  return out;
}

/** Ogonek od n-tej samogłoski od końca (1 = ostatnia). '' gdy tylu nie ma. */
function tailFrom(p: string, n: number): string {
  const v = vowelPositions(p);
  if (v.length < n) return '';
  return p.slice(v[v.length - n]);
}

/** Spółgłoski po ostatniej samogłosce — to, czym słowo się zamyka. */
function coda(p: string): string {
  const v = vowelPositions(p);
  return v.length ? p.slice(v[v.length - 1] + 1) : p;
}

/**
 * Klucz rymu: ta część słowa, która musi się zgadzać na danej głębokości.
 *
 * `depth: 2` to wszystko od przedostatniej samogłoski — po polsku pada na nią
 * akcent, więc to jest rym pełny, dwusylabowy.
 *
 * `depth: 1` to ostatnia sylaba, ale z jednym haczykiem: gdy słowo kończy się
 * samogłoską, samo „-a" nie jest rymem (inaczej „lampa" rymowałaby się
 * z „kobietą"), więc dobieramy jeszcze spółgłoski, które ją poprzedzają.
 */
export function rhymeKey(word: string, depth: 1 | 2): string {
  const p = typeof word === 'string' ? phonemes(word) : '';
  return keyOf(p, depth);
}

/** To samo, ale na gotowych fonemach — indeksy banku liczą je raz. */
export function keyOf(p: string, depth: 1 | 2): string {
  if (depth === 2) return tailFrom(p, 2);
  const v = vowelPositions(p);
  if (!v.length) return '';
  const i = v[v.length - 1];
  if (i < p.length - 1) return p.slice(i);
  // wygłosowa samogłoska: bierzemy też spółgłoski przed nią
  let start = i;
  while (start > 0 && !VOWELS.includes(p[start - 1])) start--;
  return p.slice(start);
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = [...curr];
  }
  return prev[b.length];
}

/**
 * Sufiksy, które w polszczyźnie rymują się same z siebie.
 *
 * „aktualność" i „bezczelność" nie mają ze sobą nic wspólnego poza tym, że obie
 * są rzeczownikami na -ość — a taki rym w zwrotce słychać jako pójście na
 * łatwiznę. Od poziomu 3 obcinamy je do q = 1, inaczej cała gra kończy się na
 * „-owanie".
 */
const CHEAP_SUFFIXES = [
  'owanie', 'owania', 'ością', 'ościach', 'ości', 'ość', 'anie', 'ania', 'aniu',
  'aniem', 'enie', 'enia', 'eniu', 'eniem', 'ować', 'ujesz', 'ujemy', 'ują',
  'ałem', 'ałam', 'aliśmy', 'ałeś', 'ali', 'ały', 'ami', 'ach', 'ego', 'emu',
  'ych', 'ymi', 'ich', 'imi', 'owy', 'owa', 'owe', 'ny', 'na', 'ne',
].sort((a, b) => b.length - a.length);

/** Najdłuższy produktywny sufiks wspólny dla obu form (albo ''). */
function sharedCheapSuffix(a: string, b: string): string {
  for (const s of CHEAP_SUFFIXES) {
    // rdzeń musi coś po sobie zostawić — inaczej „na" zjada połowę słownika
    if (a.endsWith(s) && b.endsWith(s) && a.length >= s.length + 2 && b.length >= s.length + 2) {
      return s;
    }
  }
  return '';
}

export type RhymeVerdict = { q: RhymeQuality; cheap: boolean };

/**
 * Jak dobrze `a` rymuje się z `b`.
 *
 * `cheap` zapala się, gdy całe podobieństwo siedzi w produktywnej końcówce,
 * a rdzenie nie mają ze sobą nic wspólnego. „wolność / zdolność" to nie jest
 * tani rym (zgadza się -olność), „miłość / litość" — jest.
 */
export function rhymeQuality(a: string, b: string): RhymeVerdict {
  const wa = a.trim().toLowerCase();
  const wb = b.trim().toLowerCase();
  if (!wa || !wb || wa === wb) return { q: 0, cheap: false };

  const pa = phonemes(wa);
  const pb = phonemes(wb);
  // Identyczne fonemy przy różnym zapisie to nie to samo słowo, tylko rym
  // homonimiczny („morze / może") — liczymy go normalnie, po ogonkach.
  if (!pa || !pb) return { q: 0, cheap: false };

  const suffix = sharedCheapSuffix(wa, wb);
  let cheap = false;
  if (suffix) {
    const stemA = phonemes(wa.slice(0, -suffix.length));
    const stemB = phonemes(wb.slice(0, -suffix.length));
    // Rdzenie, które same się rymują, ratują rym — tam sufiks jest dodatkiem,
    // a nie całym pomysłem.
    cheap = tailFrom(stemA, 1) !== tailFrom(stemB, 1);
  }

  let q: RhymeQuality = 0;
  const deep = keyOf(pa, 2);
  const near = keyOf(pa, 1);
  if (deep && deep === keyOf(pb, 2)) q = 3;
  else if (near && near === keyOf(pb, 1)) q = 2;
  else {
    const va = tailFrom(pa, 1).slice(0, 1);
    const vb = tailFrom(pb, 1).slice(0, 1);
    if (va && va === vb && editDistance(coda(pa), coda(pb)) <= 1) q = 1;
  }

  return { q, cheap };
}

/** Ocena po obcięciu tanich rymów — jedno miejsce prawdy dla poziomów 3+. */
export function effectiveQuality(v: RhymeVerdict, capCheap: boolean): RhymeQuality {
  return capCheap && v.cheap ? (Math.min(v.q, 1) as RhymeQuality) : v.q;
}

export const QUALITY_LABEL: Record<RhymeQuality, string> = {
  0: 'brak rymu',
  1: 'asonans',
  2: 'czysty',
  3: 'dwusylabowy',
};
