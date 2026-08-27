import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Group, Paper, Progress, SimpleGrid, Stack, Switch, Text, TextInput,
} from '@mantine/core';
import {
  IconPlayerPauseFilled, IconPlayerPlayFilled, IconRefresh, IconSettings, IconX,
} from '@tabler/icons-react';
import { playChime, playClick } from '@/audio/click';
import { loadLevel } from '@/wordbank/loader';
import { rhymeEndings } from '@/wordbank/providers/StaticProvider';
import { fmtTime } from '@/lib/format';
import { fmtDuration, type FamilyConfig } from './config';

export function RhymeRun({ config, onExit }: { config: FamilyConfig; onExit: () => void }) {
  const pickEnding = useMemo(
    () => () => {
      if (config.ending !== 'random') return config.ending;
      const pool = rhymeEndings(config.level);
      return pool.length ? pool[Math.floor(Math.random() * pool.length)] : '';
    },
    [config.ending, config.level],
  );

  const [ending, setEnding] = useState(pickEnding);
  const [entries, setEntries] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [hints, setHints] = useState(false);
  const [done, setDone] = useState(false);

  const totalMs = config.seconds * 1000;
  const [remaining, setRemaining] = useState(totalMs);
  const [running, setRunning] = useState(true);
  const lastRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // countdown
  useEffect(() => {
    if (!running || done) return;
    lastRef.current = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const dt = now - lastRef.current;
      lastRef.current = now;
      setRemaining((prev) => {
        const next = Math.max(0, prev - dt);
        if (next === 0) {
          setRunning(false);
          setDone(true);
          playChime();
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, done]);

  // optional metronome
  useEffect(() => {
    if (config.bpm <= 0 || !running || done) return;
    const id = window.setInterval(() => playClick({ volume: 0.35 }), 60000 / config.bpm);
    return () => window.clearInterval(id);
  }, [config.bpm, running, done]);

  const bank = useMemo(
    () => (ending ? loadLevel('pl', config.level).filter((w) => w.rhymeEnding === ending) : []),
    [ending, config.level],
  );

  // What the bank knows and the user didn't reach — the payoff of the round.
  const missed = useMemo(() => {
    if (!done) return [];
    const used = new Set(entries.map((e) => e.toLowerCase()));
    const rest = bank.map((w) => w.text).filter((t) => !used.has(t.toLowerCase()));
    return rest.sort(() => Math.random() - 0.5).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, bank]);

  function submit() {
    const value = input.trim().toLowerCase();
    if (!value) return;
    if (entries.includes(value)) {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    setEntries((e) => [value, ...e]);
    setInput('');
  }

  function restart(newEnding: boolean) {
    setEntries([]);
    setInput('');
    setRemaining(totalMs);
    setDone(false);
    setRunning(true);
    if (newEnding) setEnding(pickEnding());
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  const pct = totalMs > 0 ? (1 - remaining / totalMs) * 100 : 0;
  const lastStretch = remaining <= Math.min(10_000, totalMs / 3);

  if (done) {
    return (
      <Paper withBorder p="xl" radius="md" className="rymy-fade-up" ta="center">
        <Stack gap="lg" align="center">
          <Text size="32px" fw={800}>Czas minął ⏱</Text>
          <Text c="dimmed">
            końcówka <b>-{ending}</b> · {fmtDuration(config.seconds)}
          </Text>
          <Text style={{ fontSize: 72, fontWeight: 800 }} c="brand.3">{entries.length}</Text>
          <Text size="sm" c="dimmed" mt={-12}>rymów</Text>
          {entries.length > 0 && (
            <Group gap={6} justify="center" wrap="wrap" maw={720}>
              {entries.map((w) => (
                <Badge key={w} size="lg" variant="light" color="brand">{w}</Badge>
              ))}
            </Group>
          )}
          {missed.length > 0 && (
            <Paper withBorder p="md" radius="md" maw={720} w="100%" bg="rgba(255,255,255,0.02)">
              <Text size="sm" fw={700} mb={2}>O tym nie pomyślałeś</Text>
              <Text size="xs" c="dimmed" mb="sm">
                {missed.length} słów z banku (poziom {config.level}) z końcówką -{ending}, których nie wpisałeś.
              </Text>
              <Group gap={6} justify="center" wrap="wrap">
                {missed.map((w) => (
                  <Badge key={w} size="lg" variant="light" color="gray">{w}</Badge>
                ))}
              </Group>
            </Paper>
          )}

          <Group>
            <Button size="md" color="brand" leftSection={<IconRefresh size={16} />} onClick={() => restart(config.ending === 'random')}>
              Jeszcze raz
            </Button>
            <Button size="md" variant="subtle" color="gray" leftSection={<IconSettings size={16} />} onClick={onExit}>
              Zmień ustawienia
            </Button>
          </Group>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder p="md" radius="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm">
            <ActionIcon
              size={44} radius="xl" variant="filled" color="brand"
              onClick={() => setRunning((r) => !r)}
              aria-label={running ? 'Pauza' : 'Wznów'}
            >
              {running ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} />}
            </ActionIcon>
            <Box>
              <Text size="10px" tt="uppercase" lts={1} c="dimmed">pozostało</Text>
              <Text size="24px" fw={800} ff="monospace" c={lastStretch ? 'red.4' : undefined}>
                {fmtTime(remaining)}
              </Text>
            </Box>
          </Group>
          <Group gap="xs">
            <Switch size="xs" color="brand" label="Podpowiedzi" checked={hints} onChange={(e) => setHints(e.currentTarget.checked)} />
            <Badge size="lg" variant="light" color="brand">{entries.length} rymów</Badge>
            {config.bpm > 0 && <Badge size="lg" variant="light" color="gray">{config.bpm} BPM</Badge>}
            <Button size="xs" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onExit}>
              Zakończ
            </Button>
          </Group>
        </Group>
        <Progress value={pct} color={lastStretch ? 'red' : 'brand'} size="sm" mt="sm" transitionDuration={120} />
      </Paper>

      <Paper withBorder p="xl" radius="md" ta="center">
        <Text size="xs" c="dimmed" tt="uppercase" lts={1}>końcówka</Text>
        <Text style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 }} c="brand.3">
          {ending ? `-${ending}` : '?'}
        </Text>

        <Group justify="center" mt="lg" gap="sm" wrap="nowrap">
          <div className={shake ? 'rymy-shake' : ''} style={{ minWidth: 320 }}>
            <TextInput
              ref={inputRef}
              size="lg"
              placeholder={`wpisz słowo z końcówką -${ending}`}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              disabled={!running}
            />
          </div>
          <Button size="lg" color="brand" onClick={submit} disabled={!input.trim() || !running}>
            Dodaj
          </Button>
        </Group>

        {entries.length > 0 && (
          <Group justify="center" gap={6} wrap="wrap" mt="lg">
            {entries.map((w) => (
              <Badge
                key={w} size="lg" variant="light" color="brand"
                rightSection={
                  <ActionIcon size="xs" variant="transparent" c="brand.3" onClick={() => setEntries((e) => e.filter((x) => x !== w))}>
                    <IconX size={12} />
                  </ActionIcon>
                }
              >
                {w}
              </Badge>
            ))}
          </Group>
        )}
      </Paper>

      {hints && (
        <Paper withBorder p="md" radius="md">
          <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="sm">
            Z banku ({bank.length})
          </Text>
          <SimpleGrid cols={{ base: 3, sm: 5, md: 8 }} spacing="xs">
            {bank.map((w) => (
              <Badge key={w.text} variant="light" color={entries.includes(w.text) ? 'brand' : 'gray'}>
                {w.text}
              </Badge>
            ))}
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  );
}
