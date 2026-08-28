import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Group, Paper, Stack, Text,
} from '@mantine/core';
import {
  IconArrowRight, IconFlagCheck, IconPlayerPauseFilled, IconPlayerPlayFilled, IconX,
} from '@tabler/icons-react';
import { playChime, playClick } from '@/audio/click';
import { useSpeechInput } from '@/lib/useSpeechInput';
import { effectiveQuality, rhymeQuality } from '@/wordbank/pl/phonetics';
import {
  loadChain, recordChainRun, type ChainLink, type ChainProgress,
} from '@/storage/chainProgress';
import { ChainStrip } from './ChainStrip';
import { LinkInput, type Slot } from './LinkInput';
import { ChainSummary } from './Summary';
import { HonestReview } from './Review';
import { autoLink, linkSignal, pickStartWord } from './words';
import { scoreChain } from './score';
import { isFree, levelDef, linkWord, type ChainConfig } from './config';

type Phase = 'intro' | 'play' | 'review' | 'summary';

type Props = {
  config: ChainConfig;
  onExit: () => void;
  onSaved: (p: ChainProgress) => void;
  /** „wyżej" z podsumowania — kreator podmienia poziom i startuje od nowa */
  onLevel: (level: number) => void;
};

/** Słowo startowe zgodnie z tym, co wybrano w kreatorze. */
function firstWord(config: ChainConfig): string {
  if (config.start === 'own' && config.startWord.trim()) {
    return config.startWord.trim().toLowerCase();
  }
  return pickStartWord(config.start === 'category' ? config.category : '');
}

