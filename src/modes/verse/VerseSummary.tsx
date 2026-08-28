import { useEffect, useState } from 'react';
import {
  ActionIcon, Box, Button, Group, Paper, Stack, Text,
} from '@mantine/core';
import {
  IconCheck, IconCopy, IconPlayerPauseFilled, IconPlayerPlayFilled,
  IconRefresh, IconX,
} from '@tabler/icons-react';
import type { Track } from '@/types';
import { useLibrary } from '@/state/library';
import { useEngineState } from '@/audio/useTransport';
import { engine } from '@/audio/engineSingleton';
import { resolveTrackSrc } from '@/storage/tracksLibrary';
import { verseWord, type VerseLink } from './config';

type Props = {
  seed: string;
  links: VerseLink[];
  onAgain: () => void;
  onExit: () => void;
};

function hue(i: number): 'brand' | 'teal' {
  return i % 2 === 0 ? 'brand' : 'teal';
}

export function VerseSummary({ seed, links, onAgain, onExit }: Props) {
  const { tracks, refresh } = useLibrary();
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [loadError, setLoadError] = useState('');
  const [copied, setCopied] = useState(false);
  const engineState = useEngineState();

  useEffect(() => { void refresh(); }, [refresh]);

  // Stop audio when leaving this screen
  useEffect(() => () => { engine.pause(); }, []);

  const isPlaying = engineState === 'playing';
  const isLoading = engineState === 'loading';

  async function pickTrack(t: Track) {
    setLoadError('');
    setActiveTrack(t);
    engine.pause();
    try {
      const src = await resolveTrackSrc(t);
      await engine.load(src, src.startsWith('blob:'));
      await engine.play();
    } catch {
      setLoadError('Nie udało się załadować podkładu.');
      setActiveTrack(null);
    }
  }

  const lyricsText = links
    .map((l, i) => `[${i + 1}: ${l.assoc} / ${l.rhyme}]\n${l.verse}`)
    .join('\n\n');

  async function copyLyrics() {
    try { await navigator.clipboard.writeText(lyricsText); } catch { /* ignore */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  }

  const playableTracks = tracks.filter((t) => t.source !== 'none');

  return (
    <Stack gap="md" my="md">
      {/* Header */}
      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" ta="center" className="rymy-fade-up">
        <Text style={{ fontSize: 'clamp(24px, 7vw, 36px)', fontWeight: 800 }} mb={4}>
          🎤 Piosenka gotowa
        </Text>
        <Text c="dimmed" size="sm">
          {links.length} {verseWord(links.length)} · zaczęło się od „{seed}"
        </Text>
        <Group justify="center" mt="md">
          <Button
            size="sm"
            variant="light"
            color="brand"
            leftSection={copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
            onClick={copyLyrics}
          >
            {copied ? 'Skopiowano!' : 'Kopiuj tekst'}
          </Button>
        </Group>
      </Paper>

      {/* Lyrics — all in one block, compact */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }} radius="md">
        <Stack gap="md">
          {links.map((l, i) => (
            <Box key={i}>
              <Group gap={6} mb={4} align="baseline">
                <Text size="10px" tt="uppercase" lts={1} c="dimmed">{i + 1}</Text>
                <Text size="sm" fw={700} c={`${hue(i)}.4`}>{l.assoc}</Text>
                <Text size="sm" c="dimmed">·</Text>
                <Text size="sm" fw={700} c="dimmed">{l.rhyme}</Text>
              </Group>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {l.verse}
              </Text>
            </Box>
          ))}
        </Stack>
      </Paper>

      {/* Music player */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }} radius="md">
        <Text fw={600} mb={4}>🎵 Zaśpiewaj do podkładu</Text>
        <Text size="sm" c="dimmed" mb="md">
          Wybierz podkład i śpiewaj swój tekst na żywo.
        </Text>

        {playableTracks.length === 0 ? (
          <Text size="sm" c="dimmed">
            Brak podkładów — dodaj je w zakładce Podkłady, żeby zaśpiewać na żywo.
          </Text>
        ) : (
          <Group gap="xs" wrap="wrap" mb="md">
            {playableTracks.map((t) => (
              <Button
                key={t.id}
                size="sm"
                variant={activeTrack?.id === t.id ? 'filled' : 'default'}
                color="brand"
                loading={activeTrack?.id === t.id && isLoading}
                onClick={() => void pickTrack(t)}
              >
                {t.name}{t.bpm ? ` · ${t.bpm} BPM` : ''}
              </Button>
            ))}
          </Group>
        )}

        {activeTrack && (
          <Group gap="md" align="center">
            <ActionIcon
              size={48}
              radius="xl"
              variant="filled"
              color="brand"
              onClick={() => engine.toggle()}
              disabled={isLoading}
              aria-label={isPlaying ? 'Pauza' : 'Graj'}
            >
              {isPlaying
                ? <IconPlayerPauseFilled size={22} />
                : <IconPlayerPlayFilled size={22} />}
            </ActionIcon>
            <Box>
              <Text fw={600}>{activeTrack.name}</Text>
              <Text size="xs" c="dimmed">
                {[activeTrack.bpm ? `${activeTrack.bpm} BPM` : '', activeTrack.style]
                  .filter(Boolean).join(' · ')}
              </Text>
            </Box>
          </Group>
        )}

        {loadError && <Text size="sm" c="red.4" mt="sm">{loadError}</Text>}
      </Paper>

      {/* Navigation */}
      <Group justify="center" gap="sm" wrap="wrap">
        <Button
          size="md"
          color="brand"
          leftSection={<IconRefresh size={16} />}
          onClick={onAgain}
        >
          Jeszcze raz
        </Button>
        <Button
          size="md"
          variant="subtle"
          color="gray"
          leftSection={<IconX size={14} />}
          onClick={onExit}
        >
          Wyjdź
        </Button>
      </Group>
    </Stack>
  );
}
