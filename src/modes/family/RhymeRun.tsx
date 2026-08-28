import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionIcon, Badge, Box, Button, Collapse, Flex, Group, Paper, Progress as ProgressBar, SimpleGrid,
  Stack, Switch, Text, TextInput, Tooltip,
} from '@mantine/core';
import {
  IconAlertTriangle, IconArrowRight, IconChevronDown, IconDice5, IconMicrophone,
  IconMicrophoneOff, IconPlayerPauseFilled, IconPlayerPlayFilled, IconPlus, IconRefresh,
  IconRotateClockwise, IconSettings, IconSparkles, IconX,
} from '@tabler/icons-react';
import { playChime, playClick } from '@/audio/click';
import {
  corePool, isInBank, matchesEnding, matchHeard, rhymeCount, rhymeWords, RHYME_ENDINGS,
} from '@/wordbank/pl/rhymes';
import { useSpeechInput } from '@/lib/useSpeechInput';
import { loadProgress, recordRound, type Progress } from '@/storage/rhymeProgress';
import { endingReport, pickPlanEnding, reviewPicks, type ReviewPick } from './review';
import { fmtTime } from '@/lib/format';
import { fmtDuration, isAutoEnding, rhymeWord, type FamilyConfig } from './config';

/** One word you rhymed to, plus what you managed to write for it. */
type Round = { ending: string; seed: string; entries: string[] };

/** A finished round, split into what counts as what. */
type Scored = Round & {
  /** rymy z naszego banku */
  produced: string[];
  /** twoje słowa, których w banku nie było — dopisują się do banku */
  ownWords: string[];
  /** wpisane, ale nie rymuje się — pokazujemy i zapominamy */
  offWords: string[];
  /** trzy słowa do zapamiętania — tylko te idą do powtórek */
  picks: ReviewPick[];
  /** wpisane po raz pierwszy w historii */
  fresh: Set<string>;
};

/** Rymy to te wpisy, które faktycznie pasują do końcówki. */
const rhymesOnly = (entries: string[], ending: string) =>
  entries.filter((w) => matchesEnding(w, ending));

