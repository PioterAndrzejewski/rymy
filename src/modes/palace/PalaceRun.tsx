import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Flex, Group, Paper, Progress as ProgressBar, SimpleGrid,
  Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import {
  IconArrowRight, IconEye, IconMicrophone, IconMicrophoneOff, IconQuestionMark, IconX,
} from '@tabler/icons-react';
import { playChime, playClick } from '@/audio/click';
import { matchesEnding } from '@/wordbank/pl/rhymes';
import { useSpeechInput } from '@/lib/useSpeechInput';
import { recordPalaceRun, type PalaceProgress } from '@/storage/palaceProgress';
import { fmtTime } from '@/lib/format';
import { DISTRACTION_MS, WALK_MS, levelDef, type PalaceConfig } from './config';
import { roomsFor, roomTraits } from './rooms';
import { pickDistractions, pickWords, type Distraction } from './words';
import { Walk3D } from './Walk3D';
import { RoomCard } from './RoomCard';
import { PalaceSummary } from './Summary';
import { useIsMobile } from './useIsMobile';

type Phase = 'memorize' | 'distract' | 'recall' | 'summary';

/**
 * Runda pałacu: zapamiętanie → rozproszenie → odtworzenie → podsumowanie.
 *
 * Dwie rzeczy są tu celowe i nie należy ich „naprawiać":
 * 1. W fazie odtwarzania nie ma ani jednego sygnału o poprawności. Człowiek,
 *    który widzi czerwone pole, uczy się poprawiania, a nie przypominania.
 * 2. Wracać do poprzedniego pokoju też nie można — pałac idzie w jedną stronę.
 */
