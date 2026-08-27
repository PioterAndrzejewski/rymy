import { useState } from 'react';
import { Badge, Group, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/state/session';
import { WizardStepper, type StepDef } from '@/components/wizard/WizardStepper';
import { StepShell, WizardFooter } from '@/components/wizard/StepShell';
import { ReadyPanel } from '@/components/wizard/ReadyPanel';
import { TrackStep } from '@/components/setup/TrackStep';
import { TopicStep } from './story/TopicStep';
import { StoryWordsStep } from './story/StoryWordsStep';
import { StoryRun } from './story/StoryRun';
import { defaultStoryConfig, type StoryConfig } from './story/config';
import { barsToTime, fmtBpm } from '@/lib/format';

export function StoryMode() {
  const navigate = useNavigate();
  const { track } = useSession();

  const [config, setConfig] = useState<StoryConfig>(defaultStoryConfig);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);

  const patch = (p: Partial<StoryConfig>) => setConfig((c) => ({ ...c, ...p }));

  const topicReady = config.topicMode === 'auto' || config.topic.trim().length > 0;
  const introBars = track?.introBars ?? 0;
  const totalBars = introBars + config.slots * config.barsPerKeyword;
  const beatsPerBar = track?.timeSignature[0] ?? 4;

  const steps: StepDef[] = [
    {
      id: 'track',
      label: 'Podkład',
      hint: track ? `${track.name} · ${fmtBpm(track.bpm)} BPM` : undefined,
      complete: !!track,
    },
    {
      id: 'topic',
      label: 'Temat',
      hint: config.topicMode === 'auto' ? 'losowy przy starcie' : config.topic || undefined,
      complete: topicReady,
    },
    {
      id: 'words',
      label: 'Słowa klucze',
      hint: `${config.slots} × ${config.wordsMode === 'own' ? 'własne' : `bank L${config.level}`}`,
      complete: true,
    },
    {
      id: 'start',
      label: 'Start',
      hint: track ? `${totalBars} taktów · ${barsToTime(totalBars, track.bpm, beatsPerBar)}` : undefined,
      complete: !!track && topicReady,
    },
  ];

  if (running) return <StoryRun config={config} onExit={() => setRunning(false)} />;

  return (
    <Stack gap="lg" my="md">
      <Group justify="space-between" align="end">
        <div>
          <Text size="26px" fw={800} lts="-0.02em">Historia</Text>
          <Text c="dimmed" size="sm">
            Temat + słowa klucze, chwila na zapamiętanie, a potem opowiadasz historię do podkładu.
          </Text>
        </div>
        <Badge variant="light" color="brand" size="lg">krok {step + 1} / {steps.length}</Badge>
      </Group>

      <WizardStepper steps={steps} current={step} onSelect={setStep} />

      {step === 0 && (
        <StepShell title="Wybierz podkład">
          <TrackStep />
          <WizardFooter
            onBack={() => navigate('/')}
            backLabel="Tryby"
            onNext={() => setStep(1)}
            nextLabel="Gotowe"
            finish
            nextDisabled={!track}
            blockedReason="Wybierz podkład, żeby przejść dalej."
          />
        </StepShell>
      )}

      {step === 1 && (
        <StepShell
          title="Temat historii"
          description="Chcesz wiedzieć, o czym opowiadasz — czy wolisz dowiedzieć się dopiero przy starcie?"
        >
          <TopicStep config={config} patch={patch} />
          <WizardFooter
            onBack={() => setStep(0)}
            onNext={() => setStep(2)}
            nextLabel="Gotowe"
            finish
            nextDisabled={!topicReady}
            blockedReason="Wpisz temat albo wybierz losowanie."
          />
        </StepShell>
      )}

      {step === 2 && (
        <StepShell
          title="Słowa klucze"
          description="Słowa, które muszą paść w kolejności. Możesz wpisać je sam przed startem albo je wylosować."
        >
          <StoryWordsStep config={config} patch={patch} />
          <WizardFooter
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            nextLabel="Gotowe"
            finish
          />
        </StepShell>
      )}

      {step === 3 && (
        <StepShell title="Wszystko gotowe" description="Sprawdź podsumowanie i zaczynamy.">
          <ReadyPanel
            headline="Gotowy?"
            items={[
              { label: 'Podkład', value: track?.name ?? '—' },
              { label: 'Tempo', value: `${fmtBpm(track?.bpm)} BPM` },
              { label: 'Temat', value: config.topicMode === 'auto' ? 'losowy 🎲' : config.topic },
              { label: 'Słowa', value: config.wordsMode === 'own' ? `${config.slots} własnych` : `${config.slots} z L${config.level}` },
              { label: 'Na słowo', value: `${config.barsPerKeyword} takty` },
              { label: 'Zapamiętanie', value: `${config.memorizeSec} s` },
              { label: 'Długość', value: `${totalBars} taktów` },
              { label: 'Czas', value: track ? barsToTime(totalBars, track.bpm, beatsPerBar) : '—' },
            ]}
            note={
              config.wordsMode === 'own'
                ? 'Najpierw zobaczysz temat i wpiszesz słowa, potem chwila na zapamiętanie, odliczanie i podkład.'
                : 'Najpierw temat i słowa do zapamiętania, potem odliczanie i podkład.'
            }
          />
          <WizardFooter
            onBack={() => setStep(2)}
            onNext={() => setRunning(true)}
            nextLabel="Rozpocznij ćwiczenie"
            nextDisabled={!track || !topicReady}
            blockedReason="Uzupełnij poprzednie kroki."
          />
        </StepShell>
      )}
    </Stack>
  );
}
