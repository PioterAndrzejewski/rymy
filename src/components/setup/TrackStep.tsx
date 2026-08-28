import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActionIcon, Alert, Badge, Box, Button, Collapse, Group, NumberInput, Paper,
  SimpleGrid, Slider, Stack, Switch, Text, Tooltip,
} from '@mantine/core';
import {
  IconAdjustmentsHorizontal, IconChevronDown, IconHandFinger,
  IconMinus, IconMusicOff, IconPlayerPlayFilled, IconPlayerPauseFilled,
  IconMetronome, IconPencil, IconPlayerTrackPrevFilled, IconPlus, IconRestore, IconTargetArrow,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Link } from 'react-router-dom';
import type { Track } from '@/types';
import { useLibrary } from '@/state/library';
import { useSession } from '@/state/session';
import { useEngineState, useTransport } from '@/audio/useTransport';
import { useClickDriver } from '@/audio/useClickDriver';
import { engine } from '@/audio/engineSingleton';
import { TapTempo } from '@/audio/tapTempo';
import { resolveTrackSrc } from '@/storage/tracksLibrary';
import { isClickOnly, makeClickTrack } from '@/audio/clickTrack';
import { clearOverride, patchOverride, scopeFor } from '@/storage/trackOverrides';
import { loadSettings, saveSettings, type Settings } from '@/storage/settings';
import { Section } from '@/components/wizard/StepShell';
import { BeatPulse } from '@/components/BeatPulse';
import { TrackCard } from './TrackCard';
import { fmtBpm, fmtTime, roundBpm } from '@/lib/format';

/**
 * Step 1 for Cue and Story: pick a backing track, listen to it, verify the tempo
 * against the metronome and mark where the intro ends. Everything the user
 * changes here is persisted per track (localStorage override), so it is a
 * one-time job per backing track.
 */
