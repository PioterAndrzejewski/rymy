import { Box, Group, Text } from '@mantine/core';

type Props = {
  beatsPerBar: number;
  /** current beat index, -1 when the transport hasn't reached bar 1 */
  beat: number;
  active: boolean;
  size?: number;
};

/** Row of dots, one per beat; the current beat lights up. */
export function BeatPulse({ beatsPerBar, beat, active, size = 14 }: Props) {
  return (
    <Group gap={10} align="center">
      {Array.from({ length: Math.max(1, beatsPerBar) }, (_, i) => {
        const on = active && i === beat;
        const isDownbeat = i === 0;
        return (
          <Box
            key={i}
            w={size}
            h={size}
            style={{
              borderRadius: '50%',
              background: on
                ? isDownbeat
                  ? 'var(--mantine-color-brand-4)'
                  : 'var(--mantine-color-brand-6)'
                : 'var(--mantine-color-dark-4)',
              boxShadow: on ? '0 0 12px rgba(243, 184, 29, 0.7)' : undefined,
              transform: on ? 'scale(1.35)' : 'scale(1)',
              transition: 'transform 90ms ease-out, background 90ms linear, box-shadow 120ms',
            }}
          />
        );
      })}
      <Text size="xs" c="dimmed" ml={4}>
        {active && beat >= 0 ? `${beat + 1} / ${beatsPerBar}` : '—'}
      </Text>
    </Group>
  );
}
