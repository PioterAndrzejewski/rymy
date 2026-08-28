import { useMemo, useState } from 'react';
import {
  Badge, Button, Group, Paper, SimpleGrid, Stack, Text, Tooltip,
} from '@mantine/core';
import { IconArrowNarrowRight, IconRoute, IconTrash, IconTrophy } from '@tabler/icons-react';
import { clearChain, loadChain, type ChainProgress } from '@/storage/chainProgress';
import { categoryLabel } from './words';
import { levelDef, linkWord } from './config';

type Props = {
  progress: ChainProgress;
  onChange: (p: ChainProgress) => void;
  /** ćwicz od konkretnego słowa */
  onPractice: (word: string) => void;
};

/**
 * „Moje skojarzenia".
 *
 * `pairs` to nie statystyka, tylko twój prywatny słownik: z czego na co
 * skaczesz. Widać w nim, gdzie masz wydeptane ścieżki — a wydeptana ścieżka
 * w freestyle'u jest i zaletą (idzie szybko), i pułapką (idzie zawsze tam samo).
 */
export function PairsPanel({ progress, onChange, onPractice }: Props) {
  const [confirming, setConfirming] = useState(false);

  const pairs = useMemo(
    () => Object.entries(progress.pairs)
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'pl')),
    [progress.pairs],
  );

  const categories = useMemo(
    () => Object.entries(progress.categories).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [progress.categories],
  );

  const longest = useMemo(
    () => progress.runs.reduce<{ links: number; seed: string; last: string; level: number } | null>(
      (best, r) => (r.links.length > (best?.links ?? 0)
        ? { links: r.links.length, seed: r.seed, last: r.links.at(-1)?.assoc ?? r.seed, level: r.level }
        : best),
      null,
    ),
    [progress.runs],
  );

  const repeated = useMemo(
    () => Object.entries(progress.words).filter(([, n]) => n >= 3)
      .sort((a, b) => b[1] - a[1]).slice(0, 12),
    [progress.words],
  );

  if (!progress.runs.length) {
    return (
      <Paper withBorder p="xl" radius="md" ta="center">
        <Text c="dimmed">
          Jeszcze nie ma czego pokazać. Po pierwszym łańcuchu zbierze się tu twój
          słownik skojarzeń — z czego na co skaczesz.
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
        <Paper withBorder p="md" radius="md">
          <Text size="10px" tt="uppercase" lts={1} c="dimmed">łańcuchów</Text>
          <Text size="28px" fw={800}>{progress.runs.length}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Text size="10px" tt="uppercase" lts={1} c="dimmed">słów w słowniku</Text>
          <Text size="28px" fw={800}>{Object.keys(progress.words).length}</Text>
        </Paper>
        <Paper withBorder p="md" radius="md">
          <Group gap={6} mb={2}>
            <IconTrophy size={13} color="var(--mantine-color-brand-4)" />
            <Text size="10px" tt="uppercase" lts={1} c="dimmed">najdłuższy</Text>
          </Group>
          {longest ? (
            <>
              <Text size="28px" fw={800}>{longest.links}</Text>
              <Text size="xs" c="dimmed">
                {linkWord(longest.links)} · {longest.seed} → {longest.last}
                {' · '}{levelDef(longest.level).label}
              </Text>
            </>
          ) : (
            <Text size="28px" fw={800}>—</Text>
          )}
        </Paper>
      </SimpleGrid>

      {categories.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="sm">
            Gdzie chodzą twoje łańcuchy
          </Text>
          <Group gap={6} wrap="wrap">
            {categories.map(([id, n]) => (
              <Badge key={id} size="lg" variant="light" color="gray" rightSection={<Text span size="10px">{n}</Text>}>
                {categoryLabel(id)}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}

      <Paper withBorder p="md" radius="md">
        <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb={4}>
          Twój słownik skojarzeń
        </Text>
        <Text size="xs" c="dimmed" mb="sm">
          Kliknij słowo, żeby zacząć od niego następny łańcuch.
        </Text>
        <Stack gap={6}>
          {pairs.slice(0, 30).map(([word, to]) => (
            <Group key={word} gap={6} wrap="wrap">
              <Tooltip label={`Zacznij łańcuch od „${word}"`} withArrow>
                <Badge
                  size="lg" variant="outline" color="brand"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPractice(word)}
                  leftSection={<IconRoute size={11} />}
                >
                  {word}
                </Badge>
              </Tooltip>
              <IconArrowNarrowRight size={14} opacity={0.5} />
              {to.map((w) => (
                <Badge key={w} size="lg" variant="light" color="gray">{w}</Badge>
              ))}
            </Group>
          ))}
        </Stack>
        {pairs.length > 30 && (
          <Text size="xs" c="dimmed" mt="sm">…i jeszcze {pairs.length - 30} słów.</Text>
        )}
      </Paper>

      {repeated.length > 0 && (
        <Paper withBorder p="md" radius="md">
          <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb={4}>
            Wracają najczęściej
          </Text>
          <Text size="xs" c="dimmed" mb="sm">
            Te słowa przestają dokładać do paska „Rozrzut" — im częściej wracają,
            tym mniej są warte.
          </Text>
          <Group gap={6} wrap="wrap">
            {repeated.map(([w, n]) => (
              <Badge key={w} size="lg" variant="light" color="gray" rightSection={<Text span size="10px">×{n}</Text>}>
                {w}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}

      <Group justify="end">
        {confirming ? (
          <Group gap="xs">
            <Text size="xs" c="dimmed">Skasować całą historię łańcuchów?</Text>
            <Button
              size="xs" color="red"
              onClick={() => { clearChain(); onChange(loadChain()); setConfirming(false); }}
            >
              Tak, kasuj
            </Button>
            <Button size="xs" variant="subtle" color="gray" onClick={() => setConfirming(false)}>
              Zostaw
            </Button>
          </Group>
        ) : (
          <Button
            size="xs" variant="subtle" color="gray"
            leftSection={<IconTrash size={14} />}
            onClick={() => setConfirming(true)}
          >
            Wyczyść historię
          </Button>
        )}
      </Group>
    </Stack>
  );
}
