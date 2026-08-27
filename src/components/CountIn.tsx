import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Text } from '@mantine/core';
import { playClick } from '@/audio/click';
import { fmtBpm } from '@/lib/format';

type Props = {
  /** how many beats to count in */
  beats: number;
  bpm: number;
  label?: string;
  onDone: () => void;
};

/**
 * Full-screen musical count-in. Clicks on every beat (accented first) so the
 * user locks into the tempo before the track drops.
 */
export function CountIn({ beats, bpm, label = 'Przygotuj się', onDone }: Props) {
  const [left, setLeft] = useState(beats);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const beatMs = 60000 / Math.max(30, bpm);
    let n = beats;
    playClick({ accent: true, volume: 0.6 });
    const id = window.setInterval(() => {
      n -= 1;
      if (n <= 0) {
        window.clearInterval(id);
        doneRef.current();
        return;
      }
      setLeft(n);
      playClick({ accent: false, volume: 0.6 });
    }, beatMs);
    return () => window.clearInterval(id);
  }, [beats, bpm]);

  return (
    <Box
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(10, 8, 3, 0.85)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Stack align="center" gap="xs">
        <Text size="sm" tt="uppercase" lts={2} c="dimmed">{label}</Text>
        <Text
          key={left}
          className="rymy-pop"
          c="brand.3"
          style={{ fontSize: 168, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em' }}
        >
          {left}
        </Text>
        <Text size="sm" c="dimmed">{fmtBpm(bpm)} BPM</Text>
      </Stack>
    </Box>
  );
}
