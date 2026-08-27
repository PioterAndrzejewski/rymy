import type { Word } from '@/types';
import l1 from './pl/level-1.json';
import l2 from './pl/level-2.json';
import l3 from './pl/level-3.json';
import l4 from './pl/level-4.json';
import l5 from './pl/level-5.json';

type LevelFile = { level: number; language: string; words: Word[] };

const files: LevelFile[] = [l1 as LevelFile, l2 as LevelFile, l3 as LevelFile, l4 as LevelFile, l5 as LevelFile];

// Cumulative: level N = union of files 1..N (deduped by text).
export function loadLevel(language: 'pl', level: number): Word[] {
  const seen = new Set<string>();
  const out: Word[] = [];
  for (const f of files) {
    if (f.language !== language) continue;
    if (f.level > level) break;
    for (const w of f.words) {
      if (seen.has(w.text)) continue;
      seen.add(w.text);
      out.push(w);
    }
  }
  return out;
}

export const MAX_LEVEL = files.length;