export function TrackStep() {
  const { tracks, loading, error, refresh } = useLibrary();
  const { track, setTrack, updateTrack } = useSession();
  const engineState = useEngineState();
  const snap = useTransport(track);
  // The click lives here and nowhere else: it is a tool for verifying the tempo,
  // not something you want ticking over the exercise itself.
  useClickDriver(track, { force: isClickOnly(track) });

  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [rate, setRate] = useState(() => engine.playbackRate);
  const [seekMs, setSeekMs] = useState<number | null>(null);
  const [tapBpm, setTapBpm] = useState<number | null>(null);
  const [tuning, setTuning] = useState(false);
  const tapRef = useRef(new TapTempo());

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { engine.setVolume(settings.masterVolume); }, [settings.masterVolume]);

  function patchSettings(p: Partial<Settings>) {
    const next = { ...settings, ...p };
    setSettings(next);
    saveSettings(next);
  }

  const select = useCallback(async (t: Track) => {
    if (track?.id === t.id) return;
    engine.pause();
    setTrack(t);
    try {
      const src = await resolveTrackSrc(t);
      await engine.load(src, t.source === 'user');
      engine.setVolume(loadSettings().masterVolume);
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Nie można załadować podkładu',
        message: (e as Error).message,
      });
    }
  }, [track?.id, setTrack]);

  const selectClickOnly = useCallback(() => {
    engine.pause();
    engine.loadClickOnly();
    setTrack(makeClickTrack());
  }, [setTrack]);

  const togglePreview = useCallback(async (t: Track) => {
    if (track?.id !== t.id) {
      await select(t);
      void engine.play();
      return;
    }
    engine.toggle();
  }, [track?.id, select]);

  function setBpm(bpm: number) {
    if (!track || !isFinite(bpm)) return;
    const clamped = roundBpm(Math.max(40, Math.min(240, bpm)));
    patchOverride(track.id, { bpm: clamped }, scopeFor(track.source));
    updateTrack({ bpm: clamped });
  }

  function nudgeOffset(deltaMs: number) {
    if (!track) return;
    const next = Math.max(0, track.downbeatOffsetMs + deltaMs);
    patchOverride(track.id, { downbeatOffsetMs: next }, scopeFor(track.source));
    updateTrack({ downbeatOffsetMs: next });
  }

  /** Mark the very first downbeat: bar 1 starts exactly where the user tapped. */
  function markDownbeat() {
    if (!track) return;
    const next = Math.max(0, Math.round(engine.currentTimeMs));
    patchOverride(track.id, { downbeatOffsetMs: next }, scopeFor(track.source));
    updateTrack({ downbeatOffsetMs: next });
    notifications.show({ color: 'brand', message: `Pierwszy takt ustawiony na ${fmtTime(next)}` });
  }

  function setIntroBars(n: number) {
    if (!track) return;
    const clamped = Math.max(0, Math.min(64, Math.round(n)));
    patchOverride(track.id, { introBars: clamped }, scopeFor(track.source));
    updateTrack({ introBars: clamped });
  }

  /** Back to the values the track ships with (tracks.json, or the upload form). */
  async function resetTrack() {
    if (!track) return;
    const id = track.id;
    clearOverride(id, scopeFor(track.source));
    if (isClickOnly(track)) {
      setTrack(makeClickTrack());
      notifications.show({ color: 'brand', message: 'Przywrócono domyślne ustawienia' });
      return;
    }
    await refresh();
    const fresh = useLibrary.getState().tracks.find((t) => t.id === id);
    if (fresh) setTrack(fresh);
    notifications.show({ color: 'brand', message: 'Przywrócono domyślne ustawienia podkładu' });
  }

  function applyRate(r: number) {
    const clamped = Math.round(r * 20) / 20;
    setRate(clamped);
    engine.setPreservePitch(settings.tempoMode === 'pitch-preserving');
    engine.setPlaybackRate(clamped);
  }

  function tap() { setTapBpm(tapRef.current.tap()); }
  function applyTap() {
    if (tapBpm == null) return;
    setBpm(tapBpm);
    tapRef.current.reset();
    setTapBpm(null);
  }

  const isPlaying = engineState === 'playing';
  const durationMs = engine.durationMs;
  const beatsPerBar = track?.timeSignature[0] ?? 4;
  const clickOnly = isClickOnly(track);
  const introBars = track?.introBars ?? 0;

  return (
    <Stack gap="md">
      <Section
        title="Podkład"
        aside={
          <Group gap="xs">
            {loading && <Text size="xs" c="dimmed">ładowanie…</Text>}
            {error && <Text size="xs" c="red">błąd: {error}</Text>}
            <Badge variant="light" color="gray" size="sm">{tracks.length}</Badge>
            <Button
              component={Link}
              to="/tracks"
              size="sm"
              variant="default"
              leftSection={<IconPencil size={14} />}
            >
              Edytuj podkłady
            </Button>
          </Group>
        }
      >
        <Paper
          withBorder p="md" radius="md" mb="sm"
          className="rymy-clickable"
          onClick={selectClickOnly}
          style={{
            borderColor: clickOnly ? 'var(--mantine-color-brand-6)' : undefined,
            background: clickOnly ? 'rgba(243, 184, 29, 0.07)' : undefined,
          }}
        >
          <Group wrap="nowrap" align="center" gap="sm">
            <Box
              w={42} h={42}
              style={{
                flexShrink: 0, borderRadius: '50%', display: 'grid', placeItems: 'center',
                background: clickOnly ? 'var(--mantine-color-brand-7)' : 'var(--mantine-color-dark-6)',
                color: clickOnly ? '#fff' : 'var(--mantine-color-dimmed)',
              }}
            >
              <IconMetronome size={20} />
            </Box>
            <Box style={{ minWidth: 0 }}>
              <Text fw={600}>Bez podkładu — sam metronom</Text>
              <Text size="xs" c="dimmed">Tylko klik w wybranym tempie. Takty liczą się tak samo.</Text>
            </Box>
          </Group>
        </Paper>

        {tracks.length === 0 && !loading ? (
          <Alert color="yellow" variant="light" icon={<IconMusicOff size={16} />}>
            Brak podkładów.{' '}
            <Text component={Link} to="/tracks" c="brand.4" fw={600} style={{ textDecoration: 'underline' }}>
              Dodaj podkład
            </Text>{' '}
            i wróć tutaj.
          </Alert>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
            {tracks.map((t) => (
              <TrackCard
                key={t.id}
                track={t}
                selected={track?.id === t.id}
                playing={track?.id === t.id && isPlaying}
                onSelect={select}
                onTogglePreview={togglePreview}
              />
            ))}
          </SimpleGrid>
        )}
      </Section>

      <Section
        title="Odsłuch"
        muted={!track}
        aside={track ? (
          <Group gap={6}>
            <Badge variant="light" color="brand">{fmtBpm(track.bpm)} BPM</Badge>
            <Badge variant="light" color="gray">intro {introBars}</Badge>
            <Button
              size="sm" variant="subtle" color="gray"
              leftSection={<IconRestore size={14} />}
              onClick={() => void resetTrack()}
            >
              Przywróć domyślne
            </Button>
          </Group>
        ) : undefined}
      >
        {!track ? (
          <Text size="sm" c="dimmed">Najpierw wybierz podkład.</Text>
        ) : (
          <Stack gap="lg">
            {/* transport + scrub */}
            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
              <ActionIcon
                size={48} radius="xl" variant="filled" color="brand"
                onClick={() => engine.toggle()}
                aria-label={isPlaying ? 'Pauza' : 'Odtwórz'}
              >
                {isPlaying ? <IconPlayerPauseFilled size={20} /> : <IconPlayerPlayFilled size={20} />}
              </ActionIcon>
              <Tooltip label="Od początku">
                <ActionIcon size={48} radius="xl" variant="default" onClick={() => engine.seekMs(0)}>
                  <IconPlayerTrackPrevFilled size={18} />
                </ActionIcon>
              </Tooltip>
              {clickOnly ? (
                <Text size="xs" c="dimmed" style={{ flex: 1 }}>
                  Sam klik — takty liczymy od pierwszego uderzenia.
                </Text>
              ) : (
                <Box style={{ flex: 1 }}>
                  <Slider
                    min={0}
                    max={Math.max(1000, durationMs)}
                    step={100}
                    color="brand"
                    label={(v) => fmtTime(v)}
                    value={seekMs ?? snap.timeMs}
                    onChange={setSeekMs}
                    onChangeEnd={(v) => { engine.seekMs(v); setSeekMs(null); }}
                  />
                </Box>
              )}
              <Text
                size="xs" ff="monospace" c="dimmed" visibleFrom="xs"
                style={{ whiteSpace: 'nowrap' }}
              >
                {fmtTime(seekMs ?? snap.timeMs)}{clickOnly ? '' : ` / ${fmtTime(durationMs)}`}
              </Text>
            </Group>

            <Text size="xs" ff="monospace" c="dimmed" ta="center" hiddenFrom="xs" mt={-8}>
              {fmtTime(seekMs ?? snap.timeMs)}{clickOnly ? '' : ` / ${fmtTime(durationMs)}`}
            </Text>

            {/* live bar / beat feedback + metronome */}
            <Group justify="space-between" wrap="wrap" gap="md">
              <Group gap="lg" wrap="wrap">
                {clickOnly ? (
                  <Badge variant="light" color="brand" size="lg">metronom zawsze gra</Badge>
                ) : (
                  <Switch
                    label="Metronom"
                    checked={settings.clickEnabled}
                    color="brand"
                    onChange={(e) => patchSettings({ clickEnabled: e.currentTarget.checked })}
                  />
                )}
                <BeatPulse beatsPerBar={beatsPerBar} beat={snap.beat} active={isPlaying} />
                {!clickOnly && (
                  <Group gap={8} wrap="nowrap" align="center" ml={{ base: 0, sm: 32 }}>
                    <Text size="xs" c="dimmed">Prędkość</Text>
                    <Slider
                      w={110}
                      size="sm"
                      min={0.5} max={1.5} step={0.05}
                      color="brand"
                      value={rate}
                      onChange={applyRate}
                      label={(v) => `${v.toFixed(2)}×`}
                      marks={[{ value: 1 }]}
                    />
                    <Text
                      size="xs" ff="monospace" fw={600}
                      c={rate === 1 ? 'dimmed' : 'brand.4'}
                      style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title="Wróć do 1×"
                      onClick={() => applyRate(1)}
                    >
                      {rate.toFixed(2)}×
                    </Text>
                  </Group>
                )}
              </Group>
              <Group gap="xs">
                <Badge variant="light" color="gray">takt {snap.bar < 0 ? '–' : snap.bar + 1}</Badge>
                <Badge variant="light" color={snap.bar >= 0 && snap.bar < introBars ? 'accent' : 'brand'}>
                  {snap.bar < 0 ? 'przed jedynką' : snap.bar < introBars ? 'intro' : 'słowa'}
                </Badge>
              </Group>
            </Group>

            <IntroStrip
              introBars={introBars}
              currentBar={isPlaying ? snap.bar : -1}
              barPhase={snap.barPhase}
            />

            {/* everything below is per-track fine-tuning — collapsed by default */}
            <Box>
              {!clickOnly && (
              <Button
                variant={tuning ? 'light' : 'default'}
                color="brand"
                size="sm"
                leftSection={<IconAdjustmentsHorizontal size={16} />}
                rightSection={
                  <IconChevronDown
                    size={14}
                    style={{ transform: tuning ? 'rotate(180deg)' : undefined, transition: 'transform 180ms ease' }}
                  />
                }
                onClick={() => setTuning((t) => !t)}
              >
                Dopasuj podkład
              </Button>
              )}
              {!tuning && !clickOnly && (
                <Text size="xs" c="dimmed" mt={6}>
                  Tempo podkładu, pierwsza jedynka i głośności.
                </Text>
              )}

              <Collapse in={tuning || clickOnly}>
                <Stack gap="lg" mt="md">
                  {/* BPM */}
                  <Stack gap={6}>
                    <Group justify="space-between">
                      <Text size="sm" fw={600}>{clickOnly ? 'Tempo metronomu' : 'Tempo podkładu'}</Text>
                      <Text size="sm" c="brand.4" fw={700}>{fmtBpm(track.bpm)} BPM</Text>
                    </Group>
                    <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                      <Slider
                        flex={1} min={40} max={240} step={0.1} color="brand"
                        value={track.bpm} onChange={setBpm}
                        label={(v) => fmtBpm(v)}
                        marks={[{ value: 60 }, { value: 90 }, { value: 120 }, { value: 160 }, { value: 200 }]}
                      />
                      <NumberInput
                        w={92} min={40} max={240} step={0.1} hideControls
                        decimalScale={1} fixedDecimalScale={false} allowNegative={false}
                        value={track.bpm} onChange={(v) => setBpm(Number(v))}
                      />
                    </Group>
                    <Group gap="xs" wrap="nowrap" align="center">
                      <Text size="xs" c="dimmed" w={54} style={{ flexShrink: 0 }}>Popraw</Text>
                      <Button.Group style={{ flex: 1, minWidth: 0 }}>
                        <Button variant="default" size="sm" flex={1} px={4} onClick={() => setBpm(track.bpm - 1)}>−1</Button>
                        <Button variant="default" size="sm" flex={1} px={4} onClick={() => setBpm(track.bpm - 0.1)}>−0.1</Button>
                        <Button variant="default" size="sm" flex={1} px={4} onClick={() => setBpm(track.bpm + 0.1)}>+0.1</Button>
                        <Button variant="default" size="sm" flex={1} px={4} onClick={() => setBpm(track.bpm + 1)}>+1</Button>
                      </Button.Group>
                    </Group>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        Podkład rozjeżdża się dopiero po kilku taktach? To ułamki BPM.
                      </Text>
                    </Group>
                    <Group gap="xs" mt={4} wrap="wrap">
                      <Button variant="default" size="sm" leftSection={<IconHandFinger size={14} />} onClick={tap}>
                        Stuknij tempo
                      </Button>
                      <Text size="xs" c="dimmed">{tapBpm != null ? `~${fmtBpm(tapBpm)} BPM` : 'stuknij min. 2 razy w rytm'}</Text>
                      <Button size="sm" variant="light" color="brand" disabled={tapBpm == null} onClick={applyTap}>
                        Zastosuj
                      </Button>
                    </Group>
                  </Stack>

                  {/* volumes + speed */}
                  <Group gap="xl" wrap="wrap" align="center">
                    <Group gap="xs" style={{ flex: 1, minWidth: 180 }}>
                      <Text size="xs" c="dimmed" w={54}>Klik</Text>
                      <Slider
                        flex={1} min={0} max={1} step={0.05} color="brand"
                        value={settings.clickVolume}
                        onChange={(v) => patchSettings({ clickVolume: v })}
                        label={(v) => `${Math.round(v * 100)}%`}
                      />
                    </Group>
                    <Group gap="xs" style={{ flex: 1, minWidth: 180 }}>
                      <Text size="xs" c="dimmed" w={54}>Podkład</Text>
                      <Slider
                        flex={1} min={0} max={1} step={0.05} color="brand"
                        value={settings.masterVolume}
                        onChange={(v) => patchSettings({ masterVolume: v })}
                        label={(v) => `${Math.round(v * 100)}%`}
                      />
                    </Group>
                  </Group>

                  {!clickOnly && (<>{/* downbeat */}
                  <Paper withBorder p="sm" radius="sm" bg="rgba(255,255,255,0.02)">
                    <Group justify="space-between" wrap="wrap" gap="sm">
                      <Box>
                        <Text size="sm" fw={600}>Pierwsza jedynka</Text>
                        <Text size="xs" c="dimmed">
                          Odtwórz podkład i kliknij dokładnie na pierwszym uderzeniu — od niego liczymy takty.
                        </Text>
                      </Box>
                      <Stack gap="xs" style={{ flex: 1, minWidth: 200 }}>
                        <Group gap="xs" wrap="wrap">
                          <Badge variant="light" color="gray" size="lg">{track.downbeatOffsetMs} ms</Badge>
                          <Button
                            size="sm" color="brand" variant="light"
                            leftSection={<IconTargetArrow size={14} />}
                            onClick={markDownbeat}
                          >
                            Ustaw tutaj
                          </Button>
                        </Group>
                        <Button.Group style={{ width: '100%' }}>
                          <Button variant="default" size="sm" flex={1} px={4} onClick={() => nudgeOffset(-100)}>−100</Button>
                          <Button variant="default" size="sm" flex={1} px={4} onClick={() => nudgeOffset(-10)}>−10</Button>
                          <Button variant="default" size="sm" flex={1} px={4} onClick={() => nudgeOffset(10)}>+10</Button>
                          <Button variant="default" size="sm" flex={1} px={4} onClick={() => nudgeOffset(100)}>+100</Button>
                        </Button.Group>
                      </Stack>
                    </Group>
                  </Paper></>)}

                  {/* intro */}
                  <Paper withBorder p="sm" radius="sm" bg="rgba(255,255,255,0.02)">
                    <Group justify="space-between" wrap="wrap" gap="sm">
                      <Box>
                        <Text size="sm" fw={600}>Intro — kiedy wchodzą słowa</Text>
                        <Text size="xs" c="dimmed">
                          Takty intro grają bez słów, żebyś zdążył wejść w rytm.
                        </Text>
                      </Box>
                      <Group gap="xs" wrap="wrap" style={{ flex: 1, minWidth: 200 }}>
                        <Badge variant="light" color="brand" size="lg">{introBars} taktów</Badge>
                        <Button.Group>
                          <Button variant="default" size="sm" leftSection={<IconMinus size={12} />} onClick={() => setIntroBars(introBars - 1)}>1</Button>
                          <Button variant="default" size="sm" leftSection={<IconPlus size={12} />} onClick={() => setIntroBars(introBars + 1)}>1</Button>
                          <Button variant="default" size="sm" leftSection={<IconPlus size={12} />} onClick={() => setIntroBars(introBars + 4)}>4</Button>
                        </Button.Group>
                        <Button
                          size="sm" variant="light" color="brand"
                          leftSection={<IconTargetArrow size={14} />}
                          disabled={snap.bar < 0}
                          onClick={() => setIntroBars(Math.max(0, snap.bar))}
                        >
                          Ustaw na bieżącym takcie
                        </Button>
                        <Button size="sm" variant="subtle" color="gray" onClick={() => setIntroBars(0)}>Bez intro</Button>
                      </Group>
                    </Group>
                  </Paper>

                  <Text size="xs" c="dimmed">
                    {track.source === 'manifest'
                      ? 'Ten podkład jest zdefiniowany w tracks.json — zmiany obowiązują tylko do odświeżenia strony, potem wracają wartości z pliku.'
                      : 'Zmiany zapisują się przy tym podkładzie i przetrwają odświeżenie.'}
                  </Text>
                </Stack>
              </Collapse>
            </Box>
          </Stack>
        )}
      </Section>

    </Stack>
  );
}

