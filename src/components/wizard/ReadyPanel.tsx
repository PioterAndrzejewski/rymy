import type { ReactNode } from 'react';
import { Box, Paper, SimpleGrid, Stack, Text } from '@mantine/core';

export type SummaryItem = { label: string; value: ReactNode };

type Props = {
  items: SummaryItem[];
  headline?: string;
  note?: ReactNode;
  children?: ReactNode;
};

/** Last wizard screen: everything at a glance before the exercise starts. */
export function ReadyPanel({ items, headline, note, children }: Props) {
  return (
    <Paper withBorder p="xl" radius="md" className="rymy-fade-up">
      <Stack gap="lg">
        {headline && (
          <Text size="28px" fw={800} lts="-0.02em" ta="center">{headline}</Text>
        )}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
          {items.map((it) => (
            <Box key={it.label} style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid var(--mantine-color-dark-5)',
            }}>
              <Text size="10px" tt="uppercase" lts={0.8} c="dimmed">{it.label}</Text>
              <Text size="lg" fw={600} lineClamp={1}>{it.value}</Text>
            </Box>
          ))}
        </SimpleGrid>
        {children}
        {note && <Text size="sm" c="dimmed" ta="center">{note}</Text>}
      </Stack>
    </Paper>
  );
}
