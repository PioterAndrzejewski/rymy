import { forwardRef } from 'react';
import {
  ActionIcon, Box, Button, Group, Paper, Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { IconMicrophone, IconMicrophoneOff, IconRobot } from '@tabler/icons-react';
import type { ChainLink } from '@/storage/chainProgress';

export type Slot = 'assoc' | 'rhyme';

type Props = {
  /** słowo startowe łańcucha — pierwsze słowo główne */
  seed: string;
  /** domknięte ogniwa — z nich składamy linijki nad polem */
  links: ChainLink[];
  /** słowo główne, do którego należy to ogniwo */
  from: string;
  slot: Slot;
  /** skojarzenie, gdy wpisujesz już rym */
  assoc: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  error: string;
  /** 'ok' / 'bad' — błysk po ocenie słowa (klawiatura i mikrofon tak samo) */
  flash: 'ok' | 'bad' | null;
  shake: boolean;
  /** ms do końca ogniwa; 0 = wolny łańcuch, bez zegara */
  remaining: number;
  total: number;
  disabled: boolean;
  readOnly: boolean;
  mic: boolean;
  micSupported: boolean;
  onToggleMic: () => void;
};

const RING = 34;
const CIRCUMFERENCE = 2 * Math.PI * RING;

/** Ile linijek widać nad tą, którą właśnie piszesz. */
const TAIL = 3;

/**
 * Kolor pary rymowej: aa, bb, aa, bb…
 *
 * Rym łączy słowo główne z linijki wyżej z wypełniaczem z linijki niżej —
 * po kolorze widać tę parę bez czytania.
 */
function hue(pair: number): string {
  return pair % 2 === 0 ? 'var(--mantine-color-brand-4)' : 'var(--mantine-color-teal-4)';
}

/** Pierścień czasu na ogniwo — jeden rzut oka, bez czytania cyfr. */
function TimerRing({ remaining, total }: { remaining: number; total: number }) {
  const left = total > 0 ? Math.max(0, remaining / total) : 1;
  const urgent = left <= 0.25;
  return (
    <Box style={{ position: 'relative', width: 84, height: 84, flexShrink: 0 }}>
      <svg width={84} height={84} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={42} cy={42} r={RING} fill="none" stroke="var(--mantine-color-dark-5)" strokeWidth={5} />
        <circle
          cx={42} cy={42} r={RING} fill="none" strokeWidth={5} strokeLinecap="round"
          stroke={urgent ? 'var(--mantine-color-red-5)' : 'var(--mantine-color-brand-5)'}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - left)}
        />
      </svg>
      <Box
        style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums',
          color: urgent ? 'var(--mantine-color-red-4)' : undefined,
        }}
      >
        {Math.ceil(remaining / 1000)}
      </Box>
    </Box>
  );
}

/** Jedna linijka: [wypełniacz] [słowo główne]. */
function Row({
  filler, main, pair, opacity, auto,
}: {
  filler: React.ReactNode;
  main: React.ReactNode;
  pair: number;
  opacity: number;
  auto?: boolean;
}) {
  return (
    <Group gap="sm" wrap="nowrap" align="center" style={{ opacity, transition: 'opacity 240ms ease' }}>
      <Box style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>{filler}</Box>
      <Box
        w={1} h={22}
        style={{ background: 'var(--mantine-color-dark-4)', flexShrink: 0, borderRadius: 1 }}
      />
      <Box style={{ flex: 1, minWidth: 0 }}>{main}</Box>
      <Group gap={4} w={34} justify="flex-end" wrap="nowrap" style={{ flexShrink: 0 }}>
        {auto && <IconRobot size={12} opacity={0.6} />}
        <Box w={6} h={6} style={{ borderRadius: '50%', background: hue(pair) }} />
      </Group>
    </Group>
  );
}

const wordStyle = { fontSize: 'clamp(18px, 5vw, 26px)', fontWeight: 700, lineHeight: 1.2 } as const;

/**
 * Linijki zamiast dwóch osobnych kroków.
 *
 * Łańcuch idzie po słowach głównych — prawa kolumna. Skojarzenie zawsze wychodzi
 * ze słowa głównego, nigdy z rymu: rym to wypełniacz, który domyka poprzednią
 * linijkę i tylko prowadzi cię do następnego słowa. Dlatego najpierw wpisujesz
 * skojarzenie (po prawej), a potem rym, który do niego dojedzie (po lewej) —
 * tak samo, jak układa się to w śpiewaniu.
 */
