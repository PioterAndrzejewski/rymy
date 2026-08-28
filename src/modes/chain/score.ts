/**
 * Cztery paski zamiast jednej liczby.
 *
 * Jedna liczba niczego nie uczy: „62" nie mówi, czy było za wolno, czy za
 * płytko. Każdy pasek pokazuje jedną rzecz, którą można poprawić osobno, a
 * poziom zalicza się dopiero wtedy, gdy żaden z nich nie leży — cztery
 * przeciętne paski nie mają udawać dobrej rundy.
 */

import { effectiveQuality } from '@/wordbank/pl/phonetics';
import {
  freshness, type ChainLink, type ChainProgress, type ChainScores,
} from '@/storage/chainProgress';
import { categoriesOf } from './words';
import { CHAIN_LEVELS, isFree, type ChainLevel } from './config';

/** Wynik ≥ 70 i żaden pasek poniżej 50. */
export const PASS_TOTAL = 70;
export const PASS_BAR = 50;

/** Wolny łańcuch nie ma budżetu czasu, więc tempo mierzymy do tej stawki. */
const FREE_TEMPO_SECONDS = 15;

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export type ChainReport = {
  scores: ChainScores;
  passed: boolean;
  /** ogniwa domknięte samodzielnie */
  own: ChainLink[];
  medianMs: number;
  /** kategorie, przez które przeszedł łańcuch */
  categories: string[];
  /** najdłuższa seria ogniw z rymem na wymaganym poziomie */
  combo: number;
};

export function scoreChain(
  links: ChainLink[],
  def: ChainLevel,
  progress: ChainProgress,
): ChainReport {
  const own = links.filter((l) => !l.auto);
  const honest = own.filter((l) => !l.weak);
  const free = isFree(def.level);
  const target = free ? Math.max(links.length, 1) : def.links;

  // Długość — ile ogniw domknąłeś sam.
  const length = clamp((own.length / target) * 100);

  // Tempo — mediana, nie średnia: jedno ogniwo, na którym się zaciąłeś,
  // nie ma przekreślać całej rundy.
  const medianMs = median(own.map((l) => l.ms));
  const budgetMs = (free ? FREE_TEMPO_SECONDS : def.seconds) * 1000;
  const tempo = own.length ? clamp(100 * (1 - medianMs / (2 * budgetMs))) : 0;

  // Jakość — jakie to były rymy. Tani rym z sufitem tam, gdzie poziom go tnie.
  const qs = own.map<number>((l) => effectiveQuality({ q: l.q, cheap: l.cheap }, def.capCheap));
  const quality = qs.length ? clamp((qs.reduce((a, b) => a + b, 0) / qs.length / 3) * 100) : 0;

  // Rozrzut — czy łańcuch szedł, czy krążył wokół pierwszego słowa.
  const cats = new Set<string>();
  for (const l of honest) {
    for (const c of [...categoriesOf(l.assoc), ...categoriesOf(l.rhyme)]) cats.add(c);
  }
  const wanted = Math.min(6, Math.max(2, Math.round(target / 2)));
  const variety = Math.min(1, cats.size / wanted);

  const words = honest.flatMap((l) => [l.assoc, l.rhyme]);
  const freshRaw = words.length
    ? words.reduce((n, w) => n + freshness(w, progress), 0) / words.length
    : 0;
  // Na ostatnim poziomie świeżość liczy się ostro: powtarzanie tych samych
  // dwudziestu słów przestaje się opłacać.
  const fresh = def.strictFresh ? freshRaw * freshRaw : freshRaw;
  const spread = honest.length ? clamp((0.5 * variety + 0.5 * fresh) * 100) : 0;

  const total = Math.round((length + tempo + quality + spread) / 4);
  const bars = [length, tempo, quality, spread];
  const passed = !free && total >= PASS_TOTAL && bars.every((b) => b >= PASS_BAR);

  // Combo: ogniwa z rymem na wymaganym poziomie, jedno po drugim.
  let combo = 0;
  let run = 0;
  for (const l of links) {
    const q = effectiveQuality({ q: l.q, cheap: l.cheap }, def.capCheap);
    if (!l.auto && q >= def.minQ) { run++; combo = Math.max(combo, run); }
    else run = 0;
  }

  return {
    scores: { length, tempo, quality, spread, total },
    passed,
    own,
    medianMs,
    categories: [...cats],
    combo,
  };
}

export const BAR_LABEL: Record<keyof Omit<ChainScores, 'total'>, string> = {
  length: 'Długość',
  tempo: 'Tempo',
  quality: 'Jakość',
  spread: 'Rozrzut',
};

export const BAR_HINT: Record<keyof Omit<ChainScores, 'total'>, string> = {
  length: 'ile ogniw domknąłeś sam',
  tempo: 'jak szybko przychodziły',
  quality: 'jakie to były rymy',
  spread: 'czy łańcuch szedł, czy krążył',
};

/** Co konkretnie nie wyszło — pasek nazwany po tym, co się z nim stało. */
const WEAKNESS: Record<keyof typeof BAR_LABEL, string> = {
  length: 'łańcuch skończył się za wcześnie',
  tempo: 'ogniwa przychodziły za wolno',
  quality: 'rymy były za płytkie',
  spread: 'łańcuch krążył wokół jednego miejsca',
};

/** Werdykt jest zdaniem, nie fanfarą. */
export function verdict(report: ChainReport, links: ChainLink[], def: ChainLevel): string {
  const firstAuto = links.findIndex((l) => l.auto);
  if (isFree(def.level)) {
    return links.length
      ? `Łańcuch ma ${links.length} ${links.length === 1 ? 'ogniwo' : 'ogniw'}, ${report.own.length} z nich twoje.`
      : 'Łańcuch się nie zaczął.';
  }
  if (report.passed) return 'Poziom zaliczony — łańcuch trzymał się do końca.';
  if (firstAuto >= 0) return `Łańcuch trzymał się do ${firstAuto + 1}. ogniwa.`;
  const worst = (Object.keys(BAR_LABEL) as (keyof typeof BAR_LABEL)[])
    .reduce((a, b) => (report.scores[a] <= report.scores[b] ? a : b));
  return `Cały łańcuch twój, ale ${WEAKNESS[worst]}.`;
}

/** „z **kota** doszedłeś do **wolności** w 12 krokach" — bez pogrubień. */
export function pathSentence(seed: string, links: ChainLink[]): string {
  if (!links.length) return `Zostałeś przy słowie „${seed}".`;
  const last = links[links.length - 1].assoc;
  return `Z „${seed}" doszedłeś do „${last}" w ${links.length} ${links.length === 1 ? 'kroku' : 'krokach'}.`;
}

/**
 * „Program": pierwszy poziom, którego jeszcze nie zaliczyłeś na ≥ 70.
 * Nie przeskakujemy dalej niż o jeden ponad to, co masz zrobione.
 */
export function suggestLevel(progress: ChainProgress): number {
  for (const l of CHAIN_LEVELS) {
    const best = progress.best[l.level];
    if (!best || best.total < PASS_TOTAL) return l.level;
  }
  return CHAIN_LEVELS[CHAIN_LEVELS.length - 1].level;
}
