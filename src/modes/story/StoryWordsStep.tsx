import { useEffect, useState } from 'react';
import {
  Badge, Box, Button, Group, SegmentedControl, SimpleGrid, Stack, Text,
} from '@mantine/core';
import { IconBulb, IconPencil, IconRefresh, IconWand } from '@tabler/icons-react';
import { Section } from '@/components/wizard/StepShell';
import { ChoiceCard } from '@/components/wizard/ChoiceCard';
import { MAX_LEVEL } from '@/wordbank/loader';
import { useSession } from '@/state/session';
import { barsToTime } from '@/lib/format';
import { drawKeywords, SLOT_CHOICES, type StoryConfig } from './config';

type Props = {
  config: StoryConfig;
  patch: (p: Partial<StoryConfig>) => void;
};

const MEMORIZE_CHOICES = [5, 10, 15, 20, 30];
const BARS_CHOICES = [2, 4, 8];
const LIMIT_CHOICES = [0, 30, 60, 90];

export function StoryWordsStep({ config, patch }: Props) {
  const { track } = useSession();
  // Sample only — the real draw happens when the exercise starts.
  const [sample, setSample] = useState<string[]>(() => drawKeywords(config.level, 5));
  useEffect(() => { setSample(drawKeywords(config.level, 5)); }, [config.level]);

  const introBars = track?.introBars ?? 0;
  const totalBars = introBars + config.slots * config.barsPerKeyword;
  const beatsPerBar = track?.timeSignature[0] ?? 4;

  return (
    <Stack gap="md">
      <Section title="Skąd słowa klucze">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <ChoiceCard
            icon={<IconPencil size={20} />}
            title="Wpiszę własne"
            description="Przed startem zobaczysz temat i sam wpiszesz słowa, potem klikniesz „Gotowe”."
            selected={config.wordsMode === 'own'}
            onSelect={() => patch({ wordsMode: 'own' })}
          >
            <Box>
              <Text size="xs" c="dimmed" mb={6}>Czas na wpisanie</Text>
              <SegmentedControl
                size="xs"
                fullWidth
                value={String(config.writeLimitSec)}
                onChange={(v) => patch({ writeLimitSec: Number(v) })}
                data={LIMIT_CHOICES.map((n) => ({ value: String(n), label: n === 0 ? 'bez limitu' : `${n} s` }))}
              />
              {config.writeLimitSec > 0 && (
                <Text size="10px" c="dimmed" mt={6}>
                  Po upływie czasu puste pola uzupełnimy losowymi słowami z banku.
                </Text>
              )}
            </Box>
          </ChoiceCard>

          <ChoiceCard
            icon={<IconWand size={20} />}
            title="Wygeneruj automatycznie"
            description="Słowa wylosują się przy starcie — zobaczysz je dopiero w fazie zapamiętywania."
            selected={config.wordsMode === 'auto'}
            onSelect={() => patch({ wordsMode: 'auto' })}
          >
            <Stack gap="xs">
              <Box>
                <Text size="xs" c="dimmed" mb={6}>Poziom słów</Text>
                <SegmentedControl
                  size="xs"
                  fullWidth
                  value={String(config.level)}
                  onChange={(v) => patch({ level: Number(v) })}
                  data={Array.from({ length: MAX_LEVEL }, (_, i) => ({ value: String(i + 1), label: `L${i + 1}` }))}
                />
              </Box>
              <Group gap={6} wrap="wrap" align="center">
                <IconBulb size={14} color="var(--mantine-color-dimmed)" />
                <Text size="xs" c="dimmed">przykłady:</Text>
                {sample.map((w, i) => (
                  <Badge key={`${w}-${i}`} size="sm" variant="light" color="gray">{w}</Badge>
                ))}
                <Button
                  size="compact-xs" variant="subtle" color="gray"
                  leftSection={<IconRefresh size={12} />}
                  onClick={() => setSample(drawKeywords(config.level, 5))}
                >
                  inne
                </Button>
              </Group>
            </Stack>
          </ChoiceCard>
        </SimpleGrid>
      </Section>

      <Section
        title="Przebieg ćwiczenia"
        aside={
          <Group gap="xs">
            <Badge variant="light" color="gray">{totalBars} taktów</Badge>
            {track && <Badge variant="light" color="brand">≈ {barsToTime(totalBars, track.bpm, beatsPerBar)}</Badge>}
          </Group>
        }
      >
        <Stack gap="md">
          <Box>
            <Text size="sm" fw={500} mb={6}>Ile słów kluczy</Text>
            <Group gap="xs">
              {SLOT_CHOICES.map((n) => (
                <Button
                  key={n} size="sm"
                  variant={config.slots === n ? 'filled' : 'default'}
                  color="brand"
                  onClick={() => patch({ slots: n })}
                >
                  {n}
                </Button>
              ))}
            </Group>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={6}>Taktów na jedno słowo</Text>
            <Group gap="xs">
              {BARS_CHOICES.map((n) => (
                <Button
                  key={n} size="sm"
                  variant={config.barsPerKeyword === n ? 'filled' : 'default'}
                  color="brand"
                  onClick={() => patch({ barsPerKeyword: n })}
                >
                  {n} {n === 1 ? 'takt' : 'takty'}
                </Button>
              ))}
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Tyle czasu masz na rozwinięcie każdego słowa, zanim wejdzie następne.
            </Text>
          </Box>

          <Box>
            <Text size="sm" fw={500} mb={6}>Czas na zapamiętanie</Text>
            <Group gap="xs">
              {MEMORIZE_CHOICES.map((n) => (
                <Button
                  key={n} size="sm"
                  variant={config.memorizeSec === n ? 'filled' : 'default'}
                  color="brand"
                  onClick={() => patch({ memorizeSec: n })}
                >
                  {n} s
                </Button>
              ))}
            </Group>
            <Text size="xs" c="dimmed" mt={4}>
              Po tym czasie rusza odliczanie, a zaraz po nim podkład.
            </Text>
          </Box>
        </Stack>
      </Section>
    </Stack>
  );
}
