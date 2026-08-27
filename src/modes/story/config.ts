import { STORY_TOPICS, randomTopic as pickTopic, topicWords } from '@/wordbank/pl/story-topics';
import { loadLevel } from '@/wordbank/loader';

/** How often a generated keyword comes from the topic's own vocabulary. */
export const THEMED_RATIO = 0.6;

export const TOPIC_COUNT = STORY_TOPICS.length;

export type StoryConfig = {
  /** 'pick' = user typed a topic now; 'auto' = drawn when the exercise starts */
  topicMode: 'pick' | 'auto';
  topic: string;
  /** 'own' = user writes keywords during the exercise; 'auto' = drawn from the bank */
  wordsMode: 'own' | 'auto';
  slots: number;
  level: number;
  barsPerKeyword: number;
  memorizeSec: number;
  /** seconds allowed for writing own keywords; 0 = no limit */
  writeLimitSec: number;
};

export const defaultStoryConfig: StoryConfig = {
  topicMode: 'auto',
  topic: '',
  wordsMode: 'auto',
  slots: 8,
  level: 3,
  barsPerKeyword: 4,
  memorizeSec: 10,
  writeLimitSec: 0,
};

export const SLOT_CHOICES = [4, 6, 8, 10];

export function randomTopic(): string {
  return pickTopic().text;
}

function shuffled(words: string[]): string[] {
  return [...words].sort(() => Math.random() - 0.5);
}

/**
 * Keywords for a round. Each slot is drawn from the topic's own word bank with
 * `THEMED_RATIO` probability and from the level bank otherwise, so the set is
 * recognisably about the topic without being predictable. Falls back to the
 * other source when one runs dry, and never repeats a word.
 */
export function drawKeywords(level: number, count: number, topic?: string): string[] {
  const levelPool = shuffled(loadLevel('pl', level).map((w) => w.text));
  const themedPool = shuffled(topic ? topicWords(topic) : []);
  const used = new Set<string>();

  const take = (pool: string[]): string | null => {
    while (pool.length) {
      const w = pool.pop()!;
      const key = w.toLowerCase();
      if (used.has(key)) continue;
      used.add(key);
      return w;
    }
    return null;
  };

  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const themedFirst = themedPool.length > 0 && Math.random() < THEMED_RATIO;
    const word = themedFirst
      ? take(themedPool) ?? take(levelPool)
      : take(levelPool) ?? take(themedPool);
    if (word) out.push(word);
  }
  return out;
}
