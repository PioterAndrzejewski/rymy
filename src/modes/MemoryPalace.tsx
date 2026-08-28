import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Collapse,
  Group,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useNavigate } from "react-router-dom";
import {
  IconChevronDown,
  IconCube,
  IconDice5,
  IconMicrophone,
  IconTrophy,
  IconWalk,
} from "@tabler/icons-react";
import { WizardStepper, type StepDef } from "@/components/wizard/WizardStepper";
import {
  StepShell,
  Section,
  WizardFooter,
} from "@/components/wizard/StepShell";
import { ReadyPanel } from "@/components/wizard/ReadyPanel";
import { ChoiceCard } from "@/components/wizard/ChoiceCard";
import {
  loadPalace,
  levelReport,
  suggestLevel,
} from "@/storage/palaceProgress";
import {
  LEVEL_NUMBERS,
  PACE_CHOICES,
  PALACE_LEVELS,
  defaultPalaceConfig,
  levelDef,
  memorizeSeconds,
  paceLabel,
  rhymeCountLabel,
  wordCountLabel,
  type PalaceConfig,
} from "./palace/config";
import { PALACE_CATEGORIES, PALACE_PICKS, PALACE_REST } from "./palace/words";
import { roomsFor } from "./palace/rooms";
import { FloorPlan } from "./palace/FloorPlan";
import { PalaceRun } from "./palace/PalaceRun";
import { RoomImagePicker } from "./palace/RoomImagePicker";
import { useIsMobile } from "./palace/useIsMobile";
import {
  clearRoomImage,
  loadAllRoomImages,
  saveRoomImage,
} from "@/storage/roomImages";

/**
 * Rooms that ship with a static WebP in /public/rooms/.
 * Add an entry here whenever you drop a new image into that folder.
 */
const STATIC_ROOM_IMAGES = new Set([
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
]);

/** Firefox nie ma Web Speech API — wtedy nie obiecujemy mikrofonu w kreatorze. */
const speechSupported =
  typeof window !== "undefined" &&
  !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