export const LinkInput = forwardRef<HTMLInputElement, Props>(function LinkInput(
  {
    seed, links, from, slot, assoc, value, onChange, onSubmit, onBack, error, flash, shake,
    remaining, total, disabled, readOnly, mic, micSupported, onToggleMic,
  },
  ref,
) {
  const timed = total > 0;
  // Linijka 0 to samo słowo startowe — nie ma czego domykać przed nim.
  const rows = [
    { filler: '', main: seed, auto: false },
    ...links.map((l) => ({ filler: l.rhyme, main: l.assoc, auto: l.auto })),
  ];
  const tail = rows.slice(-TAIL);
  const offset = rows.length - tail.length;
  const open = rows.length; // para, którą otworzy skojarzenie z pisanej linijki

  const field = (
    <div
      className={shake || flash === 'bad' ? 'rymy-shake' : flash === 'ok' ? 'rymy-flash-ok' : ''}
      style={{ minWidth: 0 }}
    >
      <TextInput
        ref={ref}
        size="md"
        variant="filled"
        placeholder={slot === 'assoc' ? `skojarz z „${from}"` : `rym do „${assoc}"`}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
          // Backspace na pustym polu wraca do skojarzenia — poprawka bez myszy.
          if (e.key === 'Backspace' && !value && slot === 'rhyme') onBack();
        }}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="next"
        error={error || undefined}
        styles={{ input: { fontSize: 20, fontWeight: 700, textAlign: slot === 'rhyme' ? 'right' : 'left' } }}
      />
    </div>
  );

  return (
    <Paper withBorder p={{ base: 'md', sm: 'lg' }} radius="md">
      <Group justify="space-between" gap="sm" wrap="nowrap" mb="sm">
        <Box style={{ minWidth: 0 }}>
          <Text size="xs" c="dimmed" tt="uppercase" lts={1}>
            {slot === 'assoc' ? 'skojarz ze słowem głównym' : 'domknij rym'}
          </Text>
          <Text size="sm" c="dimmed">
            {slot === 'assoc'
              ? <>Co ci przychodzi z „<Text span c="brand.3" fw={700}>{from}</Text>"?</>
              : <>Teraz rym do „<Text span c="brand.3" fw={700}>{assoc}</Text>" — wypełniacz domykający linijkę.</> }
          </Text>
        </Box>
        {timed && <TimerRing remaining={remaining} total={total} />}
      </Group>

      <Group gap="sm" wrap="nowrap" mb={6} px={2}>
        <Text size="10px" tt="uppercase" lts={1} c="dimmed" style={{ flex: 1, textAlign: 'right' }}>
          rym
        </Text>
        <Box w={1} style={{ flexShrink: 0 }} />
        <Text size="10px" tt="uppercase" lts={1} c="dimmed" style={{ flex: 1 }}>
          słowo główne
        </Text>
        <Box w={34} style={{ flexShrink: 0 }} />
      </Group>

      <Stack gap={6}>
        {tail.map((r, i) => {
          const idx = offset + i;
          const last = idx === rows.length - 1;
          return (
            <Row
              key={`${r.main}-${idx}`}
              pair={idx}
              auto={r.auto}
              opacity={last ? 1 : 0.28 + 0.22 * i}
              filler={
                r.filler
                  ? <Text style={wordStyle} c={hue(idx - 1)} truncate>{r.filler}</Text>
                  : <Text size="xs" c="dimmed">start</Text>
              }
              main={<Text style={wordStyle} c={last ? undefined : 'dimmed'} truncate>{r.main}</Text>}
            />
          );
        })}

        {/* Linijka, którą właśnie piszesz — wjeżdża od dołu, reszta blednie w górę. */}
        <Box key={links.length} className="rymy-fade-up">
          <Row
            pair={open}
            opacity={1}
            filler={
              slot === 'rhyme'
                ? field
                : <Text style={wordStyle} c="dimmed" opacity={0.35} truncate>rym do skojarzenia…</Text>
            }
            main={
              slot === 'assoc'
                ? field
                : (
                  <Tooltip label="Backspace wraca do skojarzenia" withArrow>
                    <Text
                      style={{ ...wordStyle, cursor: 'pointer' }}
                      c={hue(open)}
                      onClick={onBack}
                      truncate
                    >
                      {assoc}
                    </Text>
                  </Tooltip>
                )
            }
          />
        </Box>
      </Stack>

      <Group justify="center" gap="sm" wrap="nowrap" mt="md">
        <Button size="md" color="brand" onClick={onSubmit} disabled={disabled || readOnly || !value.trim()}>
          {slot === 'assoc' ? 'Dalej' : 'Zamknij linijkę'}
        </Button>
        {micSupported && (
          <Tooltip label={mic ? 'Wyłącz mikrofon' : 'Mów zamiast pisać'} withArrow>
            <ActionIcon
              size={42} radius="xl"
              variant={mic ? 'filled' : 'default'}
              color={mic ? 'red' : 'gray'}
              className={mic ? 'rymy-pulse' : undefined}
              onClick={onToggleMic}
              disabled={disabled}
              aria-label={mic ? 'Wyłącz mikrofon' : 'Włącz mikrofon'}
            >
              {mic ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <Text size="xs" c="dimmed" ta="center" mt="sm">
        {slot === 'assoc'
          ? 'Najpierw dokąd idziesz — skojarzenie zawsze wychodzi ze słowa głównego.'
          : 'Teraz rym do twojego skojarzenia — wypełniacz domykający linijkę.'}
      </Text>
    </Paper>
  );
});
