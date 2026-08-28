import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Flex,
  Group,
  Paper,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowRight,
  IconEye,
  IconMicrophone,
  IconMicrophoneOff,
  IconQuestionMark,
  IconX,
} from "@tabler/icons-react";
import { playChime, playClick } from "@/audio/click";
import { rhymeQuality, type RhymeQuality } from "@/wordbank/pl/phonetics";
import { useSpeechInput } from "@/lib/useSpeechInput";
import { recordPalaceRun, type PalaceProgress } from "@/storage/palaceProgress";
import { fmtTime } from "@/lib/format";
import {
  ENTER_MS,
  GAP_MS,
  WALK_MS,
  levelDef,
  type PalaceConfig,
} from "./config";
import { roomsFor } from "./rooms";
import { pickWords } from "./words";
import { Walk3D } from "./Walk3D";
import { FloorPlan } from "./FloorPlan";
import { PalaceSummary } from "./Summary";
import { useIsMobile } from "./useIsMobile";

type Phase = "memorize" | "gap" | "recall" | "summary";

/** Kartki zamiast spaceru — wtedy „przejście" to tylko zmiana obrazka. */
const CUT_MS = 260;

/**
 * Runda pałacu: obchód → przerwa → odtworzenie z rymem → podsumowanie.
 *
 * Obchód nic od ciebie nie chce: stoisz w pokoju, patrzysz na słowo, idziesz
 * dalej. Cała robota jest przy odtwarzaniu — najpierw wyjmujesz z pokoju słowo,
 * a potem dorzucasz do niego rym. Rym stoi właśnie tam, bo o to w tej aplikacji
 * chodzi: nie „czy pamiętam listę", tylko „czy mam to słowo na tyle, żeby coś
 * z nim od razu zrobić".
 *
 * Trzy rzeczy są celowe i nie należy ich „naprawiać":
 * 1. W fazie odtwarzania nie ma ani jednego sygnału o poprawności. Człowiek,
 *    który widzi czerwone pole, uczy się poprawiania, a nie przypominania.
 * 2. Rym sprawdzamy względem słowa, które TY podałeś, nigdy względem tego,
 *    które było w pokoju — inaczej samo „to się nie rymuje" zdradzałoby,
 *    że pomyliłeś słowo.
 * 3. Wracać do poprzedniego pokoju nie można — pałac idzie w jedną stronę.
 */
