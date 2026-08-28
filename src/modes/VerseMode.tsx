import { useState } from "react";
import {
  Badge,
  Button,
  Group,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { IconDice5, IconPencil } from "@tabler/icons-react";
import { WizardStepper, type StepDef } from "@/components/wizard/WizardStepper";
import {
  StepShell,
  Section,
  WizardFooter,
} from "@/components/wizard/StepShell";
import { ReadyPanel } from "@/components/wizard/ReadyPanel";
import { ChoiceCard } from "@/components/wizard/ChoiceCard";
import { VerseRun } from "./verse/VerseRun";
import { VerseSummary } from "./verse/VerseSummary";
import {
  defaultVerseConfig,
  VERSE_COUNTS,
  verseWord,
  type VerseConfig,
  type VerseLink,
} from "./verse/config";

type Phase = "setup" | "running" | "done";

export function VerseMode() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<VerseConfig>(defaultVerseConfig);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("setup");
  const [links, setLinks] = useState<VerseLink[]>([]);

  const patch = (p: Partial<VerseConfig>) => setConfig((c) => ({ ...c, ...p }));

  const startHint =
    config.start === "own"
      ? config.startWord.trim() || "twoje słowo"
      : "losowe";

  const steps: StepDef[] = [
    {
      id: "count",
      label: "Zwrotki",
      hint: `${config.verses} ${verseWord(config.verses)}`,
      complete: true,
    },
    {
      id: "start",
      label: "Start",
      hint: startHint,
      complete: config.start !== "own" || config.startWord.trim().length > 1,
    },
    {
      id: "ready",
      label: "Gotowe",
      complete: true,
    },
  ];

  if (phase === "running") {
    return (
      <VerseRun
        config={config}
        onDone={(ls) => {
          setLinks(ls);
          setPhase("done");
        }}
        onExit={() => setPhase("setup")}
      />
    );
  }

  if (phase === "done") {
    // links[0].from is the seed word — computed inside VerseRun
    const seed =
      links.length > 0
        ? links[0].from
        : config.startWord.trim().toLowerCase() || "?";
    return (
      <VerseSummary
        seed={seed}
        links={links}
        onAgain={() => {
          setLinks([]);
          setPhase("running");
        }}
        onExit={() => {
          setLinks([]);
          setPhase("setup");
          setStep(0);
        }}
      />
    );
  }

  const stepIdx = Math.min(step, steps.length - 1);
  const stepId = steps[stepIdx].id;

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
            Piosenka
          </Text>
          <Text c="dimmed" size="sm">
            Skojarzenia i rymy budują kolejne zwrotki — na końcu masz pełny
            tekst do zaśpiewania.
          </Text>
        </div>
        <Badge variant="light" color="brand" size="lg">
          krok {stepIdx + 1} / {steps.length}
        </Badge>
      </Group>

      <WizardStepper steps={steps} current={stepIdx} onSelect={setStep} />

      {stepId === "count" && (
        <StepShell title="" description="">
          <Section title="Liczba wersów">
            <Group gap="sm" wrap="wrap">
              {VERSE_COUNTS.map((n) => (
                <Button
                  key={n}
                  size="lg"
                  variant={config.verses === n ? "filled" : "default"}
                  color="brand"
                  onClick={() => patch({ verses: n })}
                >
                  {n}
                </Button>
              ))}
            </Group>
          </Section>
          <WizardFooter
            onBack={() => navigate("/")}
            backLabel="Tryby"
            onNext={() => setStep(1)}
            nextLabel="Dalej"
          />
        </StepShell>
      )}

      {stepId === "start" && (
        <StepShell
          title="Od czego wychodzisz"
          description="Pierwsze słowo to punkt startowy łańcucha skojarzeń."
        >
          <Section title="Słowo startowe">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <ChoiceCard
                icon={<IconDice5 size={20} />}
                title="Losowe"
                description="Poznasz je po starcie"
                selected={config.start === "random"}
                onSelect={() => patch({ start: "random", startWord: "" })}
              />
              <ChoiceCard
                icon={<IconPencil size={20} />}
                title="Własne"
                description="Wpisz słowo, od którego chcesz dziś wyjść."
                selected={config.start === "own"}
                onSelect={() => patch({ start: "own" })}
              >
                <TextInput
                  placeholder="np. deszcz"
                  value={config.startWord}
                  onChange={(e) => patch({ startWord: e.currentTarget.value })}
                  autoComplete="off"
                  spellCheck={false}
                  autoCapitalize="none"
                />
              </ChoiceCard>
            </SimpleGrid>
          </Section>
          <WizardFooter
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            nextLabel="Gotowe"
            finish
            nextDisabled={
              config.start === "own" && config.startWord.trim().length < 2
            }
            blockedReason="Wpisz słowo startowe (min. 2 znaki) albo wybierz losowanie."
          />
        </StepShell>
      )}

      {stepId === "ready" && (
        <StepShell
          title="Wszystko gotowe"
          description="Najpierw skojarzenie, potem rym, a potem cała zwrotka."
        >
          <ReadyPanel
            headline="Gotowy?"
            items={[
              {
                label: "Zwrotki",
                value: `${config.verses} ${verseWord(config.verses)}`,
              },
              { label: "Słowo startowe", value: startHint },
            ]}
            note="Skojarzenie wychodzi ze słowa głównego. Rym to wypełniacz. Zwrotka łączy oba słowa w tekst."
          />
          <WizardFooter
            onBack={() => setStep(1)}
            onNext={() => {
              setLinks([]);
              setPhase("running");
            }}
            nextLabel="Zacznij pisać"
            nextDisabled={
              config.start === "own" && config.startWord.trim().length < 2
            }
            blockedReason="Uzupełnij poprzednie kroki."
          />
        </StepShell>
      )}
    </Stack>
  );
}
