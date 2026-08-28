import { useState } from 'react';
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core';
import { IconArrowNarrowRight, IconCheck, IconThumbDown } from '@tabler/icons-react';
import type { ChainLink } from '@/storage/chainProgress';
import { QualityDots } from './ChainStrip';

type Props = {
  seed: string;
  links: ChainLink[];
  onDone: (marked: ChainLink[]) => void;
  onSkip: () => void;
};

/**
 * Szczery przegląd — to zastępuje ocenę semantyki.
 *
 * Nie mamy modelu skojarzeń i nie będziemy udawać, że mamy: sędzią jesteś ty.
 * Skreślone ogniwa lecą z paska „Rozrzut" i zapisują się jako `weak`, a my
 * liczymy, ile razy sam postawiłeś sobie minus. To też jest wynik — i uczciwszy
 * niż zgadywanie modelem.
 */
export function HonestReview({ seed, links, onDone, onSkip }: Props) {
  const [weak, setWeak] = useState<Set<number>>(new Set());

  const toggle = (i: number) => setWeak((s) => {
    const next = new Set(s);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <Stack gap="md" my="md" className="rymy-fade-up">
      <Paper withBorder p={{ base: 'md', sm: 'lg' }} radius="md">
        <Text style={{ fontSize: 'clamp(20px, 6vw, 26px)', fontWeight: 800 }}>
          Szczery przegląd
        </Text>
        <Text c="dimmed" size="sm" mt={4}>
          Rym oceniła maszyna. Skojarzenia oceniasz sam — zaznacz te, które były
          naciągane. Nikt tego nie zobaczy, ale twój pasek „Rozrzut" tak.
        </Text>
      </Paper>

      <Stack gap={6}>
        {links.map((l, i) => {
          const marked = weak.has(i);
          return (
            <Paper
              key={`${l.assoc}-${i}`}
              withBorder p="sm" radius="md"
              style={{
                opacity: l.auto ? 0.55 : 1,
                borderColor: marked ? 'var(--mantine-color-red-7)' : undefined,
                background: marked ? 'rgba(255,90,90,0.06)' : 'rgba(255,255,255,0.02)',
              }}
            >
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Group gap={6} wrap="wrap">
                  <Text size="sm" c="dimmed">{i === 0 ? seed : l.from}</Text>
                  <IconArrowNarrowRight size={14} opacity={0.5} />
                  <Text size="sm" fw={600} td={marked ? 'line-through' : undefined}>{l.assoc}</Text>
                  <IconArrowNarrowRight size={14} opacity={0.5} />
                  <Text size="sm" fw={700} c="brand.3">{l.rhyme}</Text>
                  <QualityDots q={l.q} cheap={l.cheap} />
                  {l.auto && <Badge size="xs" variant="light" color="gray">nasze</Badge>}
                </Group>
                {!l.auto && (
                  <Button
                    size="compact-sm"
                    variant={marked ? 'filled' : 'subtle'}
                    color={marked ? 'red' : 'gray'}
                    leftSection={<IconThumbDown size={13} />}
                    onClick={() => toggle(i)}
                  >
                    {marked ? 'naciągane' : 'to było naciągane'}
                  </Button>
                )}
              </Group>
            </Paper>
          );
        })}
      </Stack>

      <Group justify="space-between" wrap="wrap" gap="xs">
        <Button variant="subtle" color="gray" onClick={onSkip}>Pomiń przegląd</Button>
        <Group gap="xs">
          {weak.size > 0 && (
            <Text size="xs" c="dimmed">
              {weak.size} {weak.size === 1 ? 'skreślone ogniwo' : 'skreślonych ogniw'}
            </Text>
          )}
          <Button
            color="brand" rightSection={<IconCheck size={16} />}
            onClick={() => onDone(links.map((l, i) => (weak.has(i) ? { ...l, weak: true } : l)))}
          >
            Pokaż wynik
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
