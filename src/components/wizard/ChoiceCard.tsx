import type { ReactNode } from 'react';
import { Box, Group, Paper, Text, UnstyledButton } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  children?: ReactNode;
};

/** Big either/or card — used wherever the wizard asks the user to pick a path. */
export function ChoiceCard({ icon, title, description, selected, onSelect, children }: Props) {
  return (
    <Paper
      withBorder p="md" radius="md"
      className="rymy-clickable"
      style={{
        borderColor: selected ? 'var(--mantine-color-brand-6)' : undefined,
        background: selected ? 'rgba(243, 184, 29, 0.09)' : undefined,
        height: '100%',
      }}
    >
      <UnstyledButton onClick={onSelect} style={{ display: 'block', width: '100%' }}>
        <Group gap="sm" wrap="nowrap" align="start">
          <Box
            w={38} h={38}
            style={{
              flexShrink: 0,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              background: selected ? 'var(--mantine-color-brand-5)' : 'var(--mantine-color-dark-6)',
              color: selected ? 'var(--mantine-color-dark-9)' : 'var(--mantine-color-dimmed)',
              transition: 'all 160ms ease',
            }}
          >
            {icon}
          </Box>
          <Box style={{ flex: 1 }}>
            <Group gap={6}>
              <Text fw={700}>{title}</Text>
              {selected && <IconCheck size={14} color="var(--mantine-color-brand-4)" />}
            </Group>
            <Text size="xs" c="dimmed" mt={2}>{description}</Text>
          </Box>
        </Group>
      </UnstyledButton>
      {selected && children && <Box mt="md">{children}</Box>}
    </Paper>
  );
}