function IntroStrip({
  introBars, currentBar, barPhase,
}: { introBars: number; currentBar: number; barPhase: number }) {
  const shown = Math.max(12, introBars + 6);
  return (
    <Box className="rymy-hscroll">
      <Group gap={4} wrap="nowrap" style={{ minWidth: 'min-content' }}>
        {Array.from({ length: shown }, (_, i) => {
          const isIntro = i < introBars;
          const isFirstWordBar = i === introBars;
          const isCurrent = i === currentBar;
          return (
            <Box
              key={i}
              style={{
                position: 'relative',
                minWidth: 58,
                padding: '8px 6px',
                borderRadius: 6,
                textAlign: 'center',
                border: `1px solid ${
                  isCurrent ? 'var(--mantine-color-brand-5)'
                    : isFirstWordBar ? 'var(--mantine-color-brand-7)'
                    : 'var(--mantine-color-dark-5)'
                }`,
                background: isIntro
                  ? 'rgba(26, 128, 224, 0.12)'
                  : 'rgba(243, 184, 29, 0.12)',
                transition: 'all 180ms ease',
              }}
            >
              <Text size="10px" c="dimmed">{i + 1}</Text>
              <Text size="11px" fw={isFirstWordBar ? 700 : 400} c={isIntro ? 'accent.3' : 'brand.3'}>
                {isIntro ? 'intro' : isFirstWordBar ? 'start' : 'słowa'}
              </Text>
              {isCurrent && (
                <Box style={{
                  position: 'absolute', left: 0, bottom: 0, height: 2,
                  width: `${Math.min(100, Math.max(0, barPhase * 100))}%`,
                  background: 'var(--mantine-color-brand-4)',
                }} />
              )}
            </Box>
          );
        })}
      </Group>
    </Box>
  );
}