export function PalaceRun({
  config,
  onExit,
  onSaved,
  roomImages,
}: {
  config: PalaceConfig;
  onExit: () => void;
  onSaved: (p: PalaceProgress) => void;
  roomImages?: (string | undefined | null)[];
}) {
  const def = levelDef(config.level);
  const mobile = useIsMobile();

  const [seed, setSeed] = useState(0); // zmiana = nowy zestaw słów
  const words = useMemo(
    () => pickWords(def.words, config.category),
    [def.words, config.category, seed],
  );
  const rooms = useMemo(() => roomsFor(def.words), [def.words]);

  const [phase, setPhase] = useState<Phase>("memorize");
  const [index, setIndex] = useState(0);

  // --- faza 1: obchód — popatrz i idź dalej ---------------------------------

  const paceMs = config.pace * 1000;
  const [walking, setWalking] = useState(true);
  const [roomLeft, setRoomLeft] = useState(paceMs);

  /** Ile trwa dojście do pokoju `i`: z progu dłużej niż z sąsiednich drzwi. */
  const travelTo = useCallback(
    (i: number) => (config.walk3d ? (i === 0 ? ENTER_MS : WALK_MS) : CUT_MS),
    [config.walk3d],
  );

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= words.length) {
        setPhase("gap");
        return i;
      }
      playClick({ volume: 0.22 });
      return i + 1;
    });
  }, [words.length]);
  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Dojście do pokoju. Słowo pojawia się dopiero po przyjściu na miejsce —
  // widać je wtedy, kiedy się w tym pokoju stoi, a nie zza drzwi.
  useEffect(() => {
    if (phase !== "memorize") return;
    setWalking(true);
    const t = window.setTimeout(() => setWalking(false), travelTo(index));
    return () => window.clearTimeout(t);
  }, [phase, index, travelTo]);

  // Postój w pokoju: tyle sekund, ile ustawiłeś, i drzwi dalej.
  useEffect(() => {
    if (phase !== "memorize" || walking) return;
    // Ustawiamy pełny pasek od razu: bez tego przez jedną klatkę widać
    // wartość z poprzedniego pokoju, czyli pasek dobity do końca.
    setRoomLeft(paceMs);
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const left = paceMs - (performance.now() - start);
      setRoomLeft(Math.max(0, left));
      if (left <= 0) {
        advanceRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, walking, index, paceMs]);

  // --- faza 2: przerwa ------------------------------------------------------

  const [gapLeft, setGapLeft] = useState(GAP_MS);

  useEffect(() => {
    if (phase !== "gap") return;
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const left = GAP_MS - (performance.now() - start);
      setGapLeft(Math.max(0, left));
      if (left <= 0) {
        setPhase("recall");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // --- faza 3: odtwarzanie — słowo, a potem rym do niego --------------------

  type Slot = "word" | "rhyme";
  const [answers, setAnswers] = useState<string[]>([]);
  const [rhymes, setRhymes] = useState<string[]>([]);
  const [rhymeQ, setRhymeQ] = useState<RhymeQuality[]>([]);
  const [slot, setSlot] = useState<Slot>("word");
  /** słowo, które właśnie podałeś — to do niego rymujesz */
  const [pending, setPending] = useState("");
  const [input, setInput] = useState("");
  const [rhymeError, setRhymeError] = useState("");
  const [shake, setShake] = useState(false);
  const [recallStart, setRecallStart] = useState(0);
  const [recallMs, setRecallMs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [mic, setMic] = useState(config.voice);
  const recallRef = useRef<HTMLInputElement>(null);
  const answersRef = useRef<string[]>([]);
  const rhymesRef = useRef<string[]>([]);
  answersRef.current = answers;
  rhymesRef.current = rhymes;

  useEffect(() => {
    if (phase !== "recall") return;
    const start = performance.now();
    setRecallStart(start);
    let raf = 0;
    const tick = () => {
      setElapsed(performance.now() - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  useEffect(() => {
    if (phase === "recall")
      window.setTimeout(() => recallRef.current?.focus(), 0);
  }, [phase, slot, answers.length]);

  /** Zamyka pokój: słowo, rym (może być pusty) i drzwi dalej. */
  const commit = useCallback(
    (word: string, rhyme: string, q: RhymeQuality) => {
      const next = [...answersRef.current, word];
      answersRef.current = next;
      setAnswers(next);
      rhymesRef.current = [...rhymesRef.current, rhyme];
      setRhymes(rhymesRef.current);
      setRhymeQ((qs) => [...qs, q]);
      setSlot("word");
      setPending("");
      setInput("");
      setRhymeError("");
      if (next.length >= words.length) {
        setRecallMs(performance.now() - recallStart);
        playChime(0.25);
        setPhase("summary");
      }
    },
    [words.length, recallStart],
  );

  /** Podane słowo — przechodzimy do rymu. Puste („nie pamiętam") zamyka pokój. */
  const answer = useCallback(
    (value: string) => {
      const w = value.trim().toLowerCase();
      if (!w) {
        commit("", "", 0);
        return;
      }
      setPending(w);
      setSlot("rhyme");
      setInput("");
    },
    [commit],
  );

  /** Rym do TWOJEGO słowa — o poprawności przypomnienia nie mówimy ani słowa. */
  const tryRhyme = useCallback(
    (value: string) => {
      const r = value.trim().toLowerCase();
      if (!r || !pending) return false;
      const v = rhymeQuality(r, pending);
      if (v.q === 0) {
        setRhymeError(
          r === pending
            ? "To jest to słowo."
            : `„${r}" nie rymuje się z „${pending}".`,
        );
        setShake(true);
        window.setTimeout(() => setShake(false), 350);
        return false;
      }
      commit(pending, r, v.q);
      return true;
    },
    [pending, commit],
  );

  /**
   * Całe ćwiczenie jest na czas, więc mikrofon nie czeka na zatwierdzenie.
   * „Klucz, tłucz" jednym tchem zamyka pokój od razu: pierwsze słowo jest
   * odpowiedzią, a wśród kolejnych szukamy rymu do niego.
   */
  const handleHeard = useCallback(
    (tokens: string[]) => {
      if (phase !== "recall") return;
      if (slot === "rhyme") {
        for (const t of tokens) if (tryRhyme(t)) return;
        return;
      }
      const [first, ...rest] = tokens;
      const w = first?.trim().toLowerCase();
      if (!w) return;
      for (const t of rest) {
        const v = rhymeQuality(t, w);
        if (v.q > 0) {
          commit(w, t.trim().toLowerCase(), v.q);
          return;
        }
      }
      answer(w);
    },
    [phase, slot, answer, tryRhyme, commit],
  );

  const speech = useSpeechInput({
    enabled: mic && phase === "recall",
    onWords: handleHeard,
  });

  // --- zapis ----------------------------------------------------------------

  const [saved, setSaved] = useState<PalaceProgress | null>(null);
  const savedOnce = useRef(false); // StrictMode odpala efekty dwa razy

  useEffect(() => {
    if (phase !== "summary" || savedOnce.current) return;
    savedOnce.current = true;
    const p = recordPalaceRun({
      level: config.level,
      words,
      answers: answersRef.current,
      rhymes: rhymesRef.current,
      recallMs,
      used3d: config.walk3d,
      voice: config.voice,
    });
    setSaved(p);
    onSaved(p);
  }, [
    phase,
    config.level,
    config.walk3d,
    config.voice,
    words,
    recallMs,
    onSaved,
  ]);

  function restart(sameWords: boolean) {
    savedOnce.current = false;
    setSaved(null);
    if (!sameWords) setSeed((s) => s + 1);
    setAnswers([]);
    answersRef.current = [];
    setRhymes([]);
    rhymesRef.current = [];
    setRhymeQ([]);
    setSlot("word");
    setPending("");
    setInput("");
    setRhymeError("");
    setRecallMs(0);
    setElapsed(0);
    setGapLeft(GAP_MS);
    setRoomLeft(paceMs);
    setIndex(0);
    setWalking(true);
    setPhase("memorize");
  }

  // --- widoki ---------------------------------------------------------------

  if (phase === "summary") {
    return (
      <PalaceSummary
        level={config.level}
        words={words}
        answers={answers}
        recallMs={recallMs}
        progress={saved}
        rhymes={rhymes}
        rhymeQuality={rhymeQ}
        onRepeatSame={() => restart(true)}
        onNewSet={() => restart(false)}
        onExit={onExit}
      />
    );
  }

  const room = rooms[Math.min(index, rooms.length - 1)];
  const sceneHeight = mobile ? 260 : 360;
  const here = answers.length;

  return (
    <Stack gap="md" my="md">
      <Paper withBorder p={{ base: "sm", sm: "md" }} radius="md">
        <Group justify="space-between" wrap="wrap" gap="xs">
          <Group gap="xs">
            <Badge size="lg" variant="light" color="brand">
              {phase === "memorize"
                ? "Obchód"
                : phase === "gap"
                  ? "Przerwa"
                  : "Odtwarzaj"}
            </Badge>
            <Badge size="lg" variant="light" color="gray">
              poziom {config.level} · {def.words} słów
            </Badge>
            {phase === "recall" && (
              <Badge size="lg" variant="light" color="accent" ff="monospace">
                {fmtTime(elapsed)}
              </Badge>
            )}
          </Group>
          <Button
            size="sm"
            variant="subtle"
            color="gray"
            leftSection={<IconX size={14} />}
            onClick={onExit}
          >
            Zakończ
          </Button>
        </Group>
      </Paper>

      {phase === "memorize" && (
        <Paper withBorder p={{ base: "sm", sm: "md" }} radius="md">
          <Stack gap="sm">
            <Group justify="space-between" wrap="wrap" gap="xs">
              <Text size="sm" c="dimmed">
                Pokój {index + 1} z {words.length} · {room.name}
              </Text>
              <Badge variant="light" color={walking ? "gray" : "brand"}>
                {walking ? "idziesz…" : `${room.prop} ${words[index]}`}
              </Badge>
            </Group>

            {config.walk3d ? (
              <Walk3D
                rooms={rooms}
                index={index}
                word={walking ? undefined : words[index]}
                height={sceneHeight}
                roomImages={roomImages}
              />
            ) : (
              <Box
                style={{
                  height: sceneHeight,
                  borderRadius: 12,
                  background: "#0b0d11",
                  border: "1px solid var(--mantine-color-dark-5)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {!walking && (
                  <Text
                    style={{
                      fontSize: "clamp(28px, 9vw, 54px)",
                      fontWeight: 800,
                      lineHeight: 1.05,
                      letterSpacing: "-0.02em",
                      color: "#fdf8ec",
                      wordBreak: "break-word",
                      textAlign: "center",
                      padding: "0 24px",
                    }}
                  >
                    {words[index]}
                  </Text>
                )}
              </Box>
            )}

            {/* Plan buduje mapę mieszkania: spacer pokazuje pokój od środka,
                plan — gdzie ten pokój leży względem pozostałych. */}
            {config.walk3d && (
              <FloorPlan
                rooms={rooms}
                current={index}
                labels={(i) => (i < index ? words[i] : undefined)}
                height={mobile ? 176 : 200}
              />
            )}

            {/* Pasek postoju: widać, że pokój sam się skończy i nie ma co
                czekać na przycisk. */}
            <Progress
              value={walking ? 0 : (1 - roomLeft / paceMs) * 100}
              color={walking ? "gray" : "brand"}
              size="sm"
              transitionDuration={120}
            />

            <Text size="xs" c="dimmed" ta="center">
              {walking
                ? "Zapamiętuj drogę — którędy się tu szło."
                : "Zobacz to słowo w tym miejscu. Nic nie musisz wpisywać — rym dorzucisz przy odtwarzaniu."}
            </Text>
            <Group justify="center">
              <Button
                size="sm"
                variant="subtle"
                color="gray"
                rightSection={<IconArrowRight size={14} />}
                disabled={walking}
                onClick={() => advance()}
              >
                Mam to — dalej
              </Button>
            </Group>
          </Stack>
        </Paper>
      )}

      {phase === "gap" && (
        <Paper withBorder p={{ base: "md", sm: "xl" }} radius="md" ta="center">
          <Stack gap="md" align="center">
            <Text
              style={{ fontSize: "clamp(22px, 7vw, 30px)", fontWeight: 800 }}
            >
              Przerwa
            </Text>
            <Text
              style={{ fontSize: "clamp(44px, 14vw, 64px)", fontWeight: 800 }}
              c="brand.3"
              ff="monospace"
            >
              {Math.ceil(gapLeft / 1000)}
            </Text>
            <Button
              variant="light"
              color="brand"
              onClick={() => setPhase("recall")}
            >
              Jestem gotowy
            </Button>
          </Stack>
        </Paper>
      )}

      {phase === "recall" && (
        <Paper withBorder p={{ base: "sm", sm: "md" }} radius="md">
          <Stack gap="sm">
            <Text size="sm" c="dimmed" ta="center">
              Pokój {here + 1} z {words.length} · {rooms[here]?.name}
            </Text>

            {/* Kamera dochodzi w swoim tempie, ale pole jest czynne od razu —
                faza jest na czas i nikt nie ma czekać na animację. */}
            {config.walk3d ? (
              <Walk3D
                rooms={rooms}
                index={here}
                height={sceneHeight}
                roomImages={roomImages}
              />
            ) : (
              <Box
                style={{
                  height: 64,
                  borderRadius: 12,
                  background: "#0b0d11",
                  border: "1px solid var(--mantine-color-dark-5)",
                }}
              />
            )}

            {slot === "rhyme" && (
              <Group justify="center" gap={8}>
                <Text size="sm" c="dimmed">
                  wyjąłeś stąd
                </Text>
                <Badge size="lg" variant="filled" color="brand">
                  {pending}
                </Badge>
                <Text size="sm" c="dimmed">
                  — teraz rym do tego słowa
                </Text>
              </Group>
            )}

            {/* Na telefonie pole idzie nad przyciski — trzy elementy w jednym
                rzędzie zjadają się nawzajem przy 360 px. */}
            <Flex
              direction={{ base: "column", xs: "row" }}
              align={{ base: "stretch", xs: "center" }}
              justify="center"
              gap="sm"
            >
              <Box
                className={shake ? "rymy-shake" : undefined}
                style={{ flex: 1, maxWidth: 360, minWidth: 0 }}
              >
                <TextInput
                  ref={recallRef}
                  size="lg"
                  placeholder={
                    slot === "word" ? "co tu było?" : `rym do „${pending}"`
                  }
                  value={input}
                  onChange={(e) => {
                    setInput(e.currentTarget.value);
                    if (rhymeError) setRhymeError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter" || !input.trim()) return;
                    if (slot === "word") answer(input);
                    else tryRhyme(input);
                  }}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  error={rhymeError || undefined}
                />
              </Box>
              <Group gap="sm" wrap="nowrap" justify="center">
                <Button
                  size="lg"
                  color="brand"
                  flex={1}
                  disabled={!input.trim()}
                  onClick={() =>
                    slot === "word" ? answer(input) : tryRhyme(input)
                  }
                >
                  Dalej
                </Button>
                {speech.supported && (
                  <Tooltip
                    label={mic ? "Wyłącz mikrofon" : "Mów zamiast pisać"}
                    withArrow
                  >
                    <ActionIcon
                      size={50}
                      radius="xl"
                      variant={mic ? "filled" : "default"}
                      color={mic ? "red" : "gray"}
                      className={
                        mic && speech.state === "listening"
                          ? "rymy-pulse"
                          : undefined
                      }
                      onClick={() => setMic((m) => !m)}
                      aria-label={mic ? "Wyłącz mikrofon" : "Włącz mikrofon"}
                    >
                      {mic ? (
                        <IconMicrophone size={22} />
                      ) : (
                        <IconMicrophoneOff size={22} />
                      )}
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Flex>

            {mic && (
              <Text
                size="sm"
                c={speech.state === "denied" ? "red.4" : "dimmed"}
                fs="italic"
                ta="center"
              >
                {speech.state === "denied"
                  ? "Brak dostępu do mikrofonu — wpuść go w ustawieniach albo pisz."
                  : speech.interim ||
                    (speech.state === "listening"
                      ? "słucham…"
                      : "uruchamiam mikrofon…")}
              </Text>
            )}

            <Group justify="center" gap="xs">
              {slot === "word" ? (
                <Button
                  size="sm"
                  variant="subtle"
                  color="gray"
                  leftSection={<IconQuestionMark size={14} />}
                  onClick={() => answer("")}
                >
                  Nie pamiętam
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="subtle"
                  color="gray"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => commit(pending, "", 0)}
                >
                  Nie mam rymu — dalej
                </Button>
              )}
            </Group>

            {/* Same znaczniki — bez treści i bez oceny. Widać tylko, ile już przeszedłeś. */}
            {config.walk3d && (
              <FloorPlan
                rooms={rooms}
                current={here}
                height={mobile ? 168 : 190}
              />
            )}

            <Group justify="center" gap={6} wrap="wrap">
              {words.map((_, i) => (
                <Box
                  key={i}
                  w={26}
                  h={26}
                  style={{
                    borderRadius: 6,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 11,
                    border: `1px solid ${i < here ? "var(--mantine-color-brand-6)" : "var(--mantine-color-dark-4)"}`,
                    background:
                      i < here ? "rgba(243,184,29,0.14)" : "transparent",
                    color: "var(--mantine-color-dimmed)",
                  }}
                >
                  {i + 1}
                </Box>
              ))}
            </Group>
            <Text size="xs" c="dimmed" ta="center">
              <IconEye size={12} style={{ verticalAlign: -2 }} /> Wynik
              zobaczysz dopiero na końcu.
            </Text>
          </Stack>
        </Paper>
      )}

      {phase === "memorize" && (
        <SimpleGrid cols={{ base: 4, sm: 8 }} spacing={6}>
          {words.map((_, i) => (
            <Box
              key={i}
              h={6}
              style={{
                borderRadius: 3,
                background:
                  i <= index
                    ? "var(--mantine-color-brand-6)"
                    : "var(--mantine-color-dark-5)",
              }}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
