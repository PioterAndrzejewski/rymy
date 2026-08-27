import { memo } from 'react';
import { ActionIcon, Group, Paper, Text } from '@mantine/core';
import { IconCheck, IconPlayerPauseFilled, IconPlayerPlayFilled } from '@tabler/icons-react';
import type { Track } from '@/types';

type Props = {
  track: Track;
  selected: boolean;
  playing: boolean;
  onSelect: (t: Track) => void;
  onTogglePreview: (t: Track) => void;
};

export const TrackCard = memo(function TrackCard({
  track, selected, playing, onSelect, onTogglePreview,
}: Props) {
  return (
    <Paper
      withBorder
      p="md"
      radius="md"
      className="rymy-clickable"
      onClick={() => onSelect(track)}
      style={{
        borderColor: selected ? 'var(--mantine-color-brand-6)' : undefined,
        background: selected ? 'rgba(243, 184, 29, 0.09)' : undefined,
      }}
    >
      <Group wrap="nowrap" align="center" gap="sm">
        <ActionIcon
          size={42}
          radius="xl"
          variant={playing ? 'filled' : 'light'}
          color="brand"
          aria-label={playing ? 'Zatrzymaj odsłuch' : 'Odsłuchaj'}
          onClick={(e) => { e.stopPropagation(); onTogglePreview(track); }}
        >
          {playing ? <IconPlayerPauseFilled size={18} /> : <IconPlayerPlayFilled size={18} />}
        </ActionIcon>

        <Group gap={6} wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
          <Text fw={600} lineClamp={1}>{track.name}</Text>
          {selected && <IconCheck size={14} color="var(--mantine-color-brand-4)" />}
        </Group>
      </Group>
    </Paper>
  );
});
