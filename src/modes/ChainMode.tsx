import { useMemo, useState } from 'react';
import {
  Badge, Box, Button, Group, Paper, SimpleGrid, Stack, Switch, Text,
} from '@mantine/core';import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft, IconInfinity, IconLink, IconMetronome,
  IconRoute, IconTrophy,
} from '@tabler/icons-react';
import { WizardStepper, type StepDef } from '@/components/wizard/WizardStepper';
import { StepShell, Section, WizardFooter } from '@/components/wizard/StepShell';
import { ReadyPanel } from '@/components/wizard/ReadyPanel';
import { ChoiceCard } from '@/components/wizard/ChoiceCard';
import { bestFor, loadChain } from '@/storage/chainProgress';
import { ChainRun } from './chain/ChainRun';
import { PairsPanel } from './chain/PairsPanel';
import { suggestLevel } from './chain/score';
import {
  CHAIN_BPMS, CHAIN_LEVELS, FREE_LEVEL, defaultChainConfig, isFree, levelDef, levelSummary,
  linkWord, wordCount, type ChainConfig,
} from './chain/config';

/** Firefox nie ma Web Speech API — wtedy nie obiecujemy mikrofonu w kreatorze. */
const speechSupported =
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);

export function ChainMode() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(loadChain);
  const [config, setConfig] = useState<ChainConfig>(defaultChainConfig);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [viewingPairs, setViewingPairs] = useState(false);

  const patch = (p: Partial<ChainConfig>) => setConfig((c) => ({ ...c, ...p }));

  const def = levelDef(config.level);
  const free = isFree(config.level);
  const plan = useMemo(() => suggestLevel(progress), [progress]);
  const record = bestFor(config.level, progress);
  const played = progress.runs.length > 0;

  const steps: StepDef[] = [
    {
      id: 'level',
      label: 'Poziom',
      hint: free ? 'wolny łańcuch' : `${def.links} ${linkWord(def.links)} · ${def.seconds} s`,
      complete: true,
    },
    {
      id: 'options',
      label: 'Opcje',
      hint: 'metronom · przegląd',
      complete: true,
    },
    { id: 'ready', label: 'Gotowe', hint: undefined, complete: true },
  ];

  if (running) {
    return (
      <ChainRun
        config={config}
        onExit={() => { setRunning(false); setProgress(loadChain()); }}
        onSaved={setProgress}
        onLevel={(level) => { patch({ level }); setRunning(false); setStep(2); }}
      />
    );
  }

  if (viewingPairs) {
    return (
      <Stack gap="lg" my="md">
        <Group justify="space-between" align="end" wrap="wrap" gap="xs">
          <div>
            <Text style={{ fontSize: 'clamp(22px, 6.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Moje skojarzenia
            </Text>
            <Text c="dimmed" size="sm">
              Z czego na co skaczesz, gdzie chodzą twoje łańcuchy i co wraca za często.
            </Text>
          </div>
          <Button
            variant="subtle" color="gray" leftSection={<IconArrowLeft size={16} />}
            onClick={() => setViewingPairs(false)}
          >
            Do ćwiczenia
          </Button>
        </Group>
        <PairsPanel
          progress={progress}
          onChange={setProgress}
          onPractice={(word) => {
            patch({ start: 'own', startWord: word });
            setViewingPairs(false);
            setStep(2);
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack gap="lg" my="md">
      <Group justify="space-between" align="end" wrap="wrap" gap="xs">
        <div>
          <Text style={{ fontSize: 'clamp(22px, 6.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Łańcuch skojarzeń
          </Text>
          <Text c="dimmed" size="sm">
            Skojarzenie i rym do niego, jednym ciągiem. Twój rym startuje następne ogniwo —
            tak zwrotka idzie dalej, zamiast krążyć wokół jednego słowa.
          </Text>
        </div>
        <Group gap="xs">
          <Button
            variant="light" color="gray" size="sm"
            leftSection={<IconRoute size={16} />}
            onClick={() => setViewingPairs(true)}
          >
            {played ? `${Object.keys(progress.pairs).length} skojarzeń` : 'Moje skojarzenia'}
          </Button>
          <Badge variant="light" color="brand" size="lg">krok {step + 1} / {steps.length}</Badge>
        </Group>
      </Group>

      <WizardStepper steps={steps} current={step} onSelect={setStep} />

      {step === 0 && (
        <StepShell
          title="Jak długi łańcuch"
          description="Poziomy różnią się tylko tym, ile słów masz podać i ile masz czasu na jedno ogniwo."
        >
          <Section title="Poziom">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
              <ChoiceCard
                icon={<IconInfinity size={20} />}
                title="Wolny łańcuch"
                description="Bez timera, bez limitu — idziesz, aż sam zamkniesz."
                selected={free}
                onSelect={() => patch({ level: FREE_LEVEL })}
              >
                <Text size="xs" c="dimmed">
                  Wejście, jeśli jesteś tu pierwszy raz. Poziomy dobierzesz potem.
                </Text>
              </ChoiceCard>
              {CHAIN_LEVELS.map((l) => {
                const best = bestFor(l.level, progress);
                return (
                  <ChoiceCard
                    key={l.level}
                    icon={<IconLink size={20} />}
                    title={l.label}
                    description={levelSummary(l)}
                    selected={config.level === l.level}
                    onSelect={() => patch({ level: l.level })}
                  >
                    <Text size="xs" c="dimmed">
                      {best
                        ? `Rekord ${best.total} pkt · ${best.links} ${linkWord(best.links)}`
                        : 'Jeszcze tu nie byłeś.'}
                    </Text>
                  </ChoiceCard>
                );
              })}
            </SimpleGrid>
            <Group gap="xs" mt="sm">
              <IconTrophy size={14} color="var(--mantine-color-brand-4)" />
              <Text size="xs" c="dimmed">
                Program celuje w poziom {plan} — to pierwszy, którego nie masz jeszcze
                zaliczonego na 70.
                {!free && config.level !== plan && (
                  <>
                    {' '}
                    <Text
                      span c="brand.4" style={{ cursor: 'pointer' }}
                      onClick={() => patch({ level: plan })}
                    >
                      Wskocz na niego
                    </Text>.
                  </>
                )}
              </Text>
            </Group>
          </Section>
          <WizardFooter
            onBack={() => navigate('/')}
            backLabel="Tryby"
            onNext={() => setStep(1)}
            nextLabel="Dalej"
          />
        </StepShell>
      )}

      {step === 1 && (
        <StepShell
          title="Opcje"
          description="Metronom i przegląd — reszta ustawia się automatycznie."
        >
          <Stack gap="md">
            <Section
              title="Metronom"
              hint="Bez podkładu — jednostką jest ogniwo, nie takt. Zostaje puls, jeśli go chcesz."
            >
              <Group gap="xs" wrap="wrap">
                {CHAIN_BPMS.map((b) => (
                  <Button
                    key={b} size="md"
                    variant={config.bpm === b ? 'filled' : 'default'}
                    color="brand"
                    leftSection={b > 0 ? <IconMetronome size={14} /> : undefined}
                    onClick={() => patch({ bpm: b })}
                  >
                    {b === 0 ? 'wyłączony' : `${b} BPM`}
                  </Button>
                ))}
              </Group>
            </Section>

            <Section title="Po rundzie">
              <Switch
                size="md" color="brand"
                label="Szczery przegląd"
                description="Sam zaznaczasz ogniwa, które były naciągane — my nie oceniamy skojarzeń."
                checked={config.review}
                onChange={(e) => patch({ review: e.currentTarget.checked })}
              />
              {speechSupported && (
                <Box mt="md">
                  <Switch
                    size="md" color="brand"
                    label="Zacznij z włączonym mikrofonem"
                    description="Pierwsze usłyszane słowo idzie w skojarzenie, drugie w rym."
                    checked={config.voice}
                    onChange={(e) => patch({ voice: e.currentTarget.checked })}
                  />
                  {config.voice && config.bpm > 0 && (
                    <Text size="xs" c="dimmed" mt="xs">
                      Przy włączonym mikrofonie metronom milczy — klik wchodziłby prosto
                      w nasłuch. Załóż słuchawki, jeśli chcesz mieć jedno i drugie.
                    </Text>
                  )}
                </Box>
              )}
            </Section>
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
        <StepShell title="Wszystko gotowe" description="Zegar ogniwa rusza dopiero po ekranie startowym.">
          <ReadyPanel
            headline="Gotowy?"
            items={[
              { label: 'Poziom', value: free ? 'wolny łańcuch' : def.label },
              { label: 'Słowa do podania', value: free ? 'bez limitu' : `${wordCount(def)} (${def.links} ${linkWord(def.links)})` },
              { label: 'Czas na ogniwo', value: free ? 'bez zegara' : `${def.seconds} s` },
              { label: 'Metronom', value: config.bpm === 0 ? 'wyłączony' : `${config.bpm} BPM` },
              ...(speechSupported ? [{ label: 'Mikrofon', value: config.voice ? 'włączony 🎤' : 'wyłączony' }] : []),
              { label: 'Przegląd', value: config.review ? 'po rundzie' : 'pominięty' },
            ]}
            note="Nie zdążysz — ogniwo dostaje słowo od nas, oznaczone jako nasze, i idziesz dalej. Łańcuch nigdy nie umiera."
          >
            <Paper withBorder p="md" radius="md" bg="rgba(255,255,255,0.02)">
              <Box ta="center">
                <Text size="xs" c="dimmed" tt="uppercase" lts={1}>wyjdziesz od</Text>
                <Text style={{ fontSize: 'clamp(32px, 11vw, 48px)', fontWeight: 800 }} c="brand.3">?</Text>
                <Text size="xs" c="dimmed">losowane po starcie</Text>
                {record && (
                  <Text size="xs" c="dimmed" mt={6}>
                    Rekord tego poziomu: {record.links} {linkWord(record.links)}
                    {!free && ` · ${record.total} pkt`}
                  </Text>
                )}
              </Box>
            </Paper>
          </ReadyPanel>
          <WizardFooter onBack={() => setStep(1)} onNext={() => setRunning(true)} nextLabel="Rozpocznij łańcuch" />
        </StepShell>
      )}
    </Stack>
  );
}
