import { useMemo, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Collapse, Group, Paper, Progress as ProgressBar,
  SimpleGrid, Stack, Text, Tooltip, UnstyledButton,
} from '@mantine/core';
import {
  IconAlertTriangle, IconChevronDown, IconPlus, IconRotateClockwise, IconSparkles,
  IconTrash, IconX,
} from '@tabler/icons-react';
import {
  clearProgress, forgetOwnWord, loadProgress, type Progress,
} from '@/storage/rhymeProgress';
import { allReports, dueWords, knownWords, lapsedWords, totals, type EndingReport } from './review';

type Props = {
  /** ćwicz tę rodzinę teraz */
  onPractice: (ending: string) => void;
};

/**
 * Twój program: gdzie jesteś w każdej rodzinie, co wraca do powtórki i jakie
 * własne rymy dopisałeś. Wszystko z localStorage — czytamy przy każdym
 * otwarciu, bo panel żyje obok rund, nie w ich trakcie.
 */
export function ProgressPanel({ onPractice }: Props) {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [openEnding, setOpenEnding] = useState<string | null>(null);

  const reports = useMemo(() => allReports(progress), [progress]);
  const sum = useMemo(() => totals(reports), [reports]);

  // Najsłabsze na górze — to jest kolejność, w jakiej program je podsunie.
  const ranked = useMemo(
    () => [...reports].sort((a, b) => {
      if ((a.rounds === 0) !== (b.rounds === 0)) return a.rounds === 0 ? -1 : 1;
      return a.pct - b.pct;
    }),
    [reports],
  );

  if (sum.rounds === 0) {
    return (
      <Paper withBorder p="xl" radius="md" ta="center">
        <Stack gap="xs" align="center">
          <Text fw={700} size="lg">Jeszcze pusto</Text>
          <Text c="dimmed" size="sm" maw={420}>
            Zrób pierwszą rundę — od tego momentu zapisujemy, które rymy wychodzą
            ci same, a które musimy ci przypominać. Wszystko zostaje w tej przeglądarce.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md" className="rymy-fade-up">
      <SimpleGrid cols={{ base: 2, sm: 5 }} spacing="sm">
        <Stat label="Rymy w banku" value={`${sum.known}`} hint={`z ${sum.core} w trzonie`} accent />
        <Stat label="Na pewno" value={`${sum.mastered}`} hint="wpisane ≥ 2 razy" />
        <Stat label="Wypadły ci" value={`${sum.lapsed}`} hint="umiałeś, nie użyłeś" />
        <Stat label="Do powtórki" value={`${sum.due}`} hint="pokazane, nie wpisane" />
        <Stat label="Twoje słowa" value={`${sum.own}`} hint="spoza naszego słownika" />
      </SimpleGrid>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={700}>Rodziny rymów</Text>
          <Text size="xs" c="dimmed">{sum.touched} / {reports.length} ruszonych · {sum.rounds} rund</Text>
        </Group>
        <Stack gap={6}>
          {ranked.map((r) => (
            <EndingRow
              key={r.ending}
              report={r}
              progress={progress}
              open={openEnding === r.ending}
              onToggle={() => setOpenEnding((cur) => (cur === r.ending ? null : r.ending))}
              onPractice={() => onPractice(r.ending)}
              onForget={(w) => setProgress(forgetOwnWord(r.ending, w))}
            />
          ))}
        </Stack>
      </Paper>

      <Group justify="center">
        <Button
          size="xs" variant="subtle" color="gray" leftSection={<IconTrash size={14} />}
          onClick={() => {
            if (!window.confirm('Skasować całą historię ćwiczeń? Tego nie da się cofnąć.')) return;
            clearProgress();
            setProgress(loadProgress());
          }}
        >
          Wyczyść postęp
        </Button>
      </Group>
    </Stack>
  );
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <Paper withBorder p="md" radius="md" bg="rgba(255,255,255,0.02)">
      <Text size="10px" tt="uppercase" lts={0.8} c="dimmed">{label}</Text>
      <Text size="28px" fw={800} c={accent ? 'brand.3' : undefined} lh={1.2}>{value}</Text>
      <Text size="xs" c="dimmed">{hint}</Text>
    </Paper>
  );
}