export function PalaceRun({
  config, onExit, onSaved,
}: { config: PalaceConfig; onExit: () => void; onSaved: (p: PalaceProgress) => void }) {
  const def = levelDef(config.level);
  const mobile = useIsMobile();

  const [seed, setSeed] = useState(0); // zmiana = nowy zestaw słów
  const words = useMemo(() => pickWords(def.words, config.category), [def.words, config.category, seed]);
  const rooms = useMemo(() => roomsFor(def.words), [def.words]);
  const distractions = useMemo(
    () => pickDistractions(def.distractions, words),
    [def.distractions, words],
  );

  const [phase, setPhase] = useState<Phase>('memorize');
  const [index, setIndex] = useState(0);

  // --- faza 1: zapamiętywanie -----------------------------------------------

  const dwellMs = config.pace * 1000;
  const stepMs = dwellMs + (config.walk3d ? WALK_MS : 0);
  const [stepStart, setStepStart] = useState(() => performance.now());
  const [dwellPct, setDwellPct] = useState(0);

  const nextRoom = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= words.length) {
        setPhase('distract');
        return i;
      }
      setStepStart(performance.now());
      return i + 1;
    });
  }, [words.length]);

  useEffect(() => {
    if (phase !== 'memorize') return;
    playClick({ accent: index === 0, volume: 0.25 });
    const t = window.setTimeout(nextRoom, stepMs);
    return () => window.clearTimeout(t);
  }, [phase, index, stepMs, nextRoom]);

  useEffect(() => {
    if (phase !== 'memorize') return;
    let raf = 0;
    const tick = () => {
      setDwellPct(Math.min(100, ((performance.now() - stepStart) / stepMs) * 100));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, stepStart, stepMs]);

  // --- faza 2: rozproszenie -------------------------------------------------

  const [taskIndex, setTaskIndex] = useState(0);
  const [taskInput, setTaskInput] = useState('');
  const [taskShake, setTaskShake] = useState(false);
  const [taskDone, setTaskDone] = useState<boolean[]>([]);
  const [taskLeft, setTaskLeft] = useState(DISTRACTION_MS);

  const finishTask = useCallback((ok: boolean) => {
    setTaskDone((d) => [...d, ok]);
    setTaskInput('');
    setTaskIndex((i) => {
      if (i + 1 >= distractions.length) {
        setPhase('recall');
        return i;
      }
      return i + 1;
    });
  }, [distractions.length]);

  useEffect(() => {
    if (phase !== 'distract') return;
    if (distractions.length === 0) { setPhase('recall'); return; }
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const left = DISTRACTION_MS - (performance.now() - start);
      setTaskLeft(Math.max(0, left));
      if (left <= 0) { finishTask(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, taskIndex, distractions.length, finishTask]);

  function submitTask(task: Distraction) {
    const value = taskInput.trim().toLowerCase();
    if (!value) return;
    if (value === task.seed.toLowerCase() || !matchesEnding(value, task.ending)) {
      setTaskShake(true);
      window.setTimeout(() => setTaskShake(false), 350);
      return;
    }
    playClick({ volume: 0.25 });
    finishTask(true);
  }

  // --- faza 3: odtwarzanie --------------------------------------------------

  const [answers, setAnswers] = useState<string[]>([]);
  const [recallInput, setRecallInput] = useState('');
  const [recallStart, setRecallStart] = useState(0);
  const [recallMs, setRecallMs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [mic, setMic] = useState(config.voice);
  const recallRef = useRef<HTMLInputElement>(null);
  const answersRef = useRef<string[]>([]);
  answersRef.current = answers;

  useEffect(() => {
    if (phase !== 'recall') return;
    const start = performance.now();
    setRecallStart(start);
    window.setTimeout(() => recallRef.current?.focus(), 0);
    let raf = 0;
    const tick = () => {
      setElapsed(performance.now() - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  /** Jedna droga dla klawiatury i mikrofonu — kolejność jest wymuszona. */
  const answer = useCallback((value: string) => {
    const next = [...answersRef.current, value.trim().toLowerCase()];
    answersRef.current = next;
    setAnswers(next);
    setRecallInput('');
    if (next.length >= words.length) {
      setRecallMs(performance.now() - recallStart);
      playChime(0.25);
      setPhase('summary');
    }
  }, [words.length, recallStart]);

  const handleHeard = useCallback((tokens: string[]) => {
    // Z mowy bierzemy ostatnie słowo i od razu jedziemy dalej — całe ćwiczenie
    // jest na czas, zatwierdzanie ręką kasowałoby sens mikrofonu.
    const last = tokens.at(-1);
    if (last) answer(last);
  }, [answer]);

  const speech = useSpeechInput({
    enabled: mic && phase === 'recall',
    onWords: handleHeard,
  });

  // --- zapis ----------------------------------------------------------------

  const [saved, setSaved] = useState<PalaceProgress | null>(null);
  const savedOnce = useRef(false); // StrictMode odpala efekty dwa razy

  useEffect(() => {
    if (phase !== 'summary' || savedOnce.current) return;
    savedOnce.current = true;
    const p = recordPalaceRun({
      level: config.level,
      words,
      answers: answersRef.current,
      recallMs,
      used3d: config.walk3d,
      voice: config.voice,
    });
    setSaved(p);
    onSaved(p);
  }, [phase, config.level, config.walk3d, config.voice, words, recallMs, onSaved]);

  function restart(sameWords: boolean) {
    savedOnce.current = false;
    setSaved(null);
    if (!sameWords) setSeed((s) => s + 1);
    setAnswers([]);
    answersRef.current = [];
    setRecallInput('');
    setRecallMs(0);
    setElapsed(0);
    setTaskIndex(0);
    setTaskDone([]);
    setTaskInput('');
    setIndex(0);
    setStepStart(performance.now());
    setPhase('memorize');
  }

  // --- widoki ---------------------------------------------------------------

  if (phase === 'summary') {
    return (
      <PalaceSummary
        level={config.level}
        words={words}
        answers={answers}
        recallMs={recallMs}
        progress={saved}
        distractionsSolved={taskDone.filter(Boolean).length}
        distractionsTotal={distractions.length}
        onRepeatSame={() => restart(true)}
        onNewSet={() => restart(false)}
        onExit={onExit}
      />
    );
  }

  const room = rooms[Math.min(index, rooms.length - 1)];
  const sceneHeight = mobile ? 260 : 360;

  return (
    <Stack gap="md" my="md">
      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Group justify="space-between" wrap="wrap" gap="xs">
          <Group gap="xs">
            <Badge size="lg" variant="light" color="brand">
              {phase === 'memorize' ? 'Zapamiętuj' : phase === 'distract' ? 'Rozproszenie' : 'Odtwarzaj'}
            </Badge>
            <Badge size="lg" variant="light" color="gray">
              poziom {config.level} · {def.words} słów
            </Badge>
            {phase === 'recall' && (
              <Badge size="lg" variant="light" color="accent" ff="monospace">{fmtTime(elapsed)}</Badge>
            )}
          </Group>
          <Button size="sm" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onExit}>
            Zakończ
          </Button>
        </Group>
      </Paper>

      {phase === 'memorize' && (
        <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
          <Stack gap="sm">
            <Group justify="space-between" wrap="wrap" gap="xs">
              <Text size="sm" c="dimmed">
                Pokój {index + 1} z {words.length} · {room.name} ({roomTraits(room)})
              </Text>
              <Badge variant="light" color="gray">{room.prop} {words[index]}</Badge>
            </Group>

            {config.walk3d ? (
              <Walk3D rooms={rooms} index={index} word={words[index]} height={sceneHeight} />
            ) : (
              <RoomCard room={room} index={index} word={words[index]} height={sceneHeight} />
            )}

            <ProgressBar value={dwellPct} color="brand" size="sm" transitionDuration={0} />
            <Text size="xs" c="dimmed" ta="center">
              Zobacz to słowo w tym pokoju — im dziwniej, tym lepiej się trzyma.
            </Text>
            <Group justify="center">
              <Button
                size="sm" variant="light" color="brand"
                rightSection={<IconArrowRight size={14} />}
                onClick={nextRoom}
              >
                Mam to — dalej
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {phase === 'distract' && distractions[taskIndex] && (
        <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" ta="center">
          <Stack gap="sm" align="center">
            <Text size="xs" c="dimmed" tt="uppercase" lts={1}>
              zadanie {taskIndex + 1} z {distractions.length} · podaj rym do
            </Text>
            <Text style={{ fontSize: 'clamp(36px, 12vw, 64px)', fontWeight: 800 }} c="brand.3">
              {distractions[taskIndex].seed}
            </Text>
            <Box className={taskShake ? 'rymy-shake' : undefined} w="100%" maw={360}>
              <TextInput
                size="lg"
                autoFocus
                placeholder={`rym na -${distractions[taskIndex].ending}`}
                value={taskInput}
                onChange={(e) => setTaskInput(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitTask(distractions[taskIndex]); }}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="done"
              />
            </Box>
            <Group gap="xs">
              <Button color="brand" onClick={() => submitTask(distractions[taskIndex])}>Dalej</Button>
              <Button variant="subtle" color="gray" onClick={() => finishTask(false)}>Pomiń</Button>
            </Group>
            <ProgressBar
              w="100%" maw={360}
              value={(taskLeft / DISTRACTION_MS) * 100}
              color={taskLeft < 5000 ? 'red' : 'gray'}
              size="xs"
            />
            <Text size="xs" c="dimmed">
              To nie jest przerwa — te rymy mają wypchnąć słowa z pamięci roboczej.
            </Text>
          </Stack>
        </Paper>
      )}

      {phase === 'recall' && (
        <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
          <Stack gap="sm">
            <Text size="sm" c="dimmed" ta="center">
              Pokój {answers.length + 1} z {words.length} · {rooms[answers.length]?.name}
            </Text>

            {config.walk3d ? (
              <Walk3D rooms={rooms} index={answers.length} height={sceneHeight} />
            ) : (
              <RoomCard room={rooms[answers.length]} index={answers.length} height={sceneHeight} />
            )}

            {/* Na telefonie pole idzie nad przyciski — trzy elementy w jednym
                rzędzie zjadają się nawzajem przy 360 px. */}
            <Flex
              direction={{ base: 'column', xs: 'row' }}
              align={{ base: 'stretch', xs: 'center' }}
              justify="center"
              gap="sm"
            >
              <TextInput
                ref={recallRef}
                size="lg"
                style={{ flex: 1, maxWidth: 360, minWidth: 0 }}
                placeholder="co tu było?"
                value={recallInput}
                onChange={(e) => setRecallInput(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && recallInput.trim()) answer(recallInput); }}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="next"
              />
              <Group gap="sm" wrap="nowrap" justify="center">
              <Button size="lg" color="brand" flex={1} disabled={!recallInput.trim()} onClick={() => answer(recallInput)}>
                Dalej
              </Button>
              {speech.supported && (
                <Tooltip label={mic ? 'Wyłącz mikrofon' : 'Mów zamiast pisać'} withArrow>
                  <ActionIcon
                    size={50} radius="xl"
                    variant={mic ? 'filled' : 'default'}
                    color={mic ? 'red' : 'gray'}
                    className={mic && speech.state === 'listening' ? 'rymy-pulse' : undefined}
                    onClick={() => setMic((m) => !m)}
                    aria-label={mic ? 'Wyłącz mikrofon' : 'Włącz mikrofon'}
                  >
                    {mic ? <IconMicrophone size={22} /> : <IconMicrophoneOff size={22} />}
                  </ActionIcon>
                </Tooltip>
              )}
              </Group>
            </Flex>

            {mic && (
              <Text size="sm" c={speech.state === 'denied' ? 'red.4' : 'dimmed'} fs="italic" ta="center">
                {speech.state === 'denied'
                  ? 'Brak dostępu do mikrofonu — wpuść go w ustawieniach albo pisz.'
                  : speech.interim || (speech.state === 'listening' ? 'słucham…' : 'uruchamiam mikrofon…')}
              </Text>
            )}

            <Group justify="center" gap="xs">
              <Button
                size="sm" variant="subtle" color="gray"
                leftSection={<IconQuestionMark size={14} />}
                onClick={() => answer('')}
              >
                Nie pamiętam
              </Button>
            </Group>

            {/* Same znaczniki — bez treści i bez oceny. Widać tylko, ile już przeszedłeś. */}
            <Group justify="center" gap={6} wrap="wrap">
              {words.map((_, i) => (
                <Box
                  key={i}
                  w={26} h={26}
                  style={{
                    borderRadius: 6,
                    display: 'grid', placeItems: 'center', fontSize: 11,
                    border: `1px solid ${i < answers.length ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-dark-4)'}`,
                    background: i < answers.length ? 'rgba(243,184,29,0.14)' : 'transparent',
                    color: 'var(--mantine-color-dimmed)',
                  }}
                >
                  {i + 1}
                </Box>
              ))}
            </Group>
            <Text size="xs" c="dimmed" ta="center">
              <IconEye size={12} style={{ verticalAlign: -2 }} /> Wynik zobaczysz dopiero na końcu.
            </Text>
          </Stack>
        </Paper>
      )}

      {phase === 'memorize' && (
        <SimpleGrid cols={{ base: 4, sm: 8 }} spacing={6}>
          {words.map((_, i) => (
            <Box
              key={i}
              h={6}
              style={{
                borderRadius: 3,
                background: i <= index ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-dark-5)',
              }}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