export function RhymeRun({ config, onExit }: { config: FamilyConfig; onExit: () => void }) {
  const multi = config.sessionMode !== 'single';
  const timed = config.sessionMode === 'timed';
  // Trzy słowa zapamiętasz, dwanaście przeczytasz i zapomnisz.
  const pickLimit = multi ? 2 : 3;

  // Stan sprzed sesji — po nim ustawiamy kolejność powtórek i oznaczamy
  // „pierwszy raz", żeby zapis rundy nie zmieniał tego, co właśnie pokazujemy.
  const progressAtStart = useRef<Progress>(loadProgress());

  /**
   * Kolejka końcówek do odtworzenia — ustawia ją „jeszcze raz, te same
   * końcówki" w trybach wielosłowowych. Puste = dobieramy normalnie.
   */
  const replay = useRef<{ list: string[]; i: number } | null>(null);

  const pickEnding = useMemo(
    () => () => {
      const r = replay.current;
      if (r && r.i < r.list.length) return r.list[r.i++];
      if (config.ending === 'plan') return pickPlanEnding(progressAtStart.current);
      if (config.ending === 'random') return RHYME_ENDINGS[Math.floor(Math.random() * RHYME_ENDINGS.length)];
      return config.ending;
    },
    [config.ending],
  );

  // The prompt is a concrete word, not a bare ending — you rhyme to something.
  // Z trzonu rodziny, żeby na tablicy nie lądowało „ogólnikowość".
  // Never repeat a word inside one session.
  const usedSeeds = useRef(new Set<string>());
  const pickSeed = useMemo(
    () => (e: string) => {
      const core = e ? corePool(e) : [];
      const pool = core.filter((w) => !usedSeeds.current.has(w));
      const from = pool.length ? pool : core;
      const word = from.length ? from[Math.floor(Math.random() * from.length)] : '';
      if (word) usedSeeds.current.add(word);
      return word;
    },
    [],
  );

  /** Dowolna rodzina poza tą — na „jeszcze raz, inna końcówka". */
  const randomOther = (current: string) => {
    const rest = RHYME_ENDINGS.filter((e) => e !== current);
    return rest[Math.floor(Math.random() * rest.length)] ?? current;
  };

  const [ending, setEnding] = useState(pickEnding);
  const [seed, setSeed] = useState(() => pickSeed(ending));
  const [entries, setEntries] = useState<string[]>([]);
  // Lustro `entries` dla serii słów przychodzących z mikrofonu w jednym ticku.
  const entriesRef = useRef<string[]>([]);
  entriesRef.current = entries;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [hints, setHints] = useState(false);
  const [mic, setMic] = useState(config.voice);
  const [done, setDone] = useState(false);

  const totalMs = config.seconds * 1000;
  const wordMs = config.wordSeconds * 1000;
  const [remaining, setRemaining] = useState(totalMs);
  const [wordRemaining, setWordRemaining] = useState(wordMs);
  const [running, setRunning] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  /** Bank the current word and move on. */
  function nextWord(finished: string[] = entriesRef.current) {
    setRounds((r) => [...r, { ending, seed, entries: finished }]);
    const nextEnding = isAutoEnding(config.ending) ? pickEnding() : ending;
    setEnding(nextEnding);
    setSeed(pickSeed(nextEnding));
    entriesRef.current = [];
    setEntries([]);
    setInput('');
    setError('');
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

  // Metronom milknie przy włączonym mikrofonie: klik wchodzi prosto w nasłuch,
  // a na iOS start rozpoznawania potrafi przyciąć Web Audio.
  useEffect(() => {
    if (config.bpm <= 0 || !running || done || mic) return;
    const id = window.setInterval(() => playClick({ volume: 0.35 }), 60000 / config.bpm);
    return () => window.clearInterval(id);
  }, [config.bpm, running, done, mic]);

  // --- mikrofon -------------------------------------------------------------

  /**
   * Co mikrofon usłyszał, a czego nie przyjęliśmy. Pokazujemy to jawnie —
   * przy ciągłym nasłuchu ciche gubienie słów wygląda jak awaria.
   */
  const [noise, setNoise] = useState<Array<{ word: string; why: 'reject' | 'dup' }>>([]);
  const noiseTimer = useRef<number | undefined>(undefined);

  function pushNoise(word: string, why: 'reject' | 'dup') {
    setNoise((n) => [{ word, why }, ...n].slice(0, 6));
    window.clearTimeout(noiseTimer.current);
    noiseTimer.current = window.setTimeout(() => setNoise([]), 5000);
  }

  useEffect(() => () => window.clearTimeout(noiseTimer.current), []);

  /**
   * Usłyszane słowa nie wpadają prosto na listę — najpierw lądują w polu
   * wpisu i dostają ten sam błysk co słowo wpisane z klawiatury: zielony,
   * gdy weszło, czerwony, gdy odpadło. Dzięki temu widać, co mikrofon
   * usłyszał i co z tym zrobiliśmy, zanim słowo trafi między zaliczone.
   *
   * Seria słów z jednego ticku idzie przez kolejkę, jedno po drugim — inaczej
   * zdążyłoby się przewinąć w polu, zanim zdążysz cokolwiek zobaczyć.
   */
  const ECHO_HOLD = 260;  // ile słowo wisi w polu, zanim je ocenimy
  const ECHO_FLASH = 340; // ile trwa sam błysk

  const heardQueue = useRef<string[]>([]);
  const echoRef = useRef(false);
  const echoTimers = useRef<number[]>([]);
  const draft = useRef('');           // to, co pisałeś, gdy wszedł mikrofon
  const [echo, setEcho] = useState(false);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);

  const laterEcho = (fn: () => void, ms: number) => {
    echoTimers.current.push(window.setTimeout(fn, ms));
  };

  function clearEcho() {
    echoTimers.current.forEach(window.clearTimeout);
    echoTimers.current = [];
    heardQueue.current = [];
    setEcho(false);
    setFlash(null);
  }

  function pumpHeard() {
    if (echoRef.current) return;
    const token = heardQueue.current.shift();
    if (token === undefined) {
      // Koniec serii — oddajemy pole z powrotem temu, co pisałeś.
      if (draft.current) { setInput(draft.current); draft.current = ''; }
      return;
    }

    const heard = matchHeard(token, ending);
    echoRef.current = true;
    setEcho(true);
    setInput(heard.word);

    laterEcho(() => {
      let ok = false;
      if (heard.kind === 'reject') {
        pushNoise(heard.word, 'reject');
      } else {
        const result = accept(heard.word);
        if (result === 'duplicate' || result === 'seed') {
          // Duplikat z głosu nie trzęsie polem — przy ciągłym nasłuchu
          // powtórzenia są normalne, nie pomyłką.
          pushNoise(heard.word, 'dup');
        } else {
          ok = true;
        }
        // Zaliczona kwota przeskoczyła na nowe słowo — reszta serii dotyczyła
        // jeszcze poprzedniego, więc ją odpuszczamy.
        if (result === 'advanced') heardQueue.current = [];
      }

      setFlash(ok ? 'ok' : 'bad');
      setInput(heard.word);
      laterEcho(() => {
        setFlash(null);
        setInput('');
        setEcho(false);
        echoRef.current = false;
        pumpRef.current();
      }, ECHO_FLASH);
    }, ECHO_HOLD);
  }

  const pumpRef = useRef(pumpHeard);
  pumpRef.current = pumpHeard;

  function handleHeard(tokens: string[]) {
    if (!echoRef.current && !heardQueue.current.length && input.trim()) draft.current = input.trim();
    heardQueue.current.push(...tokens);
    pumpHeard();
  }

  // Wyłączony mikrofon albo koniec rundy nie zostawia słowa wiszącego w polu.
  useEffect(() => {
    if (mic && running && !done) return;
    clearEcho();
    setInput((v) => (echoRef.current ? '' : v));
    echoRef.current = false;
  }, [mic, running, done]);

  useEffect(() => clearEcho, []);

  const speech = useSpeechInput({
    enabled: mic && running && !done,
    onWords: handleHeard,
  });

  // --- podsumowanie i zapis -------------------------------------------------

  const [scored, setScored] = useState<Scored[] | null>(null);
  const [saved, setSaved] = useState<Progress | null>(null);
  const savedOnce = useRef(false); // StrictMode odpala efekty dwa razy

  useEffect(() => {
    if (!done || savedOnce.current) return;
    savedOnce.current = true;

    const p0 = progressAtStart.current;
    const all: Round[] = [...rounds, { ending, seed, entries }];
    const result: Scored[] = all
      .filter((r) => r.ending)
      .map((r) => {
        const rhymes = rhymesOnly(r.entries, r.ending);
        const produced = rhymes.filter((w) => isInBank(w, r.ending));
        const ownWords = rhymes.filter((w) => !isInBank(w, r.ending));
        const offWords = r.entries.filter((w) => !matchesEnding(w, r.ending));
        const used = new Set([...r.entries, r.seed]);
        return {
          ...r,
          produced,
          ownWords,
          offWords,
          picks: reviewPicks(r.ending, used, p0, pickLimit),
          fresh: new Set([...produced, ...ownWords].filter((w) => (p0.words[w]?.hits ?? 0) === 0)),
        };
      });

    setScored(result);
    // Słowa, które się nie rymują, nigdzie nie trafiają — nie są twoim bankiem.
    setSaved(recordRound(result.map((r) => ({
      ending: r.ending,
      produced: r.produced,
      ownWords: r.ownWords,
      shownMisses: r.picks.map((pick) => pick.word),
    }))));
  }, [done, rounds, ending, seed, entries, pickLimit]);

  const bank = useMemo(
    () => (ending ? corePool(ending).filter((w) => w !== seed) : []),
    [ending, seed],
  );
  const hintSample = useMemo(
    () => [...bank].sort(() => Math.random() - 0.5).slice(0, 24).sort((a, b) => a.localeCompare(b, 'pl')),
    [bank],
  );

  /**
   * Jedna droga dla klawiatury i mikrofonu — dzięki temu tryb `quota`, tryb
   * `timed` i deduplikacja działają tak samo niezależnie od tego, czym wpisujesz.
   *
   * Lista wpisów żyje też w refie, bo z mikrofonu potrafi przyjść kilka słów
   * naraz, w jednym ticku: bez tego drugie słowo z serii czytałoby `entries`
   * sprzed pierwszego i nadpisywało je.
   */
  function accept(word: string): 'added' | 'advanced' | 'duplicate' | 'seed' {
    const value = word.trim().toLowerCase();
    if (!value) return 'duplicate';
    if (entriesRef.current.includes(value)) return 'duplicate';
    if (value === seed.toLowerCase()) return 'seed';

    const next = [value, ...entriesRef.current];
    entriesRef.current = next;
    if (config.sessionMode === 'quota' && rhymesOnly(next, ending).length >= config.quota) {
      nextWord(next);
      return 'advanced';
    }
    setEntries(next);
    return 'added';
  }

  /**
   * Wpuszczamy wszystko, co wpiszesz — przerywanie ci w połowie serii jest
   * gorsze niż parę chybionych słów. Te, które nie trzymają końcówki, dostają
   * inny kolor, po rundzie lecą do jednej linijki i nigdzie się nie zapisują:
   * do banku wchodzi tylko to, co faktycznie się rymuje.
   */
  function submit() {
    const value = input.trim().toLowerCase();
    if (!value) return;
    const reject = (msg: string) => {
      setError(msg);
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
    };

    const result = accept(value);
    if (result === 'duplicate') return reject('Już to masz.');
    if (result === 'seed') return reject('To słowo, do którego rymujesz.');
    setError('');
    setInput('');
    setFlash('ok');
    window.setTimeout(() => setFlash(null), 340);
  }

  /**
   * Powtórka rundy.
   *
   * `keep` — ta sama rodzina. Przy jednym słowie zostaje dokładnie ten sam
   * wyraz (chodzi o to, żeby wrócić do tej samej ściany), przy wielu słowach
   * końcówka zostaje, ale wyrazy lecą nowe.
   *
   * Bez `keep` szukamy innej rodziny niż obecna — przy trybie „Program"
   * podpowie ją program, inaczej losujemy.
   */
  function restart(keep: boolean) {
    const sameSeed = keep && !multi ? seed : '';
    const previous = (scored ?? []).map((r) => r.ending);
    usedSeeds.current.clear();
    progressAtStart.current = loadProgress();
    savedOnce.current = false;
    setScored(null);
    setSaved(null);

    let next = ending;
    if (keep) {
      // te same rodziny w tej samej kolejności, ale wyrazy lecą nowe
      replay.current = multi && previous.length ? { list: previous, i: 0 } : null;
      if (replay.current) next = pickEnding();
    } else {
      replay.current = null;
      // kilka podejść, żeby nie trafić znów na tę samą rodzinę
      next = randomOther(ending);
      for (let i = 0; i < 8 && isAutoEnding(config.ending); i++) {
        const candidate = pickEnding();
        if (candidate !== ending) { next = candidate; break; }
      }
    }
    setEnding(next);

    if (sameSeed) {
      usedSeeds.current.add(sameSeed);
      setSeed(sameSeed);
    } else {
      setSeed(pickSeed(next));
    }
    setEntries([]);
    setRounds([]);
    setInput('');
    setError('');
    setRemaining(totalMs);
    setWordRemaining(wordMs);
    setDone(false);
    setRunning(true);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  const pct = totalMs > 0 ? (1 - remaining / totalMs) * 100 : 0;
  const lastStretch = remaining <= Math.min(10_000, totalMs / 3);
  const liveRhymes = rhymesOnly(entries, ending);

  if (done) {
    const all = scored ?? [];
    const played = all.filter((r) => r.entries.length > 0 || all.length === 1);
    const totalRhymes = all.reduce((n, r) => n + r.produced.length + r.ownWords.length, 0);
    const freshCount = all.reduce((n, r) => n + r.fresh.size, 0);
    const ownCount = all.reduce((n, r) => n + r.ownWords.length, 0);
    const offCount = all.reduce((n, r) => n + r.offWords.length, 0);
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

          {(freshCount > 0 || ownCount > 0 || offCount > 0) && (
            <Group gap="xs" justify="center">
              {freshCount > 0 && (
                <Badge size="lg" variant="light" color="brand" leftSection={<IconSparkles size={12} />}>
                  {freshCount} {freshCount === 1 ? 'nowe słowo' : 'nowych słów'} w twoim banku
                </Badge>
              )}
              {ownCount > 0 && (
                <Badge size="lg" variant="light" color="accent" leftSection={<IconPlus size={12} />}>
                  {ownCount} spoza naszego słownika
                </Badge>
              )}
              {offCount > 0 && (
                <Badge size="lg" variant="light" color="gray" leftSection={<IconAlertTriangle size={12} />}>
                  {offCount} bez rymu
                </Badge>
              )}
            </Group>
          )}

          <Stack gap="sm" w="100%" maw={720}>
            {played.map((round, i) => (
              <RoundResult key={`${round.seed}-${i}`} round={round} />
            ))}
          </Stack>

          {saved && <EndingStanding endings={all.map((r) => r.ending)} progress={saved} />}

          <Stack gap="xs" w="100%" maw={360}>
            <Button
              size="md" color="brand" leftSection={<IconRefresh size={16} />}
              onClick={() => restart(true)}
            >
              {multi ? 'Jeszcze raz, te same końcówki' : 'Jeszcze raz to samo słowo'}
            </Button>
            <Button
              size="md" variant="light" color="brand" leftSection={<IconDice5 size={16} />}
              onClick={() => restart(false)}
            >
              Jeszcze raz, inna końcówka
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
                  ? `${liveRhymes.length} / ${config.quota}`
                  : `${liveRhymes.length} ${rhymeWord(liveRhymes.length)}`}
              </Badge>
              {config.bpm > 0 && (
                <Tooltip
                  label={mic ? 'Metronom milczy, żeby nie wchodzić w mikrofon' : `${config.bpm} BPM`}
                  withArrow
                >
                  <Badge
                    size="lg" variant="light" color="gray"
                    style={mic ? { opacity: 0.45, textDecoration: 'line-through' } : undefined}
                  >
                    {config.bpm} BPM
                  </Badge>
                </Tooltip>
              )}
            </Group>
          </Group>
        </Stack>
        <ProgressBar value={pct} color={lastStretch ? 'red' : 'brand'} size="sm" mt="sm" transitionDuration={120} />
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
          <div
            className={shake || flash === 'bad' ? 'rymy-shake' : flash === 'ok' ? 'rymy-flash-ok' : ''}
            style={{ flex: 1, maxWidth: 420, minWidth: 0 }}
          >
            <TextInput
              ref={inputRef}
              size="lg"
              placeholder={seed ? `wpisz rym do „${seed}"` : `wpisz rym na -${ending}`}
              value={input}
              onChange={(e) => { setInput(e.currentTarget.value); if (error) setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              disabled={!running}
              readOnly={echo}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="done"
              error={error || undefined}
            />
          </div>
          <Group gap="sm" wrap="nowrap" justify="center">
            <Button size="lg" color="brand" onClick={submit} disabled={!input.trim() || !running || echo}>
              Dodaj
            </Button>
            {speech.supported && (
              <Tooltip label={mic ? 'Wyłącz mikrofon' : 'Mów zamiast pisać'} withArrow>
                <ActionIcon
                  size={50} radius="xl"
                  variant={mic ? 'filled' : 'default'}
                  color={mic ? 'red' : 'gray'}
                  className={mic && speech.state === 'listening' ? 'rymy-pulse' : undefined}
                  onClick={() => setMic((m) => !m)}
                  disabled={!running}
                  aria-label={mic ? 'Wyłącz mikrofon' : 'Włącz mikrofon'}
                >
                  {mic ? <IconMicrophone size={22} /> : <IconMicrophoneOff size={22} />}
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Flex>

        {mic && (
          <Stack gap={6} mt="sm" align="center">
            {speech.state === 'denied' ? (
              <Text size="sm" c="red.4">
                Brak dostępu do mikrofonu — wpuść go w ustawieniach przeglądarki albo pisz dalej.
              </Text>
            ) : speech.state === 'error' ? (
              <Text size="sm" c="red.4">
                Rozpoznawanie się wysypało. Spróbuj jeszcze raz albo wróć do klawiatury.
              </Text>
            ) : (
              <Text size="sm" c="dimmed" fs="italic" style={{ minHeight: 22 }}>
                {speech.interim || (speech.state === 'listening' ? 'słucham…' : 'uruchamiam mikrofon…')}
              </Text>
            )}

            {noise.length > 0 && (
              <Group gap={6} wrap="wrap" justify="center">
                {noise.map(({ word, why }, i) => (
                  <Badge
                    key={`${word}-${i}`} size="sm" variant="light" color="gray"
                    style={{ opacity: 0.7 }}
                  >
                    {word} · {why === 'dup' ? 'już masz' : 'nie rym'}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
        )}

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
            {entries.map((w) => {
              // rym z banku / twój własny rym / w ogóle nie ta końcówka
              const color = !matchesEnding(w, ending) ? 'gray' : isInBank(w, ending) ? 'brand' : 'accent';
              return (
                <Badge
                  key={w} size="lg" variant="light" color={color}
                  style={color === 'gray' ? { opacity: 0.6, textDecoration: 'line-through' } : undefined}
                  rightSection={
                    <ActionIcon size="xs" variant="transparent" c="inherit" onClick={() => setEntries((e) => e.filter((x) => x !== w))}>
                      <IconX size={12} />
                    </ActionIcon>
                  }
                >
                  {w}
                </Badge>
              );
            })}
          </Group>
        )}
      </Paper>

      {hints && (
        <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
          <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="sm">
            Z trzonu rodziny — {hintSample.length} z {bank.length}
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

const PICK_LABEL: Record<ReviewPick['kind'], string> = {
  due: 'już to widziałeś — wraca',
  lapsed: 'umiałeś to wcześniej, dziś nie użyłeś',
  new: 'nowe — jeszcze go nie widziałeś',
};

const PICK_COLOR: Record<ReviewPick['kind'], string> = {
  due: 'orange',
  lapsed: 'red',
  new: 'gray',
};

/** One word from the session: what you wrote, and what comes back next time. */
function RoundResult({ round }: { round: Scored }) {
  const [open, setOpen] = useState(false);
  const rhymes = [...round.produced, ...round.ownWords];

  const rest = useMemo(() => {
    const used = new Set([...round.entries, ...round.picks.map((p) => p.word)]);
    return rhymeWords(round.ending).filter((w) => w !== round.seed && !used.has(w));
  }, [round]);

  return (
    <Paper withBorder p="md" radius="md" bg="rgba(255,255,255,0.02)" ta="left">
      <Group justify="space-between" wrap="wrap" gap="xs" mb="sm">
        <Group gap={8}>
          <Text fw={700}>{round.seed}</Text>
          <Badge size="sm" variant="light" color="gray">-{round.ending}</Badge>
        </Group>
        <Badge size="sm" variant="light" color={rhymes.length ? 'brand' : 'gray'}>
          {rhymes.length} {rhymeWord(rhymes.length)}
        </Badge>
      </Group>

      {rhymes.length > 0 && (
        <Group gap={6} wrap="wrap" mb="sm">
          {rhymes.map((w) => {
            const own = round.ownWords.includes(w);
            const label = own ? 'twoje słowo — dopisane do banku' : round.fresh.has(w) ? 'pierwszy raz' : undefined;
            const badge = (
              <Badge
                size="lg" variant="light" color={own ? 'accent' : 'brand'}
                leftSection={own ? <IconPlus size={11} /> : round.fresh.has(w) ? <IconSparkles size={11} /> : undefined}
              >
                {w}
              </Badge>
            );
            return label
              ? <Tooltip key={w} label={label} withArrow>{badge}</Tooltip>
              : <Box key={w}>{badge}</Box>;
          })}
        </Group>
      )}

      {round.offWords.length > 0 && (
        <Group gap={6} wrap="nowrap" align="start" mb="sm">
          <IconAlertTriangle size={14} style={{ marginTop: 2, flexShrink: 0, opacity: 0.6 }} />
          <Text size="xs" c="dimmed">
            +{round.offWords.length} nie {round.offWords.length === 1 ? 'kończy' : 'kończą'} się
            na -{round.ending} ({round.offWords.join(', ')}) — nie liczymy ich i nie zapisujemy.
          </Text>
        </Group>
      )}

      {round.picks.length > 0 && (
        <>
          <Text size="sm" fw={700} mb={2}>Do zapamiętania</Text>
          <Text size="xs" c="dimmed" mb="sm">
            {round.picks.length === 1 ? 'Jedno słowo' : `${round.picks.length} słowa`} na teraz —
            wrócą w kolejnych rundach, dopóki ich nie wpiszesz. Reszta rodziny: {rest.length}.
          </Text>
          <Group gap={6} wrap="wrap">
            {round.picks.map(({ word, kind }) => (
              <Tooltip key={word} label={PICK_LABEL[kind]} withArrow>
                <Badge
                  size="lg" variant="light" color={PICK_COLOR[kind]}
                  leftSection={
                    kind === 'due' ? <IconRotateClockwise size={11} />
                      : kind === 'lapsed' ? <IconAlertTriangle size={11} />
                        : undefined
                  }
                >
                  {word}
                </Badge>
              </Tooltip>
            ))}
          </Group>

          {rest.length > 0 && (
            <>
              <Collapse in={open}>
                <Text size="xs" c="dimmed" mt="md" mb="xs">
                  Cała rodzina -{round.ending} ({rhymeCount(round.ending)} słów), alfabetycznie:
                </Text>
                <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing={6}>
                  {rest.map((w) => (
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
                {open ? 'Zwiń' : `Pokaż resztę rodziny (${rest.length})`}
              </Button>
            </>
          )}
        </>
      )}
    </Paper>
  );
}

/** Gdzie jesteś z rodzinami, które właśnie ćwiczyłeś. */
function EndingStanding({ endings, progress }: { endings: string[]; progress: Progress }) {
  const reports = useMemo(
    () => [...new Set(endings)].map((e) => endingReport(e, progress)),
    [endings, progress],
  );

  return (
    <Stack gap="xs" w="100%" maw={720}>
      <Text size="sm" fw={700} ta="left">Twój bank po tej sesji</Text>
      {reports.map((r) => (
        <Paper key={r.ending} withBorder p="sm" radius="md" bg="rgba(255,255,255,0.02)">
          <Group justify="space-between" gap="xs" mb={6}>
            <Badge size="sm" variant="light" color="gray">-{r.ending}</Badge>
            <Text size="xs" c="dimmed">
              {r.known} / {r.coreSize} z trzonu
              {r.own > 0 && ` · +${r.own} twoich`}
              {r.due > 0 && ` · ${r.due} do powtórki`}
              {r.lapsed > 0 && ` · ${r.lapsed} wypadło`}
            </Text>
          </Group>
          <ProgressBar value={r.pct * 100} color="brand" size="sm" />
        </Paper>
      ))}
    </Stack>
  );
}
