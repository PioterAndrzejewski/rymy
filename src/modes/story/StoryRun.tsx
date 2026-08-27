import { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Group, Paper, Progress, SimpleGrid, Stack, Switch, Text, Tooltip,
} from '@mantine/core';
import {
  IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlayerTrackPrevFilled,
  IconRefresh, IconSettings, IconX,
} from '@tabler/icons-react';
import { engine } from '@/audio/engineSingleton';
import { playChime } from '@/audio/click';
import { useEngineState, useTransport } from '@/audio/useTransport';
import { useSession } from '@/state/session';
import { CountIn } from '@/components/CountIn';
import { barsToTime, fmtTime } from '@/lib/format';
import { drawKeywords, randomTopic, type StoryConfig } from './config';
import { KeywordWriter, MemorizePanel } from './StoryPhases';
import { buildStoryPlan, StoryTimeline } from './StoryTimeline';

type Phase = 'write' | 'memorize' | 'countin' | 'play' | 'done';

export function StoryRun({ config, onExit }: { config: StoryConfig; onExit: () => void }) {
  const { track } = useSession();
  const snap = useTransport(track);
  const engineState = useEngineState();

  const [initialTopic] = useState(() => (config.topicMode === 'auto' ? randomTopic() : config.topic));
  const [topic, setTopic] = useState(initialTopic);
  const [keywords, setKeywords] = useState<string[]>(
    () => (config.wordsMode === 'auto' ? drawKeywords(config.level, config.slots, initialTopic) : []),
  );
  const [phase, setPhase] = useState<Phase>(config.wordsMode === 'own' ? 'write' : 'memorize');
  const [runKey, setRunKey] = useState(0);
  const [hideWords, setHideWords] = useState(false);

  const introBars = track?.introBars ?? 0;
  const beatsPerBar = track?.timeSignature[0] ?? 4;
  const totalBars = introBars + config.slots * config.barsPerKeyword;

  const plan = useMemo(
    () => buildStoryPlan(keywords, introBars, config.barsPerKeyword),
    [keywords, introBars, config.barsPerKeyword],
  );

  // Never leave the track running while we're in a setup-ish phase.
  useEffect(() => {
    if (phase === 'write' || phase === 'memorize' || phase === 'countin') {
      engine.pause();
      engine.seekMs(0);
    }
  }, [phase, runKey]);

  useEffect(() => {
    if (phase !== 'play') return;
    if (snap.bar >= totalBars) {
      engine.pause();
      playChime();
      setPhase('done');
    }
  }, [phase, snap.bar, totalBars]);

  /** Restart with the same topic + words. */
  function again() {
    setRunKey((k) => k + 1);
    setPhase('memorize');
  }

  /** Fresh round honouring the configured modes. */
  function newRound() {
    const nextTopic = config.topicMode === 'auto' ? randomTopic() : topic;
    setTopic(nextTopic);
    setRunKey((k) => k + 1);
    if (config.wordsMode === 'auto') {
      setKeywords(drawKeywords(config.level, config.slots, nextTopic));
      setPhase('memorize');
    } else {
      setKeywords([]);
      setPhase('write');
    }
  }

  function abort() {
    engine.pause();
    onExit();
  }

  const currentBar = Math.max(0, snap.bar);
  const currentIdx = phase === 'play' && currentBar >= introBars
    ? Math.max(0, Math.min(config.slots - 1, Math.floor((currentBar - introBars) / config.barsPerKeyword)))
    : -1;
  // The keyword lands on the last bar of its group, so this is how many bars
  // you still have to fill before it has to fall.
  const barsToCue = currentIdx >= 0
    ? config.barsPerKeyword - 1 - ((currentBar - introBars) % config.barsPerKeyword)
    : -1;
  const isPlaying = engineState === 'playing';
  const progress = totalBars > 0 ? Math.min(100, (currentBar / totalBars) * 100) : 0;

  if (phase === 'write') {
    return (
      <KeywordWriter
        key={runKey}
        topic={topic}
        slots={config.slots}
        level={config.level}
        limitSec={config.writeLimitSec}
        onDone={(ks) => { setKeywords(ks); setPhase('memorize'); }}
        onAbort={abort}
      />
    );
  }

  if (phase === 'memorize') {
    return (
      <MemorizePanel
        key={runKey}
        topic={topic}
        keywords={keywords}
        seconds={config.memorizeSec}
        onDone={() => setPhase('countin')}
        onAbort={abort}
      />
    );
  }

  if (phase === 'done') {
    return (
      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" className="rymy-fade-up" ta="center">
        <Stack gap="lg" align="center">
          <Text style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 800 }}>Historia opowiedziana 🎤</Text>
          <Text c="dimmed">temat: <b>{topic}</b></Text>
          <Group gap={6} justify="center" wrap="wrap">
            {keywords.map((k, i) => (
              <Badge key={i} size="lg" variant="light" color="brand">{i + 1}. {k}</Badge>
            ))}
          </Group>
          <Group gap="xl" justify="center" wrap="wrap">
            <Stat label="Takty" value={String(totalBars)} />
            <Stat label="Słowa" value={String(config.slots)} />
            <Stat label="Czas" value={barsToTime(totalBars, track?.bpm ?? 90, beatsPerBar)} />
          </Group>
          <Stack gap="xs" w="100%" maw={360}>
            <Button size="md" color="brand" leftSection={<IconRefresh size={16} />} onClick={again}>
              Jeszcze raz
            </Button>
            <Button size="md" variant="default" onClick={newRound}>Nowa runda</Button>
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
      {phase === 'countin' && (
        <CountIn
          key={runKey}
          beats={beatsPerBar}
          bpm={track?.bpm ?? 90}
          label={introBars > 0 ? `Za chwilę intro (${introBars} taktów)` : 'Zaczynamy'}
          onDone={() => { setPhase('play'); void engine.play(); }}
        />
      )}

      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
            <ActionIcon
              size={44} radius="xl" variant="filled" color="brand"
              onClick={() => engine.toggle()}
              aria-label={isPlaying ? 'Pauza' : 'Wznów'}
            >
              {isPlaying ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} />}
            </ActionIcon>
            <Tooltip label="Od nowa (te same słowa)">
              <ActionIcon size={44} radius="xl" variant="default" onClick={again}>
                <IconPlayerTrackPrevFilled size={18} />
              </ActionIcon>
            </Tooltip>
            <Box style={{ minWidth: 0 }}>
              <Text size="10px" tt="uppercase" lts={1} c="dimmed">temat</Text>
              <Text fw={700} lineClamp={1}>{topic || '—'}</Text>
            </Box>
          </Group>
          <Group gap="xs" wrap="wrap">
            <Switch
              size="sm" color="brand" label="Ukryj słowa"
              checked={hideWords}
              onChange={(e) => setHideWords(e.currentTarget.checked)}
            />
            <Badge variant="light" color="gray" size="lg">
              słowo {currentIdx >= 0 ? currentIdx + 1 : '—'} / {config.slots}
            </Badge>
            <Badge variant="light" color={currentBar < introBars ? 'accent' : 'brand'} size="lg">
              takt {Math.min(currentBar + 1, totalBars)} / {totalBars}
            </Badge>
            <Text size="xs" c="dimmed" ff="monospace">{fmtTime(snap.timeMs)}</Text>
            <Button size="sm" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={abort}>
              Zakończ
            </Button>
          </Group>
        </Group>
        <Progress value={progress} color="brand" size="sm" mt="sm" transitionDuration={120} />
      </Paper>

      <StoryTimeline plan={plan} currentBar={currentBar} barPhase={snap.barPhase} hidden={hideWords} />

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
        {keywords.map((k, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <Paper
              key={i} withBorder p="md" ta="center" radius="md"
              style={{
                borderColor: active ? 'var(--mantine-color-brand-6)' : undefined,
                background: active ? 'rgba(243, 184, 29, 0.10)' : undefined,
                opacity: done ? 0.3 : 1,
                transition: 'all 200ms ease',
              }}
            >
              <Text size="10px" c="dimmed" tt="uppercase" lts={1}>{i + 1}</Text>
              <Text
                size={active ? '32px' : '20px'}
                fw={active ? 800 : 500}
                c={active ? 'brand.2' : undefined}
                lineClamp={1}
                style={{ transition: 'font-size 200ms ease' }}
              >
                {hideWords && !active ? '•••' : k}
              </Text>
              {active && (
                <Text size="10px" tt="uppercase" lts={1} c={barsToCue === 0 ? 'brand.4' : 'dimmed'} fw={700}>
                  {barsToCue === 0 ? 'teraz!' : `za ${barsToCue} ${barsLabel(barsToCue)}`}
                </Text>
              )}
            </Paper>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}

function barsLabel(n: number): string {
  return n === 1 ? 'takt' : n < 5 ? 'takty' : 'taktów';
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Text size="10px" tt="uppercase" lts={0.8} c="dimmed">{label}</Text>
      <Text size="26px" fw={700}>{value}</Text>
    </Box>
  );
}
