import { useMemo } from 'react';
import {
  Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Text,
} from '@mantine/core';
import {
  IconArrowNarrowRight, IconBolt, IconCheck, IconRefresh, IconSettings, IconTrophy, IconX,
} from '@tabler/icons-react';
import { fmtTime } from '@/lib/format';
import {
  levelReport, scoreSlots, type PalaceProgress,
} from '@/storage/palaceProgress';
import { roomsFor } from './rooms';
import { levelDef } from './config';

type Props = {
  level: number;
  words: string[];
  answers: string[];
  recallMs: number;
  progress: PalaceProgress | null;
  distractionsSolved: number;
  distractionsTotal: number;
  onRepeatSame: () => void;
  onNewSet: () => void;
  onExit: () => void;
};

/**
 * Cała informacja zwrotna jest tutaj — pokój po pokoju, plus porównanie
 * z tym, jak ci szło wcześniej. To jest jedyny moment, w którym mówimy,
 * co było źle.
 */
export function PalaceSummary({
  level, words, answers, recallMs, progress, distractionsSolved, distractionsTotal,
  onRepeatSame, onNewSet, onExit,
}: Props) {
  const slots = useMemo(() => scoreSlots(words, answers), [words, answers]);
  const rooms = roomsFor(words.length);
  const exact = slots.filter((s) => s.exact).length;
  const misplaced = slots.filter((s) => s.misplaced).length;
  const msPerWord = Math.round(recallMs / (words.length || 1));

  // Ta runda już siedzi w historii, więc „poprzednia" to przedostatnia.
  const runsHere = (progress?.runs ?? []).filter((r) => r.level === level);
  const previous = runsHere.at(-2);
  const report = progress ? levelReport(level, progress) : null;
  const best = report?.best;
  // Rekord liczymy względem tego, co było PRZED tą rundą — `best` w progresie
  // zawiera już ten wynik, więc sam z siebie zawsze by się zgadzał.
  const prevBest = runsHere.slice(0, -1).reduce((n, r) => Math.max(n, r.exact), 0);
  const isRecord = exact > 0 && exact > prevBest;

  const deltaExact = previous ? exact - previous.exact : null;
  const deltaMs = previous ? msPerWord - previous.msPerWord : null;

  return (
    <Stack gap="md" my="md">
      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" className="rymy-fade-up" ta="center">
        <Stack gap="md" align="center">
          <Text style={{ fontSize: 'clamp(22px, 7vw, 30px)', fontWeight: 800 }}>
            {exact === words.length ? 'Cały pałac odzyskany 🏛' : 'Koniec trasy'}
          </Text>
          <Text style={{ fontSize: 'clamp(52px, 16vw, 72px)', fontWeight: 800 }} c="brand.3">
            {exact} / {words.length}
          </Text>
          <Text size="sm" c="dimmed" mt={-12}>słów na właściwym miejscu</Text>

          <Group gap="xs" justify="center">
            {misplaced > 0 && (
              <Badge size="lg" variant="light" color="accent">
                {misplaced} w złym pokoju
              </Badge>
            )}
            <Badge size="lg" variant="light" color="gray">
              {fmtTime(recallMs)} · {(msPerWord / 1000).toFixed(1)} s na słowo
            </Badge>
            {distractionsTotal > 0 && (
              <Badge size="lg" variant="light" color="gray">
                rymy: {distractionsSolved}/{distractionsTotal}
              </Badge>
            )}
            {isRecord && (
              <Badge size="lg" variant="filled" color="brand" leftSection={<IconTrophy size={12} />}>
                rekord poziomu
              </Badge>
            )}
          </Group>

          {previous && (
            <Group gap="lg" justify="center">
              <Delta
                label="względem poprzedniej rundy"
                value={deltaExact ?? 0}
                suffix=" słowa"
                betterWhenHigher
              />
              <Delta
                label="tempo"
                value={Math.round((deltaMs ?? 0) / 100) / 10}
                suffix=" s na słowo"
                betterWhenHigher={false}
              />
            </Group>
          )}
        </Stack>
      </Paper>

      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="sm">Pokój po pokoju</Text>
        <Stack gap={6}>
          {slots.map((s, i) => (
            <Group
              key={i}
              justify="space-between"
              wrap="nowrap"
              gap="sm"
              p="xs"
              style={{
                borderRadius: 8,
                border: '1px solid var(--mantine-color-dark-5)',
                background: s.exact
                  ? 'rgba(74, 160, 106, 0.10)'
                  : s.misplaced
                    ? 'rgba(243, 184, 29, 0.08)'
                    : 'rgba(255,255,255,0.02)',
              }}
            >
              <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                <Badge size="sm" variant="light" color="gray" style={{ flexShrink: 0 }}>{i + 1}</Badge>
                <Text size="sm" c="dimmed" lineClamp={1} style={{ minWidth: 0 }}>
                  {rooms[i]?.prop} {rooms[i]?.name}
                </Text>
              </Group>
              <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
                {!s.exact && (
                  <>
                    <Text size="sm" c="dimmed" td="line-through" lineClamp={1}>
                      {s.answer || '—'}
                    </Text>
                    <IconArrowNarrowRight size={14} color="var(--mantine-color-dimmed)" />
                  </>
                )}
                <Text size="sm" fw={700} c={s.exact ? 'green.4' : 'brand.3'} lineClamp={1}>
                  {s.expected}
                </Text>
                {s.exact
                  ? <IconCheck size={16} color="var(--mantine-color-green-4)" />
                  : s.misplaced
                    ? <Badge size="xs" variant="light" color="accent">zła kolejność</Badge>
                    : <IconX size={16} color="var(--mantine-color-dark-2)" />}
              </Group>
            </Group>
          ))}
        </Stack>
      </Paper>

      {report && report.runs > 1 && (
        <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
          <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="sm">
            Poziom {level} — {levelDef(level).label}
          </Text>
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
            <Stat label="rundy" value={String(report.runs)} />
            <Stat label="rekord" value={`${best?.exact ?? 0} / ${words.length}`} />
            <Stat
              label="celność (5 ostatnich)"
              value={`${Math.round(report.recentAccuracy * 100)}%`}
            />
            <Stat
              label="najlepsze tempo"
              value={best?.msPerWord ? `${(best.msPerWord / 1000).toFixed(1)} s` : '—'}
            />
          </SimpleGrid>
          <Sparkline runs={runsHere.map((r) => r.exact / (r.words.length || 1))} />
        </Paper>
      )}

      <Stack gap="xs" w="100%" maw={360} mx="auto">
        <Button size="md" color="brand" leftSection={<IconRefresh size={16} />} onClick={onNewSet}>
          Jeszcze raz, nowe słowa
        </Button>
        <Button size="md" variant="light" color="brand" leftSection={<IconBolt size={16} />} onClick={onRepeatSame}>
          Powtórz ten sam zestaw
        </Button>
        <Button size="md" variant="subtle" color="gray" leftSection={<IconSettings size={16} />} onClick={onExit}>
          Zmień ustawienia
        </Button>
      </Stack>
    </Stack>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box
      style={{
        padding: '10px 12px', borderRadius: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--mantine-color-dark-5)',
      }}
    >
      <Text size="10px" tt="uppercase" lts={0.8} c="dimmed">{label}</Text>
      <Text size="lg" fw={700}>{value}</Text>
    </Box>
  );
}

