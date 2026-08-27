import type { ReactNode } from 'react';
import { Box, Button, Flex, Group, Paper, Stack, Text } from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconCheck } from '@tabler/icons-react';

type ShellProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** rendered on the right of the header (badges, counters…) */
  aside?: ReactNode;
};

/** One wizard step: a titled panel with the step body inside. */
export function StepShell({ title, description, children, aside }: ShellProps) {
  return (
    <Stack gap="md" className="rymy-fade-up">
      <Group justify="space-between" align="start" wrap="wrap" gap="xs">
        <Box>
          <Text fw={700} size="xl">{title}</Text>
          {description && <Text c="dimmed" size="sm" mt={2}>{description}</Text>}
        </Box>
        {aside}
      </Group>
      {children}
    </Stack>
  );
}

type SectionProps = {
  title: string;
  hint?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  muted?: boolean;
};

/** A block inside a step. Keeps every step visually identical. */
export function Section({ title, hint, aside, children, muted = false }: SectionProps) {
  return (
    <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md" style={{ opacity: muted ? 0.5 : 1, transition: 'opacity 200ms ease' }}>
      <Group justify="space-between" align="start" mb={hint ? 4 : 'sm'} wrap="wrap" gap="xs">
        <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed">{title}</Text>
        {aside}
      </Group>
      {hint && <Text size="xs" c="dimmed" mb="sm">{hint}</Text>}
      {children}
    </Paper>
  );
}

type FooterProps = {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  /** why `next` is disabled — shown next to the button */
  blockedReason?: string;
  /** use the "finish" look (check icon) instead of an arrow */
  finish?: boolean;
};

export function WizardFooter({
  onBack,
  backLabel = 'Wstecz',
  onNext,
  nextLabel = 'Dalej',
  nextDisabled = false,
  blockedReason,
  finish = false,
}: FooterProps) {
  return (
    <Flex
      direction={{ base: 'column-reverse', sm: 'row' }}
      justify="space-between"
      align={{ base: 'stretch', sm: 'center' }}
      gap="xs"
      mt="xs"
    >
      <Button
        variant="subtle"
        color="gray"
        size="md"
        leftSection={<IconArrowLeft size={16} />}
        onClick={onBack}
        disabled={!onBack}
      >
        {backLabel}
      </Button>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        align={{ base: 'stretch', sm: 'center' }}
        gap="sm"
      >
        {nextDisabled && blockedReason && (
          <Text size="xs" c="dimmed" ta={{ base: 'center', sm: 'right' }} maw={{ sm: 280 }}>
            {blockedReason}
          </Text>
        )}
        <Button
          size="md"
          color="brand"
          rightSection={finish ? <IconCheck size={16} /> : <IconArrowRight size={16} />}
          onClick={onNext}
          disabled={nextDisabled || !onNext}
        >
          {nextLabel}
        </Button>
      </Flex>
    </Flex>
  );
}
