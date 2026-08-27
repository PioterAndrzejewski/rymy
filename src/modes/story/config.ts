import { STORY_TOPICS } from '@/wordbank/pl/story-topics';
import { loadLevel } from '@/wordbank/loader';

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
  return STORY_TOPICS[Math.floor(Math.random() * STORY_TOPICS.length)];
}

export function drawKeywords(level: number, count: number): string[] {
  const pool = loadLevel('pl', level);
  if (pool.length === 0) return Array.from({ length: count }, () => '');
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length].text);
}
