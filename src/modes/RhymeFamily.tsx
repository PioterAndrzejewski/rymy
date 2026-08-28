import { useMemo, useState } from 'react';
import {
  Badge, Box, Button, Group, SimpleGrid, Stack, Text, UnstyledButton, Paper,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import {
  IconDice5, IconInfinity, IconListCheck, IconMetronome, IconStopwatch, IconTargetArrow,
} from '@tabler/icons-react';
import { WizardStepper, type StepDef } from '@/components/wizard/WizardStepper';
import { StepShell, Section, WizardFooter } from '@/components/wizard/StepShell';
import { ReadyPanel } from '@/components/wizard/ReadyPanel';
import { ChoiceCard } from '@/components/wizard/ChoiceCard';
import { RHYME_ENDINGS, rhymeCount, rhymeWords } from '@/wordbank/pl/rhymes';
import { RhymeRun } from './family/RhymeRun';
import {
  DURATIONS, QUOTA_CHOICES, WORD_SECONDS_CHOICES, defaultFamilyConfig, fmtDuration,
  minSecondsFor, rhymeWord, sessionModeLabel, type FamilyConfig,
} from './family/config';

const BPMS = [0, 60, 75, 90, 110];

export function RhymeFamily() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<FamilyConfig>(defaultFamilyConfig);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const patch = (p: Partial<FamilyConfig>) => setConfig((c) => ({ ...c, ...p }));

  const endings = RHYME_ENDINGS;
  const bankSize = config.ending === 'random' ? 0 : rhymeCount(config.ending);
  const sample = useMemo(
    () => (config.ending === 'random' ? '' : rhymeWords(config.ending).slice(0, 3).join(', ')),
    [config.ending],
  );

  const steps: StepDef[] = [
    {
      id: 'ending',
      label: 'Końcówka',
      hint: config.ending === 'random' ? 'losowa' : `-${config.ending} · ${bankSize} rymów`,
      complete: config.ending === 'random' || endings.includes(config.ending),
    },
    {
      id: 'timer',
      label: 'Tryb',
      hint: `${sessionModeLabel(config)} · ${fmtDuration(config.seconds)}`,
      complete: true,
    },
    { id: 'start', label: 'Start', hint: undefined, complete: true },
  ];

  if (running) return <RhymeRun config={config} onExit={() => setRunning(false)} />;

  return (
    <Stack gap="lg" my="md">
      <Group justify="space-between" align="end" wrap="wrap" gap="xs">
        <div>
          <Text style={{ fontSize: 'clamp(22px, 6.5vw, 26px)', fontWeight: 800, letterSpacing: '-0.02em' }}>Wypluj się z rymów</Text>
          <Text c="dimmed" size="sm">
            Jedno słowo, zegar i tyle rymów do niego, ile zdążysz wpisać. Bez podkładu.
          </Text>
        </div>
        <Badge variant="light" color="brand" size="lg">krok {step + 1} / {steps.length}</Badge>
      </Group>

      <WizardStepper steps={steps} current={step} onSelect={setStep} />

      {step === 0 && (
        <StepShell title="Wybierz końcówkę" description="Każda rodzina ma własny słownik rymów — po rundzie pokażemy, co ci umknęło.">
          <Stack gap="md">
            <Section title="Końcówka rymu">
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="md">
                <ChoiceCard
                  icon={<IconDice5 size={20} />}
                  title="Losowa"
                  description="Poznasz ją dopiero po starcie — zero czasu na ściąganie."
                  selected={config.ending === 'random'}
                  onSelect={() => patch({ ending: 'random' })}
                />
                <ChoiceCard
                  icon={<IconTargetArrow size={20} />}
                  title="Wybieram sam"
                  description="Ćwicz konkretną rodzinę rymów."
                  selected={config.ending !== 'random'}
                  onSelect={() => patch({ ending: endings[0] ?? 'random' })}
                />
              </SimpleGrid>

              {config.ending !== 'random' && (
                <Group gap={6} wrap="wrap">
                  {endings.map((e) => (
                    <UnstyledButton key={e} onClick={() => patch({ ending: e })}>
                      <Badge
                        size="lg"
                        variant={config.ending === e ? 'filled' : 'light'}
                        color={config.ending === e ? 'brand' : 'gray'}
                        style={{ cursor: 'pointer' }}
                        rightSection={
                          <Text span size="10px" c={config.ending === e ? undefined : 'dimmed'}>
                            {rhymeCount(e)}
                          </Text>
                        }
                      >
                        -{e}
                      </Badge>
                    </UnstyledButton>
                  ))}
                </Group>
              )}
              {config.ending !== 'random' && (
                <Text size="xs" c="dimmed" mt="sm">
                  Znamy {bankSize} rymów z tą końcówką{sample ? `, np. ${sample}` : ''}.
                </Text>
              )}
            </Section>
          </Stack>
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
        <StepShell title="Jak lecimy" description="Jedno słowo przez całą rundę, czy kolejka słów jedno po drugim.">
          <Stack gap="md">
            <Section title="Tryb sesji">
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                <ChoiceCard
                  icon={<IconInfinity size={20} />}
                  title="Jedno słowo"
                  description="Cała runda na jednym słowie — ile rymów wyciśniesz."
                  selected={config.sessionMode === 'single'}
                  onSelect={() => patch({ sessionMode: 'single' })}
                />
                <ChoiceCard
                  icon={<IconListCheck size={20} />}
                  title="Kilka rymów i dalej"
                  description="Dobijasz limit i wskakuje następne słowo. Wynik = ile słów zaliczysz."
                  selected={config.sessionMode === 'quota'}
                  onSelect={() => patch({ sessionMode: 'quota', seconds: minSecondsFor('quota', config.seconds) })}
                >
                  <Group gap="xs">
                    {QUOTA_CHOICES.map((n) => (
                      <Button
                        key={n} size="xs"
                        variant={config.quota === n ? 'filled' : 'default'}
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
                  description="Każde słowo dostaje swoje sekundy, potem następne — bez litości."
                  selected={config.sessionMode === 'timed'}
                  onSelect={() => patch({ sessionMode: 'timed', seconds: minSecondsFor('timed', config.seconds) })}
                >
                  <Group gap="xs">
                    {WORD_SECONDS_CHOICES.map((n) => (
                      <Button
                        key={n} size="xs"
                        variant={config.wordSeconds === n ? 'filled' : 'default'}
                        color="brand"
                        onClick={() => patch({ wordSeconds: n })}
                      >
                        {n} s
                      </Button>
                    ))}
                  </Group>
                </ChoiceCard>
              </SimpleGrid>
              {config.sessionMode !== 'single' && (
                <Text size="xs" c="dimmed" mt="sm">
                  {config.ending === 'random'
                    ? 'Każde słowo to nowa rodzina rymów — losujemy ją w locie.'
                    : `Każde słowo z rodziny -${config.ending}. Chcesz mieszać końcówki? Wybierz losową w poprzednim kroku.`}
                </Text>
              )}
            </Section>

            <Section title="Długość rundy">
              <Group gap="xs" wrap="wrap">
                {DURATIONS.map((sec) => (
                  <Button
                    key={sec} size="md"
                    variant={config.seconds === sec ? 'filled' : 'default'}
                    color="brand"
                    onClick={() => patch({ seconds: sec })}
                  >
                    {fmtDuration(sec)}
                  </Button>
                ))}
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                Krótka runda = sprint na skojarzenia. Dłuższa = kopiesz głębiej w rodzinę rymów.
              </Text>
            </Section>
            <Section title="Metronom" hint="Puls pomaga trzymać flow, ale nie jest obowiązkowy.">
              <Group gap="xs" wrap="wrap">
                {BPMS.map((b) => (
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
          </Stack>
          <WizardFooter onBack={() => setStep(0)} onNext={() => setStep(2)} nextLabel="Gotowe" finish />
        </StepShell>
      )}

      {step === 2 && (
        <StepShell title="Wszystko gotowe" description="Zegar rusza od razu po kliknięciu.">
          <ReadyPanel
            headline="Gotowy?"
            items={[
              { label: 'Końcówka', value: config.ending === 'random' ? 'losowa 🎲' : `-${config.ending}` },
              ...(sample ? [{ label: 'Np. rym do', value: sample }] : []),
              { label: 'Tryb', value: sessionModeLabel(config) },
              { label: 'Czas', value: fmtDuration(config.seconds) },
              { label: 'Metronom', value: config.bpm === 0 ? 'wyłączony' : `${config.bpm} BPM` },
            ]}
            note="Wpisuj rymy i zatwierdzaj Enterem. Duplikat zatrzęsie polem i nie wejdzie na listę."
          >
            <Paper withBorder p="md" radius="md" bg="rgba(255,255,255,0.02)">
              <Box ta="center">
                <Text size="xs" c="dimmed" tt="uppercase" lts={1}>rymujesz do</Text>
                <Text style={{ fontSize: 'clamp(36px, 12vw, 52px)', fontWeight: 800 }} c="brand.3">
                  {config.ending === 'random' ? '?' : (sample || `-${config.ending}`)}
                </Text>
                {config.ending !== 'random' && (
                  <Text size="xs" c="dimmed">
                    końcówka -{config.ending} · słowo losowane po starcie
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