export function ChainRun({ config, onExit, onSaved, onLevel }: Props) {
  const def = levelDef(config.level);
  const free = isFree(def.level);
  const linkMs = def.seconds * 1000;

  // Stan sprzed rundy: świeżość słów i rekord liczymy względem tego, co było
  // przed startem — inaczej runda oceniałaby samą siebie.
  const before = useRef<ChainProgress>(loadChain());
  const record = before.current.best[def.level]?.links ?? 0;

  const [phase, setPhase] = useState<Phase>('intro');
  const [seed, setSeed] = useState(() => firstWord(config));
  const [links, setLinks] = useState<ChainLink[]>([]);
  const [slot, setSlot] = useState<Slot>('assoc');
  const [assoc, setAssoc] = useState('');
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const [remaining, setRemaining] = useState(linkMs);
  const [running, setRunning] = useState(true);
  const [mic, setMic] = useState(config.voice);
  /** trwa echo z mikrofonu — pole należy wtedy do usłyszanego słowa */
  const [echo, setEcho] = useState(false);
  const [saved, setSaved] = useState<ChainProgress | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const linkStart = useRef(Date.now());

  const from = links.length ? links[links.length - 1].assoc : seed;

  /** Wszystko, co już w łańcuchu padło — powtórka jest jedynym twardym „nie". */
  const used = useMemo(() => {
    const s = new Set<string>([seed]);
    for (const l of links) { s.add(l.assoc); s.add(l.rhyme); }
    if (assoc) s.add(assoc);
    return s;
  }, [seed, links, assoc]);
  const usedRef = useRef(used);
  usedRef.current = used;

  const combo = useMemo(() => {
    let run = 0;
    for (const l of links) {
      const q = effectiveQuality({ q: l.q, cheap: l.cheap }, def.capCheap);
      if (!l.auto && q >= def.minQ) run++; else run = 0;
    }
    return run;
  }, [links, def]);

  const done = !free && links.length >= def.links;

  // --- zegar ogniwa ---------------------------------------------------------

  useEffect(() => {
    if (phase !== 'play' || !running || free) return;
    let last = performance.now();
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      setRemaining((prev) => Math.max(0, prev - (now - last)));
      last = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, running, free]);

  // Metronom milknie przy mikrofonie: klik wchodziłby prosto w nasłuch.
  useEffect(() => {
    if (config.bpm <= 0 || phase !== 'play' || !running || mic) return;
    const id = window.setInterval(() => playClick({ volume: 0.3 }), 60000 / config.bpm);
    return () => window.clearInterval(id);
  }, [config.bpm, phase, running, mic]);

  useEffect(() => {
    if (phase === 'play') window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [phase, slot, links.length]);

  // --- ogniwa ---------------------------------------------------------------

  function resetLink() {
    setAssoc('');
    setSlot('assoc');
    setInput('');
    setError('');
    setRemaining(linkMs);
    linkStart.current = Date.now();
  }

  function pushLink(link: ChainLink) {
    setLinks((ls) => [...ls, link]);
    resetLink();
  }

  const reject = (msg: string) => {
    setError(msg);
    setShake(true);
    window.setTimeout(() => setShake(false), 350);
  };

  /**
   * Jedna droga dla klawiatury i mikrofonu — dzięki temu sloty, walidacja
   * i zamykanie ogniwa działają tak samo niezależnie od tego, czym wpisujesz.
   */
  function accept(raw: string): 'assoc' | 'closed' | 'rejected' {
    const word = raw.trim().toLowerCase();
    if (!word) return 'rejected';

    if (slot === 'assoc') {
      const signal = linkSignal(from, word, usedRef.current);
      if (signal === 'powtórka') { reject('To słowo już było w łańcuchu.'); return 'rejected'; }
      if (def.requireJump && signal === 'blisko') {
        reject('Zostałeś w tej samej rodzinie — skocz dalej.');
        return 'rejected';
      }
      setAssoc(word);
      setSlot('rhyme');
      setInput('');
      setError('');
      return 'assoc';
    }

    if (usedRef.current.has(word)) { reject('To słowo już było w łańcuchu.'); return 'rejected'; }
    const v = rhymeQuality(assoc, word);
    const q = effectiveQuality(v, def.capCheap);
    if (q < def.minQ) {
      reject(
        v.cheap && def.capCheap
          ? `„${word}" to tani rym gramatyczny — poszukaj czegoś głębiej.`
          : def.minQ === 3
            ? `Za płytko — na tym poziomie liczy się rym dwusylabowy.`
            : `To się nie rymuje z „${assoc}".`,
      );
      return 'rejected';
    }

    playClick({ accent: true, volume: 0.4 });
    pushLink({
      from,
      assoc,
      rhyme: word,
      q: v.q,
      cheap: v.cheap,
      signal: linkSignal(from, assoc, []) === 'blisko' ? 'blisko' : 'skok',
      ms: Date.now() - linkStart.current,
      auto: false,
      weak: false,
    });
    return 'closed';
  }

  function submit() {
    const result = accept(input);
    if (result === 'rejected') return;
    if (result === 'assoc') return;
    setFlash('ok');
    window.setTimeout(() => setFlash(null), 320);
  }

  /**
   * Czas minął. Łańcuch nie umiera — dopisujemy ogniwo od siebie, oznaczone
   * jako nasze, i idziemy dalej. Zatrzymanie ćwiczenia w połowie uczy
   * zatrzymywania się, a to jest nawyk, który zabija freestyle.
   */
  const fillRef = useRef<() => void>(() => {});
  fillRef.current = () => {
    const auto = autoLink(from, usedRef.current, def);
    if (!auto) { finish(); return; }
    playClick({ volume: 0.25 });
    pushLink({
      from,
      assoc: auto.assoc,
      rhyme: auto.rhyme,
      q: auto.q,
      cheap: auto.cheap,
      signal: linkSignal(from, auto.assoc, []) === 'blisko' ? 'blisko' : 'skok',
      ms: linkMs,
      auto: true,
      weak: false,
    });
  };

  useEffect(() => {
    if (phase !== 'play' || free || running === false || remaining > 0) return;
    fillRef.current();
  }, [remaining, phase, free, running]);

  function finish() {
    playChime();
    const own = links.filter((l) => !l.auto);
    setPhase(config.review && own.length > 0 ? 'review' : 'summary');
  }

  useEffect(() => {
    if (phase === 'play' && done) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, phase]);

  // --- mikrofon -------------------------------------------------------------

  /**
   * Usłyszane słowo nie wpada prosto na taśmę: najpierw ląduje w polu i dostaje
   * ten sam błysk co słowo z klawiatury. Ta sama ścieżka echa co w `RhymeRun` —
   * przy ciągłym nasłuchu ciche gubienie słów wygląda jak awaria.
   */
  const ECHO_HOLD = 260;
  const ECHO_FLASH = 320;

  const queue = useRef<string[]>([]);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);
  const acceptRef = useRef(accept);
  acceptRef.current = accept;

  function clearEcho() {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    queue.current = [];
    busy.current = false;
    setEcho(false);
  }

  function pump() {
    if (busy.current) return;
    const token = queue.current.shift();
    if (token === undefined) return;
    busy.current = true;
    setEcho(true);
    setInput(token);

    timers.current.push(window.setTimeout(() => {
      const result = acceptRef.current(token);
      // Słowo zostaje w polu na czas błysku — inaczej znika, zanim zdążysz
      // zobaczyć, co mikrofon usłyszał i co z tym zrobiliśmy.
      setInput(token);
      setFlash(result === 'rejected' ? 'bad' : 'ok');
      timers.current.push(window.setTimeout(() => {
        setFlash(null);
        setInput('');
        setEcho(false);
        busy.current = false;
        pump();
      }, ECHO_FLASH));
    }, ECHO_HOLD));
  }

  const speech = useSpeechInput({
    enabled: mic && phase === 'play' && running,
    onWords: (tokens) => {
      queue.current.push(...tokens);
      pump();
    },
  });

  useEffect(() => {
    if (mic && phase === 'play' && running) return;
    clearEcho();
  }, [mic, phase, running]);

  useEffect(() => clearEcho, []);

  // --- zapis ----------------------------------------------------------------

  const report = useMemo(
    () => scoreChain(links, def, before.current),
    [links, def],
  );

  const savedOnce = useRef(false); // StrictMode odpala efekty dwa razy
  useEffect(() => {
    if (phase !== 'summary' || savedOnce.current) return;
    savedOnce.current = true;
    const p = recordChainRun({
      level: def.level,
      seed,
      links,
      scores: report.scores,
      passed: report.passed,
      combo: report.combo,
      voice: config.voice,
      categories: report.categories,
    });
    setSaved(p);
    onSaved(p);
  }, [phase, def.level, seed, links, report, config.voice, onSaved]);

  /** Nowa runda na tym samym poziomie. */
  function again(keepSeed: boolean) {
    before.current = loadChain();
    savedOnce.current = false;
    setSaved(null);
    setLinks([]);
    setSeed(keepSeed ? seed : firstWord(config));
    resetLink();
    setRunning(true);
    setPhase('intro');
  }

  // --- ekrany ---------------------------------------------------------------

  if (phase === 'intro') {
    return (
      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" className="rymy-fade-up" ta="center" my="md">
        <Stack gap="lg" align="center">
          <Text size="xs" c="dimmed" tt="uppercase" lts={1}>wychodzisz od</Text>
          <Text
            className="rymy-pop"
            c="brand.3"
            style={{ fontSize: 'clamp(44px, 15vw, 84px)', fontWeight: 800, letterSpacing: '-0.03em' }}
          >
            {seed}
          </Text>
          <Text c="dimmed" size="sm" maw={420}>
            Najpierw skojarzenie ze słowa głównego — to ono otwiera następne ogniwo.
            Potem rym do skojarzenia jako wypełniacz. Łańcuch płynie po skojarzeniach,
            a rymy tylko domykają każdą linijkę.
          </Text>
          <Group gap="xs">
            <Badge size="lg" variant="light" color="gray">
              {free ? 'wolny łańcuch' : `${def.links} ${linkWord(def.links)} · ${def.seconds} s na ogniwo`}
            </Badge>
            {config.bpm > 0 && !mic && (
              <Badge size="lg" variant="light" color="gray">{config.bpm} BPM</Badge>
            )}
          </Group>
          <Group gap="xs">
            <Button
              size="md" color="brand" rightSection={<IconArrowRight size={16} />}
              onClick={() => { linkStart.current = Date.now(); setRemaining(linkMs); setPhase('play'); }}
            >
              Ruszamy
            </Button>
            <Button size="md" variant="subtle" color="gray" onClick={onExit}>Zmień ustawienia</Button>
          </Group>
        </Stack>
      </Paper>
    );
  }

  if (phase === 'review') {
    return (
      <HonestReview
        seed={seed}
        links={links}
        onDone={(marked) => { setLinks(marked); setPhase('summary'); }}
        onSkip={() => setPhase('summary')}
      />
    );
  }

  if (phase === 'summary') {
    return (
      <ChainSummary
        def={def}
        seed={seed}
        links={links}
        report={report}
        recordBefore={before.current.best[def.level]}
        progress={saved}
        onAgain={() => again(false)}
        onSameStart={() => again(true)}
        onLevel={onLevel}
        onExit={onExit}
      />
    );
  }

  return (
    <Stack gap="md" my="md">
      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Group justify="space-between" wrap="nowrap" gap="sm">
          <Group gap="sm" wrap="nowrap">
            {!free && (
              <ActionIcon
                size={40} radius="xl" variant="filled" color="brand"
                onClick={() => setRunning((r) => !r)}
                aria-label={running ? 'Pauza' : 'Wznów'}
              >
                {running ? <IconPlayerPauseFilled size={18} /> : <IconPlayerPlayFilled size={18} />}
              </ActionIcon>
            )}
            <Box>
              <Text size="10px" tt="uppercase" lts={1} c="dimmed">ogniwo</Text>
              <Text size="20px" fw={800} ff="monospace">
                {links.length + 1}{free ? '' : ` / ${def.links}`}
              </Text>
            </Box>
            <Badge size="lg" variant="light" color="gray">{def.label}</Badge>
          </Group>
          <Group gap="xs" wrap="nowrap">
            {free && links.length > 0 && (
              <Button
                size="sm" variant="light" color="brand"
                leftSection={<IconFlagCheck size={14} />}
                onClick={finish}
              >
                Zamknij łańcuch
              </Button>
            )}
            <Button size="sm" variant="subtle" color="gray" leftSection={<IconX size={14} />} onClick={onExit}>
              Zakończ
            </Button>
          </Group>
        </Group>
      </Paper>

      <ChainStrip seed={seed} links={links} record={record} combo={combo} />

      <LinkInput
        ref={inputRef}
        seed={seed}
        links={links}
        from={from}
        slot={slot}
        assoc={assoc}
        value={input}
        onChange={(v) => { setInput(v); if (error) setError(''); }}
        onSubmit={submit}
        onBack={() => { setSlot('assoc'); setInput(assoc); setAssoc(''); }}
        error={error}
        flash={flash}
        shake={shake}
        remaining={remaining}
        total={free ? 0 : linkMs}
        disabled={!running}
        readOnly={echo}
        mic={mic}
        micSupported={speech.supported}
        onToggleMic={() => setMic((m) => !m)}
      />

      {mic && (
        <Text size="sm" c={speech.state === 'denied' || speech.state === 'error' ? 'red.4' : 'dimmed'} fs="italic" ta="center">
          {speech.state === 'denied'
            ? 'Brak dostępu do mikrofonu — wpuść go w ustawieniach przeglądarki albo pisz dalej.'
            : speech.state === 'error'
              ? 'Rozpoznawanie się wysypało. Spróbuj jeszcze raz albo wróć do klawiatury.'
              : speech.interim || (speech.state === 'listening' ? 'słucham…' : 'uruchamiam mikrofon…')}
        </Text>
      )}
    </Stack>
  );
}
