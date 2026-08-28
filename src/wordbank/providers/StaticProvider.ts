import type { Filter, Word, WordProvider } from '@/types';
import { loadLevel, MAX_LEVEL } from '../loader';
import { mulberry32, shuffleInPlace } from '../rng';

export class StaticProvider implements WordProvider {
  id = 'static-pl';

  async getWords({ count, seed, filter }: { count: number; seed: number; filter?: Filter }): Promise<Word[]> {
    const level = clamp(filter?.level ?? MAX_LEVEL, 1, MAX_LEVEL);
    let pool = loadLevel('pl', level);
    if (filter?.rhymeEnding) pool = pool.filter((w) => w.rhymeEnding === filter.rhymeEnding);
    if (filter?.pos) pool = pool.filter((w) => w.pos === filter.pos);
    if (filter?.topic) pool = pool.filter((w) => w.topics?.includes(filter.topic!));
    if (pool.length === 0) return [];

    const rng = mulberry32(seed);
    const out: Word[] = [];
    let bag: Word[] = [];
    while (out.length < count) {
      if (bag.length === 0) bag = shuffleInPlace([...pool], rng);
      out.push(bag.pop()!);
    }
    return out;
  }
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

export const staticProvider = new StaticProvider();
