import { useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  UnstyledButton,
  Paper,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import {
  IconArrowLeft,
  IconChartBar,
  IconDice5,
  IconHeart,
  IconInfinity,
  IconListCheck,
  IconMetronome,
  IconRoute,
  IconStopwatch,
  IconTargetArrow,
} from "@tabler/icons-react";
import { WizardStepper, type StepDef } from "@/components/wizard/WizardStepper";
import {
  StepShell,
  Section,
  WizardFooter,
} from "@/components/wizard/StepShell";
import { ReadyPanel } from "@/components/wizard/ReadyPanel";
import { ChoiceCard } from "@/components/wizard/ChoiceCard";
import { RHYME_ENDINGS, rhymeCount } from "@/wordbank/pl/rhymes";
import { loadProgress } from "@/storage/rhymeProgress";
import { RhymeRun } from "./family/RhymeRun";
import { ProgressPanel } from "./family/ProgressPanel";
import {
  allReports,
  endingReport,
  pickPlanEnding,
  planReason,
  totals,
} from "./family/review";
import {
  DURATIONS,
  QUOTA_CHOICES,
  WORD_SECONDS_CHOICES,
  defaultFamilyConfig,
  fmtDuration,
  isAutoEnding,
  minSecondsFor,
  rhymeWord,
  sessionModeLabel,
  type FamilyConfig,
} from "./family/config";

const BPMS = [0, 60, 75, 90, 110];

/** Firefox nie ma Web Speech API — wtedy nie obiecujemy mikrofonu w kreatorze. */
const speechSupported =
  typeof window !== "undefined" &&
  !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

export function RhymeFamily() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<FamilyConfig>(defaultFamilyConfig);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [viewingProgress, setViewingProgress] = useState(false);
  // Odświeżamy po każdym powrocie z rundy — wtedy postęp się zmienił.
  const [progress, setProgress] = useState(loadProgress);

  const patch = (p: Partial<FamilyConfig>) =>
    setConfig((c) => ({ ...c, ...p }));

  const endings = RHYME_ENDINGS;
  const auto = isAutoEnding(config.ending);
  const bankSize = auto ? 0 : rhymeCount(config.ending);

  const reports = useMemo(() => allReports(progress), [progress]);
  const sum = useMemo(() => totals(reports), [reports]);
  const coverage = useMemo(
    () => new Map(reports.map((r) => [r.ending, r])),
    [reports],
  );
  // Podgląd tego, co program wybierze — bez losowania, po prostu najsłabsza.
  const planPick = useMemo(
    () =>
      sum.rounds === 0
        ? null
        : endingReport(pickPlanEnding(progress), progress),
    [progress, sum.rounds],
  );

  const endingHint =
    config.ending === "plan"
      ? planPick
        ? `program · np. -${planPick.ending}`
        : "program"
      : config.ending === "random"
        ? "losowa"
        : config.ending === "basic"
          ? "słowa podstawowe"
          : `-${config.ending} · ${bankSize} rymów`;

  const steps: StepDef[] = [
    {
      id: "ending",
      label: "Końcówka",
      hint: endingHint,
      complete: auto || endings.includes(config.ending),
    },
    {
      id: "timer",
      label: "Tryb",
      hint:
        config.sessionMode === "timed"
          ? `słowo na czas · ${config.wordSeconds} s`
          : `${sessionModeLabel(config)} · ${fmtDuration(config.seconds)}`,
      complete: true,
    },
    { id: "start", label: "Start", hint: undefined, complete: true },
  ];

  if (running) {
    return (
      <RhymeRun
        config={config}
        onExit={() => {
          setRunning(false);
          setProgress(loadProgress());
        }}
      />
    );
  }

  if (viewingProgress) {
    return (
      <Stack gap="lg" my="md">
        <Group justify="space-between" align="end" wrap="wrap" gap="xs">
          <div>
            <Text
              style={{
                fontSize: "clamp(22px, 6.5vw, 26px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              Mój bank rymów
            </Text>
            <Text c="dimmed" size="sm">
              Co już masz, co wraca do powtórki i co dopisałeś od siebie.
            </Text>
          </div>
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => {
              setProgress(loadProgress());
              setViewingProgress(false);
            }}
          >
            Do ćwiczenia
          </Button>
        </Group>
        <ProgressPanel
          onPractice={(e) => {
            patch({ ending: e });
            setViewingProgress(false);
            setStep(1);
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="lg" my="md">
      <Group justify="space-between" align="end" wrap="wrap" gap="xs">
        <div>
          <Text
            style={{
              fontSize: "clamp(22px, 6.5vw, 26px)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Wypluj się z rymów
          </Text>
        </div>
        <Group gap="xs">
          <Button
            variant="light"
            color="gray"
            size="sm"
            leftSection={<IconChartBar size={16} />}
            onClick={() => setViewingProgress(true)}
          >
            {sum.rounds > 0 ? `${sum.known} rymów` : "Mój bank"}
          </Button>
          <Badge variant="light" color="brand" size="lg">
            krok {step + 1} / {steps.length}
          </Badge>
        </Group>
      </Group>

      <WizardStepper steps={steps} current={step} onSelect={setStep} />

      {step === 0 && (
        <StepShell title="Wybierz końcówkę" description="">
          <Stack gap="md">
            <Section title="Końcówka rymu">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="md">
                <ChoiceCard
                  icon={<IconHeart size={20} />}
                  title="Słowa podstawowe"
                  description="Rymuj do najbardziej powszechnych słów"
                  selected={config.ending === "basic"}
                  onSelect={() => patch({ ending: "basic" })}
                >
                  <Text size="xs" c="dimmed">
                    Zamiast losowych słów — tylko te, które naprawdę śpiewasz.
                  </Text>
                </ChoiceCard>
                <ChoiceCard
                  icon={<IconRoute size={20} />}
                  title="Program"
                  description="Sami wybierzemy rodzinę, która ci najbardziej ucieka."
                  selected={config.ending === "plan"}
                  onSelect={() => patch({ ending: "plan" })}
                >
                  <Text size="xs" c="dimmed">
                    {planPick ? (
                      <>
                        Teraz padłoby na <b>-{planPick.ending}</b> —{" "}
                        {planReason(planPick)}.
                      </>
                    ) : (
                      ""
                    )}
                  </Text>
                </ChoiceCard>
                <ChoiceCard
                  icon={<IconDice5 size={20} />}
                  title="Losowa"
                  description="Poznasz ją dopiero po starcie"
                  selected={config.ending === "random"}
                  onSelect={() => patch({ ending: "random" })}
                />
                <ChoiceCard
                  icon={<IconTargetArrow size={20} />}
                  title="Wybieram sam"
                  description="Ćwicz konkretną rodzinę rymów."
                  selected={!auto}
                  onSelect={() => patch({ ending: endings[0] ?? "random" })}
                />
              </SimpleGrid>

              {!auto && (
                <>
                  <Group gap={6} wrap="wrap">
                    {endings.map((e) => {
                      const r = coverage.get(e);
                      const active = config.ending === e;
                      return (
                        <UnstyledButton
                          key={e}
                          onClick={() => patch({ ending: e })}
                        >
                          <Badge
                            size="lg"
                            variant={active ? "filled" : "light"}
                            color={
                              active
                                ? "brand"
                                : r && r.rounds > 0
                                  ? "accent"
                                  : "gray"
                            }
                            style={{ cursor: "pointer" }}
                            rightSection={
                              <Text
                                span
                                size="10px"
                                c={active ? undefined : "dimmed"}
                              >
                                {r && r.rounds > 0
                                  ? `${r.known}/${r.coreSize}`
                                  : rhymeCount(e)}
                              </Text>
                            }
                          >
                            -{e}
                          </Badge>
                        </UnstyledButton>
                      );
                    })}
                  </Group>
                  <Text size="xs" c="dimmed" mt="sm">
                    Znamy {bankSize} rymów z tą końcówką.
                    {(() => {
                      const r = coverage.get(config.ending);
                      if (!r || r.rounds === 0)
                        return " Tej jeszcze nie ćwiczyłeś.";
                      return ` Masz z niej ${r.known} z ${r.coreSize}${r.due ? `, ${r.due} czeka na powtórkę` : ""}.`;
                    })()}
                  </Text>
                </>
              )}
            </Section>
          </Stack>
          <WizardFooter
            onBack={() => navigate("/")}
            backLabel="Tryby"
            onNext={() => setStep(1)}
            nextLabel="Gotowe"
            finish
          />
        </StepShell>
      )}

      {step === 1 && (
        <StepShell title="Jak lecimy" description="">
          <Stack gap="md">
            <Section title="Tryb sesji">
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                <ChoiceCard
                  icon={<IconInfinity size={20} />}
                  title="Jedno słowo"
                  description="Cała runda na jednym słowie — ile rymów wyciśniesz."
                  selected={config.sessionMode === "single"}
                  onSelect={() => patch({ sessionMode: "single" })}
                />
                <ChoiceCard
                  icon={<IconListCheck size={20} />}
                  title="Kilka rymów"
                  description="Dobijasz limit i wskakuje następne słowo."
                  selected={config.sessionMode === "quota"}
                  onSelect={() =>
                    patch({
                      sessionMode: "quota",
                      seconds: minSecondsFor("quota", config.seconds),
                    })
                  }
                >
                  <Group gap="xs">
                    {QUOTA_CHOICES.map((n) => (
                      <Button
                        key={n}
                        size="xs"
                        variant={config.quota === n ? "filled" : "default"}
                        color="brand"
                        onClick={() => patch({ quota: n })}
                      >
                        {n} {rhymeWord(n)}
                      </Button>
                    ))}
                  </Group>
                </ChoiceCard>
                <ChoiceCard
                  icon={<IconStopwatch size={20} />}
                  title="Słowo na czas"
                  description="Jeden rym — następne słowo. Nie zdążysz — koniec serii."
                  selected={config.sessionMode === "timed"}
                  onSelect={() =>
                    patch({
                      sessionMode: "timed",
                    })
                  }
                >
                  <Group gap="xs">
                    {WORD_SECONDS_CHOICES.map((n) => (
                      <Button
                        key={n}
                        size="xs"
                        variant={
                          config.wordSeconds === n ? "filled" : "default"
                        }
                        color="brand"
                        onClick={() => patch({ wordSeconds: n })}
                      >
                        {n} s
                      </Button>
                    ))}
                  </Group>
                </ChoiceCard>
              </SimpleGrid>
              {config.sessionMode !== "single" && (
                <Text size="xs" c="dimmed" mt="sm">
                  {config.ending === "plan"
                    ? "Każde słowo to nowa rodzina — program dobiera te, które ci uciekają."
                    : config.ending === "random"
                      ? "Każde słowo to nowa rodzina rymów — losujemy ją w locie."
                      : config.ending === "basic"
                        ? "Każde słowo to inne słowo podstawowe — miłość, kochanie, pragnienie..."
                        : `Każde słowo z rodziny -${config.ending}. Chcesz mieszać końcówki? Wybierz losową w poprzednim kroku.`}
                </Text>
              )}
            </Section>

            <Section title="Długość rundy">
              {config.sessionMode === "timed" ? (
                <Text size="xs" c="dimmed">
                  W trybie "Słowo na czas" nie ma limitu całej rundy — seria
                  trwa, dopóki dajesz radę.
                </Text>
              ) : (
                <Group gap="xs" wrap="wrap">
                  {DURATIONS.map((sec) => (
                    <Button
                      key={sec}
                      size="md"
                      variant={config.seconds === sec ? "filled" : "default"}
                      color="brand"
                      onClick={() => patch({ seconds: sec })}
                    >
                      {fmtDuration(sec)}
                    </Button>
                  ))}
                </Group>
              )}
              {config.sessionMode !== "timed" && (
                <Text size="xs" c="dimmed" mt="xs">
                  Krótka runda = sprint na skojarzenia. Dłuższa = kopiesz
                  głębiej w rodzinę rymów.
                </Text>
              )}
            </Section>
            <Section
              title="Metronom"
              hint="Puls pomaga trzymać flow, ale nie jest obowiązkowy."
            >
              <Group gap="xs" wrap="wrap">
                {BPMS.map((b) => (
                  <Button
                    key={b}
                    size="md"
                    variant={config.bpm === b ? "filled" : "default"}
                    color="brand"
                    leftSection={
                      b > 0 ? <IconMetronome size={14} /> : undefined
                    }
                    onClick={() => patch({ bpm: b })}
                  >
                    {b === 0 ? "wyłączony" : `${b} BPM`}
                  </Button>
                ))}
              </Group>
            </Section>

            {speechSupported && (
              <Section
                title="Mikrofon"
                hint="Rymowanie na głos jest bliższe temu, co robisz na scenie."
              >
                <Switch
                  size="md"
                  color="brand"
                  label="Zacznij z włączonym mikrofonem"
                  description="Mikrofon przełączysz też w trakcie rundy."
                  checked={config.voice}
                  onChange={(e) => patch({ voice: e.currentTarget.checked })}
                />
                {config.voice && (
                  <Text size="xs" c="dimmed" mt="xs">
                    Przy włączonym mikrofonie metronom milczy — klik wchodziłby
                    prosto w nasłuch.
                    {config.bpm > 0 &&
                      " Załóż słuchawki, jeśli chcesz mieć jedno i drugie."}{" "}
                    Na Androidzie rozpoznawanie mowy idzie przez serwery Google;
                    reszta aplikacji zostaje na twoim urządzeniu.
                  </Text>
                )}
              </Section>
            )}
          </Stack>
          <WizardFooter
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            nextLabel="Gotowe"
            finish
          />
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          title="Wszystko gotowe"
          description="Zegar rusza od razu po kliknięciu."
        >
          <ReadyPanel
            headline="Gotowy?"
            items={[
              {
                label: "Końcówka",
                value:
                  config.ending === "plan"
                    ? "program 🧭"
                    : config.ending === "random"
                      ? "losowa 🎲"
                      : config.ending === "basic"
                        ? "słowa podstawowe 🎵"
                        : `-${config.ending}`,
              },
              { label: "Tryb", value: sessionModeLabel(config) },
              ...(config.sessionMode === "timed"
                ? [
                    {
                      label: "Sekund na słowo",
                      value: `${config.wordSeconds} s`,
                    },
                  ]
                : [{ label: "Czas", value: fmtDuration(config.seconds) }]),
              {
                label: "Metronom",
                value:
                  config.bpm === 0
                    ? "wyłączony"
                    : config.voice
                      ? `${config.bpm} BPM (cichy)`
                      : `${config.bpm} BPM`,
              },
              ...(speechSupported
                ? [
                    {
                      label: "Mikrofon",
                      value: config.voice ? "włączony 🎤" : "wyłączony",
                    },
                  ]
                : []),
            ]}
            note={
              config.sessionMode === "timed"
                ? `Wpisz jeden rym i zatwierdź Enterem — słowo przeskakuje od razu. Nie zdążysz w ${config.wordSeconds} s — seria się kończy. Wynik to liczba słów z rzędu.`
                : "Wpisuj rymy i zatwierdzaj Enterem. Słowo, które się nie rymuje, odbije się od pola — do banku trafia tylko to, co naprawdę pasuje."
            }
          >
            <Paper withBorder p="md" radius="md" bg="rgba(255,255,255,0.02)">
              <Box ta="center">
                <Text size="xs" c="dimmed" tt="uppercase" lts={1}>
                  rymujesz do
                </Text>
                <Text
                  style={{
                    fontSize: "clamp(36px, 12vw, 52px)",
                    fontWeight: 800,
                  }}
                  c="brand.3"
                >
                  {"?"}
                </Text>
                {!auto ? (
                  <Text size="xs" c="dimmed">
                    końcówka -{config.ending} · słowo losowane po starcie
                  </Text>
                ) : (
                  <Text size="xs" c="dimmed">
                    {config.ending === "plan"
                      ? planPick
                        ? `program celuje w -${planPick.ending} · ${planReason(planPick)}`
                        : "program dobierze rodzinę po starcie"
                      : config.ending === "basic"
                        ? "słowa związane z miłością i emocjami — losowane po starcie"
                        : "rodzina losowana po starcie"}
                  </Text>
                )}
              </Box>
            </Paper>
          </ReadyPanel>
          <WizardFooter
            onBack={() => setStep(1)}
            onNext={() => setRunning(true)}
            nextLabel="Rozpocznij ćwiczenie"
          />
        </StepShell>
      )}
    </Stack>
  );
}