function Delta({
  label, value, suffix, betterWhenHigher,
}: { label: string; value: number; suffix: string; betterWhenHigher: boolean }) {
  const better = betterWhenHigher ? value > 0 : value < 0;
  const same = value === 0;
  return (
    <Box ta="center">
      <Text size="10px" tt="uppercase" lts={0.8} c="dimmed">{label}</Text>
      <Text fw={700} c={same ? 'dimmed' : better ? 'green.4' : 'red.4'}>
        {same ? 'bez zmian' : `${value > 0 ? '+' : ''}${value}${suffix}`}
      </Text>
    </Box>
  );
}

/** Celność runda po rundzie — jedna linijka słupków, bez biblioteki. */
function Sparkline({ runs }: { runs: number[] }) {
  const shown = runs.slice(-12);
  if (shown.length < 2) return null;
  return (
    <Group gap={3} align="end" h={44} mt="sm" wrap="nowrap">
      {shown.map((v, i) => (
        <Box
          key={i}
          style={{
            flex: 1,
            height: `${Math.max(6, v * 100)}%`,
            borderRadius: 3,
            background: i === shown.length - 1
              ? 'var(--mantine-color-brand-5)'
              : 'var(--mantine-color-dark-4)',
          }}
        />
      ))}
    </Group>
  );
}
