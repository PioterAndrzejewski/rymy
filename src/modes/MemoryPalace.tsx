import { useMemo, useState } from 'react';
import {
  Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Switch, Text,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
  IconBuildingCastle, IconCube, IconMicrophone, IconTrophy, IconWalk,
} from '@tabler/icons-react';
import { WizardStepper, type StepDef } from '@/components/wizard/WizardStepper';
import { StepShell, Section, WizardFooter } from '@/components/wizard/StepShell';
import { ReadyPanel } from '@/components/wizard/ReadyPanel';
import { ChoiceCard } from '@/components/wizard/ChoiceCard';
import { loadPalace, levelReport, suggestLevel } from '@/storage/palaceProgress';
import {
  LEVEL_NUMBERS, PACE_CHOICES, PALACE_LEVELS, defaultPalaceConfig, levelDef,
  memorizeSeconds, paceLabel, taskCountLabel, wordCountLabel, type PalaceConfig,
} from './palace/config';
import { PALACE_CATEGORIES } from './palace/words';
import { roomsFor } from './palace/rooms';
import { RoomCard } from './palace/RoomCard';
import { PalaceRun } from './palace/PalaceRun';
import { useIsMobile } from './palace/useIsMobile';

/** Firefox nie ma Web Speech API — wtedy nie obiecujemy mikrofonu w kreatorze. */
const speechSupported =
  typeof window !== 'undefined' &&
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

  const patch = (p: Partial<PalaceConfig>) => setConfig((c) => ({ ...c, ...p }));

  const def = levelDef(config.level);
  const rooms = useMemo(() => roomsFor(def.words), [def.words]);
  const report = useMemo(() => levelReport(config.level, progress), [config.level, progress]);
  const category = PALACE_CATEGORIES.find((c) => c.id === config.category);

  const steps: StepDef[] = [
    {
      id: 'level',
      label: 'Poziom',
      hint: `${def.words} ${wordCountLabel(def.words)} · ${def.label}`,
      complete: true,
    },
    {
      id: 'walk',
      label: 'Zapamiętywanie',
      hint: `${config.walk3d ? 'spacer 3D' : 'kartki'} · ${paceLabel(config.pace)}`,
      complete: true,
    },
    { id: 'start', label: 'Start', hint: undefined, complete: true },
  ];

  if (running) {
    return (
      <PalaceRun
        config={config}
        onExit={() => setRunning(false)}
        onSaved={setProgress}
      />
    );
  }

  return (
    <Stack gap="lg" my="md">
      <Group justify="space-between" align="end" wrap="wrap" gap="xs">
        <div>
          <Text style={{ fontSize: 'clamp(22px, 6.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Pałac mentalny
          </Text>
          <Text c="dimmed" size="sm">
            Przypinasz słowa do pokoi, dajesz się rozproszyć, a potem odzyskujesz je
            w kolejności — tak zapamiętuje się zwrotkę bez kartki.
          </Text>
        </div>
        <Badge variant="light" color="brand" size="lg">krok {step + 1} / {steps.length}</Badge>
      </Group>

      <WizardStepper steps={steps} current={step} onSelect={setStep} />

      {step === 0 && (
        <StepShell
          title="Jak duży pałac"
          description="Pokoje są zawsze te same i zawsze w tej samej kolejności — wyższy poziom tylko dokłada kolejne. Dzięki temu pałac zostaje w głowie."
        >
          <Section title="Poziom">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
              {PALACE_LEVELS.map((l) => {
                const r = levelReport(l.level, progress);
                return (
                  <ChoiceCard
                    key={l.level}
                    icon={<IconBuildingCastle size={20} />}
                    title={`${l.level}. ${l.label}`}
                    description={`${l.words} ${wordCountLabel(l.words)} · ${l.distractions} ${taskCountLabel(l.distractions)} z rymami`}
                    selected={config.level === l.level}
                    onSelect={() => patch({ level: l.level })}
                  >
                    <Text size="xs" c="dimmed">
                      {r.runs === 0
                        ? 'Jeszcze tu nie byłeś.'
                        : `Rekord ${r.best?.exact ?? 0}/${l.words} · ${r.runs} ${r.runs === 1 ? 'runda' : 'rund'}`}
                    </Text>
                  </ChoiceCard>
                );
              })}
            </SimpleGrid>
            {report.runs > 0 && (
              <Group gap="xs" mt="sm">
                <IconTrophy size={14} color="var(--mantine-color-brand-4)" />
                <Text size="xs" c="dimmed">
                  Celność z ostatnich rund: {Math.round(report.recentAccuracy * 100)}%
                  {report.best?.msPerWord ? ` · najlepsze tempo ${(report.best.msPerWord / 1000).toFixed(1)} s na słowo` : ''}
                </Text>
              </Group>
            )}
          </Section>

          <Section title="Skąd słowa" hint="Jedna kategoria trzyma klimat, mieszane są trudniejsze.">
            <Group gap={6} wrap="wrap">
              <Button
                size="sm"
                variant={config.category === '' ? 'filled' : 'default'}
                color="brand"
                onClick={() => patch({ category: '' })}
              >
                mieszane
              </Button>
              {PALACE_CATEGORIES.map((c) => (
                <Button
                  key={c.id}
                  size="sm"
                  variant={config.category === c.id ? 'filled' : 'default'}
                  color="brand"
                  onClick={() => patch({ category: c.id })}
                >
                  {c.label}
                </Button>
              ))}
            </Group>
          </Section>

          <WizardFooter
            onBack={() => navigate('/')}
            backLabel="Tryby"
            onNext={() => setStep(1)}
            nextLabel="Gotowe"
            finish
          />
        </StepShell>
      )}

      {step === 1 && (
        <StepShell
          title="Jak chcesz zapamiętywać"
          description="Spacer 3D prowadzi cię przez pokoje — między pokojami szybko, w pokoju tyle, ile trzeba na obraz."
        >
          <Section title="Widok">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <ChoiceCard
                icon={<IconCube size={20} />}
                title="Pokaż 3D podczas zapamiętywania"
                description="Spacer po mieszkaniu; słowo wisi na ścianie pokoju."
                selected={config.walk3d}
                onSelect={() => patch({ walk3d: true })}
              />
              <ChoiceCard
                icon={<IconWalk size={20} />}
                title="Same kartki"
                description="Ten sam pokój, ten sam kolor i rekwizyt — bez ruchu."
                selected={!config.walk3d}
                onSelect={() => patch({ walk3d: false })}
              />
            </SimpleGrid>
          </Section>

          <Section title="Czas w pokoju" hint="Ile sekund widzisz słowo, zanim ruszasz dalej.">
            <Group gap="xs" wrap="wrap">
              {PACE_CHOICES.map((p) => (
                <Button
                  key={p}
                  size="md"
                  variant={config.pace === p ? 'filled' : 'default'}
                  color="brand"
                  onClick={() => patch({ pace: p })}
                >
                  {p} s · {paceLabel(p)}
                </Button>
              ))}
            </Group>
            <Text size="xs" c="dimmed" mt="xs">
              Całe zapamiętywanie zajmie około {memorizeSeconds(config)} s.
            </Text>
          </Section>

          {speechSupported && (
            <Section title="Mikrofon" hint="Odtwarzanie na głos jest szybsze niż pisanie.">
              <Switch
                size="md" color="brand"
                label="Odtwarzaj słowa mikrofonem"
                description="Każde rozpoznane słowo od razu przechodzi do następnego pokoju."
                checked={config.voice}
                onChange={(e) => patch({ voice: e.currentTarget.checked })}
              />
            </Section>
          )}

          <Section title="Twoja trasa" hint="Pokój 1 zawsze wygląda tak samo — to jest cały sens.">
            <Box className="rymy-hscroll">
              <Group gap="xs" wrap="nowrap" style={{ minWidth: 'min-content' }}>
                {rooms.map((r, i) => (
                  <Box key={i} w={mobile ? 120 : 150} style={{ flexShrink: 0 }}>
                    <RoomCard room={r} index={i} height={mobile ? 96 : 120} muted />
                    <Text size="10px" c="dimmed" ta="center" mt={4} lineClamp={1}>
                      {i + 1}. {r.name}
                    </Text>
                  </Box>
                ))}
              </Group>
            </Box>
          </Section>

          <WizardFooter onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Gotowe" finish />
        </StepShell>
      )}

      {step === 2 && (
        <StepShell title="Wszystko gotowe" description="Zaraz po starcie wchodzisz do pierwszego pokoju.">
          <ReadyPanel
            headline="Idziemy?"
            items={[
              { label: 'Poziom', value: `${config.level} · ${def.label}` },
              { label: 'Słowa', value: `${def.words}` },
              { label: 'Rozpraszacze', value: `${def.distractions} ${taskCountLabel(def.distractions)}` },
              { label: 'Zapamiętywanie', value: config.walk3d ? `3D · ${config.pace} s` : `kartki · ${config.pace} s` },
              ...(category ? [{ label: 'Słownictwo', value: category.label }] : [{ label: 'Słownictwo', value: 'mieszane' }]),
              ...(speechSupported ? [{ label: 'Mikrofon', value: config.voice ? 'włączony 🎤' : 'wyłączony' }] : []),
            ]}
            note="Po zapamiętaniu dostaniesz kilka rymów do rozwiązania — dopiero potem odtwarzasz słowa, w kolejności i na czas. Wynik zobaczysz na końcu, nie w trakcie."
          >
            <Paper withBorder p="md" radius="md" bg="rgba(255,255,255,0.02)">
              <Group justify="space-between" wrap="wrap" gap="xs">
                <Text size="sm" c="dimmed">
                  Trasa: {rooms.map((r) => r.name).join(' → ')}
                </Text>
                {report.best && (
                  <Badge variant="light" color="brand" leftSection={<IconTrophy size={12} />}>
                    rekord {report.best.exact}/{def.words}
                  </Badge>
                )}
              </Group>
            </Paper>
            {config.voice && speechSupported && (
              <Group gap={6} justify="center">
                <IconMicrophone size={14} color="var(--mantine-color-brand-4)" />
                <Text size="xs" c="dimmed">
                  Mikrofon możesz wyłączyć również w trakcie odtwarzania.
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
