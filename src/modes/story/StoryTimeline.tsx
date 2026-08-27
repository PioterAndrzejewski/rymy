import { useEffect, useRef } from 'react';
import { Box, Group, Paper, Text } from '@mantine/core';

export type BarKind = 'intro' | 'empty' | 'word';
export type StoryBar = { index: number; kind: BarKind; keywordIndex?: number; word?: string };

export function buildStoryPlan(
  keywords: string[], introBars: number, barsPerKeyword: number,
): StoryBar[] {
  const bars: StoryBar[] = [];
  for (let b = 0; b < introBars; b++) bars.push({ index: b, kind: 'intro' });
  for (let i = 0; i < keywords.length; i++) {
    for (let k = 0; k < barsPerKeyword; k++) {
      const idx = introBars + i * barsPerKeyword + k;
      const isCue = k === 0; // the word lands on the first bar of its group
      bars.push({
        index: idx,
        kind: isCue ? 'word' : 'empty',
        keywordIndex: isCue ? i : undefined,
        word: isCue ? keywords[i] : undefined,
      });
    }
  }
  return bars;
}

export function StoryTimeline({
  plan, currentBar, barPhase, hidden = false,
}: { plan: StoryBar[]; currentBar: number; barPhase: number; hidden?: boolean }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLElement>(`[data-bar="${currentBar}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentBar]);

  return (
    <Paper withBorder p="sm" radius="md">
      <Group gap="md" mb={8}>
        <Legend kind="intro" label="intro" />
        <Legend kind="empty" label="rozwijasz" />
        <Legend kind="word" label="nowe słowo" />
      </Group>
      <Box ref={scrollerRef} style={{ overflowX: 'auto' }}>
        <Group gap={4} wrap="nowrap" style={{ minWidth: 'min-content' }}>
          {plan.map((b) => {
            const isCurrent = b.index === currentBar;
            return (
              <Box
                key={b.index}
                data-bar={b.index}
                style={{
                  position: 'relative',
                  minWidth: 76,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: `1px solid ${
                    isCurrent ? 'var(--mantine-color-brand-5)'
                      : b.kind === 'word' ? 'var(--mantine-color-brand-9)'
                      : 'var(--mantine-color-dark-5)'
                  }`,
                  background:
                    b.kind === 'word' ? 'rgba(243, 184, 29, 0.12)'
                      : b.kind === 'intro' ? 'rgba(26, 128, 224, 0.12)'
                      : 'rgba(255,255,255,0.02)',
                  opacity: b.index < currentBar ? 0.4 : 1,
                  transition: 'opacity 200ms ease, border-color 200ms ease',
                }}
              >
                <Text size="10px" c="dimmed" ta="center">{b.index + 1}</Text>
                <Text
                  size="sm" ta="center"
                  fw={b.kind === 'word' ? 700 : 400}
                  c={b.kind === 'word' ? 'brand.2' : b.kind === 'intro' ? 'accent.3' : 'dimmed'}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {b.kind === 'intro' ? 'intro'
                    : b.kind === 'word'
                      ? (hidden ? `#${(b.keywordIndex ?? 0) + 1}` : b.word || '—')
                      : '·'}
                </Text>
                {isCurrent && (
                  <Box style={{
                    position: 'absolute', left: 0, bottom: 0, height: 2,
                    width: `${Math.min(100, Math.max(0, barPhase * 100))}%`,
                    background: 'var(--mantine-color-brand-4)',
                  }} />
                )}
              </Box>
            );
          })}
        </Group>
      </Box>
    </Paper>
  );
}

function Legend({ kind, label }: { kind: BarKind; label: string }) {
  const bg =
    kind === 'word' ? 'var(--mantine-color-brand-5)'
      : kind === 'empty' ? 'var(--mantine-color-dark-4)'
      : 'var(--mantine-color-accent-6)';
  return (
    <Group gap={5}>
      <Box w={10} h={10} style={{ background: bg, borderRadius: 2 }} />
      <Text size="10px" c="dimmed">{label}</Text>
    </Group>
  );
}
