import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Collapse, Flex, Group, Paper, Progress, SimpleGrid,
  Stack, Switch, Text, TextInput,
} from '@mantine/core';
import {
  IconArrowRight, IconChevronDown, IconPlayerPauseFilled, IconPlayerPlayFilled,
  IconRefresh, IconSettings, IconX,
} from '@tabler/icons-react';
import { playChime, playClick } from '@/audio/click';
import { RHYME_ENDINGS, rhymeCount, rhymeWords } from '@/wordbank/pl/rhymes';
import { fmtTime } from '@/lib/format';
import { fmtDuration, rhymeWord, type FamilyConfig } from './config';

/** One word you rhymed to, plus what you managed to write for it. */
type Round = { ending: string; seed: string; entries: string[] };

export function RhymeRun({ config, onExit }: { config: FamilyConfig; onExit: () => void }) {
  const multi = config.sessionMode !== 'single';
  const timed = config.sessionMode === 'timed';

  const pickEnding = useMemo(
    () => () => {
      if (config.ending !== 'random') return config.ending;
      return RHYME_ENDINGS[Math.floor(Math.random() * RHYME_ENDINGS.length)];
    },
    [config.ending],
  );

  // The prompt is a concrete word, not a bare ending — you rhyme to something.
  // Never repeat a word inside one session.
  const usedSeeds = useRef(new Set<string>());
  const pickSeed = useMemo(
    () => (e: string) => {
      const pool = (e ? rhymeWords(e) : []).filter((w) => !usedSeeds.current.has(w));
      const from = pool.length ? pool : rhymeWords(e);
      const word = from.length ? from[Math.floor(Math.random() * from.length)] : '';
      if (word) usedSeeds.current.add(word);
      return word;
    },
    [],
  );

  const [ending, setEnding] = useState(pickEnding);
  const [seed, setSeed] = useState(() => pickSeed(ending));
  const [entries, setEntries] = useState<string[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [hints, setHints] = useState(false);
  const [done, setDone] = useState(false);

  const totalMs = config.seconds * 1000;
  const wordMs = config.wordSeconds * 1000;
  const [remaining, setRemaining] = useState(totalMs);
  const [wordRemaining, setWordRemaining] = useState(wordMs);
  const [running, setRunning] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  /** Bank the current word and move on. */
  function nextWord(finished: string[] = entries) {
    setRounds((r) => [...r, { ending, seed, entries: finished }]);
    const nextEnding = config.ending === 'random' ? pickEnding() : ending;
    setEnding(nextEnding);
    setSeed(pickSeed(nextEnding));
    setEntries([]);
    setInput('');
    setWordRemaining(wordMs);
    playClick({ accent: true, volume: 0.4 });
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  const advanceRef = useRef(nextWord);
  advanceRef.current = nextWord;

  // One clock drives both the round and (in timed mode) the current word.
  useEffect(() => {
    if (!running || done) return;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      setRemaining((prev) => Math.max(0, prev - dt));
      if (timed) setWordRemaining((prev) => Math.max(0, prev - dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, done, timed]);

  useEffect(() => {
    if (done || remaining > 0) return;
    setRunning(false);
    setDone(true);
    playChime();
  }, [remaining, done]);

  useEffect(() => {
    if (!timed || done || !running || wordRemaining > 0) return;
    advanceRef.current();
  }, [wordRemaining, timed, done, running]);

  // optional metronome
  useEffect(() => {
    if (config.bpm <= 0 || !running || done) return;
    const id = window.setInterval(() => playClick({ volume: 0.35 }), 60000 / config.bpm);
    return () => window.clearInterval(id);
  }, [config.bpm, running, done]);

  const bank = useMemo(
    () => (ending ? rhymeWords(ending).filter((w) => w !== seed) : []),
    [ending, seed],
  );
  const hintSample = useMemo(
    () => [...bank].sort(() => Math.random() - 0.5).slice(0, 24).sort((a, b) => a.localeCompare(b, 'pl')),
    [bank],
  );

  function submit() {
    const value = input.trim().toLowerCase();
    if (!value) return;
    if (entries.includes(value) || value === seed.toLowerCase()) {
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    const next = [value, ...entries];
    if (config.sessionMode === 'quota' && next.length >= config.quota) {
      nextWord(next);
      return;
    }
    setEntries(next);
    setInput('');
  }

  function restart() {
    usedSeeds.current.clear();
    const next = config.ending === 'random' ? pickEnding() : ending;
    setEnding(next);
    setSeed(pickSeed(next));
    setEntries([]);
    setRounds([]);
    setInput('');
    setRemaining(totalMs);
    setWordRemaining(wordMs);
    setDone(false);
    setRunning(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  const pct = totalMs > 0 ? (1 - remaining / totalMs) * 100 : 0;
  const lastStretch = remaining <= Math.min(10_000, totalMs / 3);

  if (done) {
    const all: Round[] = [...rounds, { ending, seed, entries }];
    const played = all.filter((r) => r.entries.length > 0 || all.length === 1);
    const totalRhymes = all.reduce((n, r) => n + r.entries.length, 0);
    const headline = config.sessionMode === 'quota' ? rounds.length : totalRhymes;
    const headlineLabel = config.sessionMode === 'quota'
      ? `${rounds.length === 1 ? 'słowo zaliczone' : 'słów zaliczonych'}`
      : rhymeWord(totalRhymes);

    return (
      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" className="rymy-fade-up" ta="center">
        <Stack gap="lg" align="center">
          <Text style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 800 }}>Czas minął ⏱</Text>
          <Text c="dimmed">
            {multi
              ? `${all.length} ${all.length === 1 ? 'słowo' : all.length < 5 ? 'słowa' : 'słów'} · ${fmtDuration(config.seconds)}`
              : `rym do ${seed || `-${ending}`} (-${ending}) · ${fmtDuration(config.seconds)}`}
          </Text>
          <Text style={{ fontSize: 'clamp(56px, 16vw, 72px)', fontWeight: 800 }} c="brand.3">{headline}</Text>
          <Text size="sm" c="dimmed" mt={-12}>
            {headlineLabel}
            {config.sessionMode === 'quota' && totalRhymes > 0 && ` · ${totalRhymes} ${rhymeWord(totalRhymes)} łącznie`}
          </Text>

          <Stack gap="sm" w="100%" maw={720}>
            {played.map((round, i) => (
              <RoundResult key={`${round.seed}-${i}`} round={round} solo={!multi} />
            ))}
          </Stack>

          <Stack gap="xs" w="100%" maw={360}>
            <Button size="md" color="brand" leftSection={<IconRefresh size={16} />} onClick={restart}>
              Jeszcze raz
            </Button>
            <Button size="md" variant="subtle" color="gray" leftSection={<IconSettings size={16} />} onClick={onExit}>
              Zmień ustawienia
            </Button>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack gap="md">
      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap" gap="sm">
            <Group gap="sm" wrap="nowrap">
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
              {timed && (
                <Box>
                  <Text size="10px" tt="uppercase" lts={1} c="dimmed">to słowo</Text>
                  <Text
                    size="24px" fw={800} ff="monospace"
                    c={wordRemaining <= 5000 ? 'red.4' : 'brand.4'}
                  >
                    {Math.ceil(wordRemaining / 1000)}s
                  </Text>
                </Box>
              )}
            </Group>
            <Button size="sm" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onExit}>
              Zakończ
            </Button>
          </Group>
          <Group gap="xs" wrap="wrap" justify="space-between">
            <Switch size="sm" color="brand" label="Podpowiedzi" checked={hints} onChange={(e) => setHints(e.currentTarget.checked)} />
            <Group gap="xs" wrap="nowrap">
              {multi && (
                <Badge size="lg" variant="light" color="gray">słowo {rounds.length + 1}</Badge>
              )}
              <Badge size="lg" variant="light" color="brand">
                {config.sessionMode === 'quota'
                  ? `${entries.length} / ${config.quota}`
                  : `${entries.length} ${rhymeWord(entries.length)}`}
              </Badge>
              {config.bpm > 0 && <Badge size="lg" variant="light" color="gray">{config.bpm} BPM</Badge>}
            </Group>
          </Group>
        </Stack>
        <Progress value={pct} color={lastStretch ? 'red' : 'brand'} size="sm" mt="sm" transitionDuration={120} />
      </Paper>

      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" ta="center">
        <Text size="xs" c="dimmed" tt="uppercase" lts={1}>rymuj do</Text>
        <Text
          key={seed}
          className="rymy-pop"
          c="brand.3"
          style={{
            fontSize: 'clamp(44px, 14vw, 80px)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          {seed || (ending ? `-${ending}` : '?')}
        </Text>
        {ending && (
          <Badge size="lg" variant="light" color="gray" mt={4}>końcówka -{ending}</Badge>
        )}

        <Flex
          justify="center"
          align={{ base: 'stretch', xs: 'center' }}
          direction={{ base: 'column', xs: 'row' }}
          mt="lg"
          gap="sm"
        >
          <div className={shake ? 'rymy-shake' : ''} style={{ flex: 1, maxWidth: 420, minWidth: 0 }}>
            <TextInput
              ref={inputRef}
              size="lg"
              placeholder={seed ? `wpisz rym do „${seed}"` : `wpisz rym na -${ending}`}
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              disabled={!running}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
            />
          </div>
          <Button size="lg" color="brand" onClick={submit} disabled={!input.trim() || !running}>
            Dodaj
          </Button>
        </Flex>

        {multi && (
          <Button
            mt="sm" size="xs" variant="subtle" color="gray"
            rightSection={<IconArrowRight size={14} />}
            onClick={() => nextWord()}
            disabled={!running}
          >
            Następne słowo
          </Button>
        )}

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
        <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
          <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="sm">
            Z banku — {hintSample.length} z {bank.length}
          </Text>
          <SimpleGrid cols={{ base: 2, xs: 3, sm: 5, md: 8 }} spacing="xs">
            {hintSample.map((w) => (
              <Badge key={w} variant="light" color={entries.includes(w) ? 'brand' : 'gray'}>
                {w}
              </Badge>
            ))}
          </SimpleGrid>
        </Paper>
      )}
    </Stack>
  );
}

/** One word from the session: what you wrote, and what you missed. */
function RoundResult({ round, solo }: { round: Round; solo: boolean }) {
  const [open, setOpen] = useState(false);

  const missedAll = useMemo(() => {
    const used = new Set(round.entries.map((e) => e.toLowerCase()));
    return rhymeWords(round.ending).filter((w) => w !== round.seed && !used.has(w.toLowerCase()));
  }, [round]);
  const sample = useMemo(
    () => [...missedAll].sort(() => Math.random() - 0.5).slice(0, 10),
    [missedAll],
  );

  return (
    <Paper withBorder p="md" radius="md" bg="rgba(255,255,255,0.02)" ta="left">
      <Group justify="space-between" wrap="wrap" gap="xs" mb="sm">
        <Group gap={8}>
          <Text fw={700}>{round.seed}</Text>
          <Badge size="sm" variant="light" color="gray">-{round.ending}</Badge>
        </Group>
        <Badge size="sm" variant="light" color={round.entries.length ? 'brand' : 'gray'}>
          {round.entries.length} {rhymeWord(round.entries.length)}
        </Badge>
      </Group>

      {round.entries.length > 0 && (
        <Group gap={6} wrap="wrap" mb="sm">
          {round.entries.map((w) => (
            <Badge key={w} size="lg" variant="light" color="brand">{w}</Badge>
          ))}
        </Group>
      )}

      {sample.length > 0 && (
        <>
          <Text size="sm" fw={700} mb={2}>O tym nie pomyślałeś</Text>
          <Text size="xs" c="dimmed" mb="sm">
            {solo ? 'Kilka słów, których nie wpisałeś' : 'Czego zabrakło'} — znamy ich {missedAll.length}.
          </Text>
          <Group gap={6} wrap="wrap">
            {sample.map((w) => (
              <Badge key={w} size="lg" variant="light" color="gray">{w}</Badge>
            ))}
          </Group>

          {missedAll.length > sample.length && (
            <>
              <Collapse in={open}>
                <Text size="xs" c="dimmed" mt="md" mb="xs">
                  Cała rodzina -{round.ending} ({rhymeCount(round.ending)} słów), alfabetycznie:
                </Text>
                <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing={6}>
                  {missedAll.map((w) => (
                    <Badge key={w} variant="light" color="gray" style={{ maxWidth: '100%' }}>
                      {w}
                    </Badge>
                  ))}
                </SimpleGrid>
              </Collapse>
              <Button
                mt="sm" size="xs" variant="subtle" color="gray"
                rightSection={
                  <IconChevronDown
                    size={14}
                    style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 180ms ease' }}
                  />
                }
                onClick={() => setOpen((v) => !v)}
              >
                {open ? 'Zwiń' : `Pokaż więcej (${missedAll.length - sample.length})`}
              </Button>
            </>
          )}
        </>
      )}
    </Paper>
  );
}