export function MemoryPalace() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const [progress, setProgress] = useState(loadPalace);
  const [config, setConfig] = useState<PalaceConfig>(() => ({
    ...defaultPalaceConfig,
    level: suggestLevel(LEVEL_NUMBERS, loadPalace()),
  }));
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  // Pięćdziesiąt tematów to za dużo, żeby stały otworem — lista rozwija się
  // dopiero wtedy, gdy naprawdę chcesz wybrać temat.
  const [pickingTopic, setPickingTopic] = useState(false);

  const patch = (p: Partial<PalaceConfig>) =>
    setConfig((c) => ({ ...c, ...p }));

  // --- room images ----------------------------------------------------------

  const [customImages, setCustomImages] =
    useState<(string | null)[]>(loadAllRoomImages);

  function handleSetImage(index: number, dataUrl: string) {
    saveRoomImage(index, dataUrl);
    setCustomImages((prev) => {
      const next = [...prev];
      next[index] = dataUrl;
      return next;
    });
  }

  function handleClearImage(index: number) {
    clearRoomImage(index);
    setCustomImages((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  }

  /** Resolved image per room slot (custom > static public > nothing). */
  const roomImages = useMemo(
    () =>
      Array.from(
        { length: 16 },
        (_, i) =>
          customImages[i] ??
          (STATIC_ROOM_IMAGES.has(i)
            ? `${import.meta.env.BASE_URL}rooms/${i + 1}.webp`
            : undefined),
      ),
    [customImages],
  );

  const def = levelDef(config.level);
  const rooms = useMemo(() => roomsFor(def.words), [def.words]);
  const report = useMemo(
    () => levelReport(config.level, progress),
    [config.level, progress],
  );
  const category = PALACE_CATEGORIES.find((c) => c.id === config.category);

  const steps: StepDef[] = [
    {
      id: "level",
      label: "Poziom",
      hint: `${def.words} ${wordCountLabel(def.words)}`,
      complete: true,
    },
    {
      id: "walk",
      label: "Zapamiętywanie",
      hint: config.walk3d ? "spacer 3D" : "bez 3D",
      complete: true,
    },
    { id: "start", label: "Start", hint: undefined, complete: true },
  ];

  if (running) {
    return (
      <PalaceRun
        config={config}
        onExit={() => setRunning(false)}
        onSaved={setProgress}
        roomImages={roomImages}
      />
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
            Pałac mentalny
          </Text>
          <Text c="dimmed" size="sm">
            Przypinasz słowa do pokoi, dajesz się rozproszyć, a potem
            odzyskujesz je w kolejności — tak zapamiętuje się zwrotkę bez
            kartki.
          </Text>
        </div>
        <Badge variant="light" color="brand" size="lg">
          krok {step + 1} / {steps.length}
        </Badge>
      </Group>

      <WizardStepper steps={steps} current={step} onSelect={setStep} />

      {step === 0 && (
        <StepShell
          title="Jak duży pałac"
          description="Pokoje są zawsze te same i zawsze w tej samej kolejności — wyższy poziom tylko dokłada kolejne. Dzięki temu pałac zostaje w głowie."
        >
          <Section title="Poziom">
            {/* Wybór ma być jednym spojrzeniem: numer i ile słów. Reszta
                (rozpraszacze, rekordy) to szczegóły dla wybranego poziomu. */}
            <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="xs">
              {PALACE_LEVELS.map((l) => {
                const active = config.level === l.level;
                return (
                  <UnstyledButton
                    key={l.level}
                    onClick={() => patch({ level: l.level })}
                    style={{
                      padding: "12px 6px",
                      borderRadius: 12,
                      textAlign: "center",
                      border: `1px solid ${active ? "var(--mantine-color-brand-5)" : "var(--mantine-color-dark-4)"}`,
                      background: active
                        ? "rgba(243,184,29,0.12)"
                        : "transparent",
                      transition:
                        "background 140ms ease, border-color 140ms ease",
                    }}
                  >
                    <Text fw={800} size="xl" c={active ? "brand.3" : undefined}>
                      {l.level}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {l.words} {wordCountLabel(l.words)}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
            {report.runs > 0 && (
              <Group gap="xs" mt="sm">
                <IconTrophy size={14} color="var(--mantine-color-brand-4)" />
                <Text size="xs" c="dimmed">
                  Poziom {config.level}: rekord {report.best?.exact ?? 0}/
                  {def.words} · celność{" "}
                  {Math.round(report.recentAccuracy * 100)}%
                  {report.best?.msPerWord
                    ? ` · najlepsze tempo ${(report.best.msPerWord / 1000).toFixed(1)} s na słowo`
                    : ""}
                </Text>
              </Group>
            )}
          </Section>

          <Section title="Skąd słowa" hint="">
            <Group gap="xs" wrap="wrap">
              <Button
                size="sm"
                variant={config.category === "" ? "filled" : "default"}
                color="brand"
                leftSection={<IconDice5 size={14} />}
                onClick={() => {
                  patch({ category: "" });
                  setPickingTopic(false);
                }}
              >
                mieszane
              </Button>
              <Button
                size="sm"
                variant={config.category ? "filled" : "default"}
                color="brand"
                rightSection={
                  <IconChevronDown
                    size={14}
                    style={{
                      transform: pickingTopic ? "rotate(180deg)" : undefined,
                      transition: "transform 180ms ease",
                    }}
                  />
                }
                onClick={() => setPickingTopic((v) => !v)}
              >
                {category ? category.label : "Wybierz temat"}
              </Button>
            </Group>

            <Collapse in={pickingTopic}>
              <Text size="xs" c="dimmed" mt="md" mb={6}>
                Najłatwiejsze w pałacu — same konkretne rzeczy, które da się
                postawić w pokoju:
              </Text>
              <Group gap={6} wrap="wrap">
                {PALACE_PICKS.map((c) => (
                  <Button
                    key={c.id}
                    size="compact-sm"
                    variant={config.category === c.id ? "filled" : "default"}
                    color="brand"
                    onClick={() => patch({ category: c.id })}
                  >
                    {c.label}
                  </Button>
                ))}
              </Group>
              <Text size="xs" c="dimmed" mt="md" mb={6}>
                Reszta tematów z Historii ({PALACE_REST.length}) — więcej w nich
                pojęć niż przedmiotów, więc trudniej je zobaczyć:
              </Text>
              <Group gap={6} wrap="wrap">
                {PALACE_REST.map((c) => (
                  <Button
                    key={c.id}
                    size="compact-sm"
                    variant={config.category === c.id ? "filled" : "default"}
                    color="gray"
                    onClick={() => patch({ category: c.id })}
                  >
                    {c.label}
                  </Button>
                ))}
              </Group>
            </Collapse>
          </Section>

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
        <StepShell title="" description="">
          <Section title="Czas na zapamiętanie słowa" hint="">
            <Group gap="xs" wrap="wrap">
              {PACE_CHOICES.map((p) => (
                <Button
                  key={p}
                  size="md"
                  variant={config.pace === p ? "filled" : "default"}
                  color="brand"
                  onClick={() => patch({ pace: p })}
                >
                  {p} s · {paceLabel(p)}
                </Button>
              ))}
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              Cały obchód zajmie około {memorizeSeconds(config)} s — z
              chodzeniem między pokojami włącznie.
            </Text>
          </Section>

          <Section title="Widok">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <ChoiceCard
                icon={<IconCube size={20} />}
                title="Pokaż 3D podczas zapamiętywania"
                description=""
                selected={config.walk3d}
                onSelect={() => patch({ walk3d: true })}
              />
              <ChoiceCard
                icon={<IconWalk size={20} />}
                title="Bez 3D"
                description=""
                selected={!config.walk3d}
                onSelect={() => patch({ walk3d: false })}
              />
            </SimpleGrid>
          </Section>

          {speechSupported && (
            <Section title="Mikrofon" hint="">
              <Switch
                size="md"
                color="brand"
                label="Odtwarzaj i rymuj mikrofonem"
                description=""
                checked={config.voice}
                onChange={(e) => patch({ voice: e.currentTarget.checked })}
              />
            </Section>
          )}

          {config.walk3d && (
            <>
              <Section
                title="Twoje mieszkanie"
                hint="Pokoje i ich układ są zawsze te same — wyższy poziom tylko dokłada kolejne."
              >
                <FloorPlan rooms={rooms} height={mobile ? 190 : 220} />
              </Section>

              <Section
                title="Zdjęcia pokoi"
                hint="Zastąp domyślne tło własnym zdjęciem — kliknij pokój, żeby wgrać fotografię. Wybrany kadr trafia na ścianę ze słowem."
              >
                <RoomImagePicker
                  rooms={rooms}
                  customImages={customImages}
                  roomImages={roomImages}
                  onSetImage={handleSetImage}
                  onClearImage={handleClearImage}
                />
              </Section>
            </>
          )}

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
          description="Zaraz po starcie wchodzisz do pierwszego pokoju."
        >
          <ReadyPanel
            headline="Lecimy?"
            items={[
              { label: "Poziom", value: `${config.level} · ${def.label}` },
              { label: "Słowa", value: `${def.words}` },
              {
                label: "Rymy przy odtwarzaniu",
                value: `${def.words} ${rhymeCountLabel(def.words)}`,
              },
              {
                label: "Obchód",
                value: `${config.walk3d ? "spacer 3D" : "bez 3D"} · ${config.pace} s na pokój`,
              },
              ...(category
                ? [{ label: "Słownictwo", value: category.label }]
                : [{ label: "Słownictwo", value: "mieszane" }]),
              ...(speechSupported
                ? [
                    {
                      label: "Mikrofon",
                      value: config.voice ? "włączony 🎤" : "wyłączony",
                    },
                  ]
                : []),
            ]}
            note=""
          >
            {!config.walk3d && report.best && (
              <Group justify="center">
                <Badge
                  variant="light"
                  color="brand"
                  leftSection={<IconTrophy size={12} />}
                >
                  rekord {report.best.exact}/{def.words}
                </Badge>
              </Group>
            )}
            {config.voice && speechSupported && (
              <Group gap={6} justify="center">
                <IconMicrophone
                  size={14}
                  color="var(--mantine-color-brand-4)"
                />
                <Text size="xs" c="dimmed">
                  Mikrofon możesz wyłączyć również w trakcie rundy.
                </Text>
              </Group>
            )}
          </ReadyPanel>
          <WizardFooter
            onBack={() => setStep(1)}
            onNext={() => setRunning(true)}
            nextLabel="Wchodzę do pałacu"
          />
        </StepShell>
      )}
    </Stack>
  );
}