function EndingRow({
  report: r, progress, open, onToggle, onPractice, onForget,
}: {
  report: EndingReport;
  progress: Progress;
  open: boolean;
  onToggle: () => void;
  onPractice: () => void;
  onForget: (word: string) => void;
}) {
  const due = useMemo(() => (open ? dueWords(r.ending, progress) : []), [open, r.ending, progress]);
  const lapsed = useMemo(() => (open ? lapsedWords(r.ending, progress) : []), [open, r.ending, progress]);
  const known = useMemo(() => (open ? knownWords(r.ending, progress) : []), [open, r.ending, progress]);
  const own = progress.own[r.ending] ?? [];

  return (
    <Paper withBorder p="sm" radius="md" bg="rgba(255,255,255,0.02)">
      <UnstyledButton onClick={onToggle} style={{ width: '100%' }}>
        <Group justify="space-between" wrap="nowrap" gap="xs">
          <Group gap={8} wrap="nowrap" style={{ minWidth: 0 }}>
            <Badge size="lg" variant={r.rounds ? 'light' : 'outline'} color={r.rounds ? 'brand' : 'gray'}>
              -{r.ending}
            </Badge>
            <Text size="sm" c="dimmed" truncate>
              {r.rounds === 0 ? 'nieruszona' : `${r.known} / ${r.coreSize}`}
            </Text>
          </Group>
          <Group gap={6} wrap="nowrap">
            {r.lapsed > 0 && (
              <Tooltip label="umiałeś je, a ostatnio ci wypadły" withArrow>
                <Badge size="sm" variant="light" color="red" leftSection={<IconAlertTriangle size={10} />}>
                  {r.lapsed}
                </Badge>
              </Tooltip>
            )}
            {r.due > 0 && (
              <Tooltip label="słowa czekające na powtórkę" withArrow>
                <Badge size="sm" variant="light" color="orange" leftSection={<IconRotateClockwise size={10} />}>
                  {r.due}
                </Badge>
              </Tooltip>
            )}
            {r.own > 0 && (
              <Tooltip label="twoje słowa spoza słownika" withArrow>
                <Badge size="sm" variant="light" color="accent" leftSection={<IconPlus size={10} />}>
                  {r.own}
                </Badge>
              </Tooltip>
            )}
            <IconChevronDown
              size={16}
              style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 180ms ease', flexShrink: 0 }}
            />
          </Group>
        </Group>
      </UnstyledButton>

      <ProgressBar value={r.pct * 100} color={r.rounds ? 'brand' : 'dark.4'} size="xs" mt={8} />

      <Collapse in={open}>
        <Stack gap="sm" mt="md">
          {lapsed.length > 0 && (
            <WordList
              title="Wypadły ci"
              hint="umiałeś je wcześniej, a przy ostatnim podejściu ich nie użyłeś"
              words={lapsed}
              color="red"
            />
          )}
          {due.length > 0 && (
            <WordList
              title="Do zapamiętania"
              hint="pokazaliśmy ci je, a wciąż nie wychodzą same"
              words={due}
              color="orange"
            />
          )}
          {own.length > 0 && (
            <WordList
              title="Twoje rymy"
              hint="nie ma ich w naszym słowniku — dopisałeś je sam"
              words={own}
              color="accent"
              onRemove={onForget}
            />
          )}
          {known.length > 0 && (
            <WordList
              title="Masz je"
              hint={`${r.mastered} wpisane co najmniej dwa razy`}
              words={known}
              color="brand"
              icon
            />
          )}
          <Group justify="space-between" gap="xs">
            <Text size="xs" c="dimmed">
              {r.rounds === 0
                ? `${r.coreSize} słów w trzonie, ${r.bankSize} w całej rodzinie`
                : `${r.rounds} ${r.rounds === 1 ? 'runda' : 'rund'} · rekord ${r.best}`}
            </Text>
            <Button size="xs" variant="light" color="brand" onClick={onPractice}>
              Ćwicz -{r.ending}
            </Button>
          </Group>
        </Stack>
      </Collapse>
    </Paper>
  );
}

function WordList({
  title, hint, words, color, icon, onRemove,
}: {
  title: string;
  hint: string;
  words: string[];
  color: string;
  icon?: boolean;
  onRemove?: (w: string) => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? words : words.slice(0, 24);

  return (
    <Box>
      <Text size="xs" fw={700}>{title} <Text span c="dimmed" fw={400}>· {words.length}</Text></Text>
      <Text size="10px" c="dimmed" mb={6}>{hint}</Text>
      <Group gap={6} wrap="wrap">
        {shown.map((w) => (
          <Badge
            key={w} variant="light" color={color}
            leftSection={icon ? <IconSparkles size={10} /> : undefined}
            rightSection={onRemove ? (
              <ActionIcon size="xs" variant="transparent" c="inherit" onClick={() => onRemove(w)} aria-label={`Usuń ${w}`}>
                <IconX size={10} />
              </ActionIcon>
            ) : undefined}
          >
            {w}
          </Badge>
        ))}
      </Group>
      {words.length > shown.length && (
        <Button size="compact-xs" variant="subtle" color="gray" mt={6} onClick={() => setShowAll(true)}>
          Pokaż wszystkie ({words.length})
        </Button>
      )}
    </Box>
  );
}
