import { useEffect, useRef, useState } from 'react';
import {
  Badge, Box, Button, Group, Paper, RingProgress, SimpleGrid, Stack, Text, TextInput,
} from '@mantine/core';
import { IconBulb, IconCheck, IconEraser, IconX } from '@tabler/icons-react';
import { useCountdown } from '@/lib/useCountdown';
import { drawKeywords } from './config';

/* ------------------------------------------------------------------ write */

type WriterProps = {
  topic: string;
  slots: number;
  level: number;
  limitSec: number;
  onDone: (keywords: string[]) => void;
  onAbort: () => void;
};

/**
 * "Zobacz temat → wpisz słowa klucze → Gotowe". With an optional clock; when it
 * runs out, empty slots are filled from the bank so the exercise still starts.
 */
export function KeywordWriter({ topic, slots, level, limitSec, onDone, onAbort }: WriterProps) {
  const [words, setWords] = useState<string[]>(() => Array.from({ length: slots }, () => ''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => { refs.current[0]?.focus(); }, []);

  function finish(current = wordsRef.current) {
    const filled = current.map((w) => w.trim());
    const missing = filled.some((w) => !w);
    const backup = missing ? drawKeywords(level, slots) : [];
    onDone(filled.map((w, i) => w || backup[i] || `słowo ${i + 1}`));
  }

  const remaining = useCountdown(limitSec * 1000, limitSec > 0, () => finish());
  const pct = limitSec > 0 ? Math.min(100, (1 - remaining / (limitSec * 1000)) * 100) : 0;

  function set(i: number, v: string) {
    setWords((ws) => ws.map((x, k) => (k === i ? v : x)));
  }
  function hint() {
    const i = words.findIndex((w) => !w.trim());
    if (i < 0) return;
    const taken = new Set(words.map((w) => w.trim().toLowerCase()).filter(Boolean));
    const candidate = drawKeywords(level, slots + 5).find((w) => !taken.has(w.toLowerCase()));
    if (!candidate) return;
    set(i, candidate);
    refs.current[Math.min(i + 1, slots - 1)]?.focus();
  }

  const allFilled = words.every((w) => w.trim().length > 0);
  const filledCount = words.filter((w) => w.trim()).length;

  return (
    <Stack gap="md" className="rymy-fade-up">
      <Paper withBorder p="xl" radius="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Box>
            <Text size="xs" tt="uppercase" lts={1.5} c="dimmed">temat</Text>
            <Text size="34px" fw={800} lts="-0.02em" c="brand.2">{topic || '—'}</Text>
          </Box>
          {limitSec > 0 && (
            <RingProgress
              size={96} thickness={9}
              sections={[{ value: pct, color: remaining < 10000 ? 'red' : 'brand' }]}
              label={<Text ta="center" fw={700}>{Math.ceil(remaining / 1000)}s</Text>}
            />
          )}
        </Group>
      </Paper>

      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" mb="sm">
          <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed">
            Wpisz {slots} słów kluczy — w kolejności
          </Text>
          <Badge variant="light" color={allFilled ? 'brand' : 'gray'}>{filledCount} / {slots}</Badge>
        </Group>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {words.map((w, i) => (
            <TextInput
              key={i}
              ref={(el) => { refs.current[i] = el; }}
              leftSection={<Badge size="sm" variant="light" color={w.trim() ? 'brand' : 'gray'}>{i + 1}</Badge>}
              leftSectionWidth={44}
              value={w}
              placeholder={`słowo ${i + 1}`}
              onChange={(e) => set(i, e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                if (i < slots - 1) refs.current[i + 1]?.focus();
                else if (allFilled) finish();
              }}
            />
          ))}
        </SimpleGrid>

        <Group justify="space-between" mt="md">
          <Group gap="xs">
            <Button variant="default" size="xs" leftSection={<IconBulb size={14} />} onClick={hint} disabled={allFilled}>
              Podpowiedz słowo
            </Button>
            <Button
              variant="subtle" color="gray" size="xs"
              leftSection={<IconEraser size={14} />}
              onClick={() => setWords(Array.from({ length: slots }, () => ''))}
            >
              Wyczyść
            </Button>
          </Group>
          <Group gap="xs">
            <Button variant="subtle" color="gray" size="xs" leftSection={<IconX size={14} />} onClick={onAbort}>
              Przerwij
            </Button>
            <Button
              size="md" color="brand"
              rightSection={<IconCheck size={16} />}
              disabled={!allFilled}
              onClick={() => finish()}
            >
              Gotowe
            </Button>
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}

/* --------------------------------------------------------------- memorize */

type MemorizeProps = {
  topic: string;
  keywords: string[];
  seconds: number;
  onDone: () => void;
  onAbort: () => void;
};

/** Countdown with the topic and the keyword order on screen. */
export function MemorizePanel({ topic, keywords, seconds, onDone, onAbort }: MemorizeProps) {
  const remaining = useCountdown(seconds * 1000, true, onDone);
  const pct = Math.min(100, (1 - remaining / (seconds * 1000)) * 100);
  const secondsLeft = Math.ceil(remaining / 1000);

  return (
    <Paper withBorder p="xl" radius="md" className="rymy-fade-up">
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Box>
          <Text size="xs" tt="uppercase" lts={1.5} c="dimmed">zapamiętaj — temat</Text>
          <Text size="34px" fw={800} lts="-0.02em" c="brand.2">{topic || '—'}</Text>
        </Box>
        <RingProgress
          size={120} thickness={10}
          sections={[{ value: pct, color: secondsLeft <= 3 ? 'red' : 'brand' }]}
          label={<Text ta="center" fw={800} size="xl">{secondsLeft}s</Text>}
        />
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} mt="xl" spacing="sm">
        {keywords.map((k, i) => (
          <Paper key={i} withBorder p="md" ta="center" radius="md" className="rymy-fade-up">
            <Text size="10px" c="dimmed" tt="uppercase" lts={1}>{i + 1}</Text>
            <Text size="24px" fw={700} c="brand.3" lineClamp={1}>{k}</Text>
          </Paper>
        ))}
      </SimpleGrid>

      <Group justify="space-between" mt="lg">
        <Button variant="subtle" color="gray" size="xs" leftSection={<IconX size={14} />} onClick={onAbort}>
          Przerwij
        </Button>
        <Button color="brand" onClick={onDone}>Jestem gotów — startuj</Button>
      </Group>
    </Paper>
  );
}
