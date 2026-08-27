import { Fragment } from 'react';
import { Box, Group, Paper, Text, UnstyledButton } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

export type StepDef = {
  id: string;
  label: string;
  /** short summary of what the user picked — shown under the label */
  hint?: string;
  /** step has everything it needs; gates forward navigation past it */
  complete: boolean;
};

type Props = {
  steps: StepDef[];
  current: number;
  onSelect: (index: number) => void;
};

// A step is reachable if it's behind us, or every step before it is done.
export function isReachable(steps: StepDef[], index: number, current: number): boolean {
  return index <= current || steps.slice(0, index).every((s) => s.complete);
}

export function WizardStepper({ steps, current, onSelect }: Props) {
  return (
    <Paper withBorder p="sm" radius="md">
      <Group gap={0} wrap="nowrap" style={{ overflowX: 'auto' }}>
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const done = s.complete && !isCurrent;
          const enabled = isReachable(steps, i, current) && !isCurrent;
          const dim = !isCurrent && !s.complete && !enabled;

          return (
            <Fragment key={s.id}>
              {i > 0 && (
                <Box
                  style={{
                    flex: 1,
                    minWidth: 20,
                    height: 2,
                    margin: '0 10px',
                    borderRadius: 2,
                    background: steps[i - 1].complete
                      ? 'var(--mantine-color-accent-7)'
                      : 'var(--mantine-color-dark-4)',
                    transition: 'background 200ms ease',
                  }}
                />
              )}
              <UnstyledButton
                onClick={() => enabled && onSelect(i)}
                aria-current={isCurrent ? 'step' : undefined}
                style={{
                  cursor: enabled ? 'pointer' : 'default',
                  opacity: dim ? 0.45 : 1,
                  padding: '2px 4px',
                  borderRadius: 8,
                  transition: 'opacity 200ms ease',
                }}
              >
                <Group gap={10} wrap="nowrap">
                  <Box
                    w={30}
                    h={30}
                    style={{
                      flexShrink: 0,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: isCurrent
                        ? 'var(--mantine-color-dark-9)'
                        : done
                        ? '#fff'
                        : 'var(--mantine-color-dimmed)',
                      background: done
                        ? 'var(--mantine-color-accent-7)'
                        : isCurrent
                        ? 'var(--mantine-color-brand-5)'
                        : 'transparent',
                      border: `1px solid ${
                        isCurrent
                          ? 'var(--mantine-color-brand-4)'
                          : done
                          ? 'var(--mantine-color-accent-5)'
                          : 'var(--mantine-color-dark-4)'
                      }`,
                      boxShadow: isCurrent ? '0 0 0 4px rgba(243, 184, 29, 0.18)' : undefined,
                      transition: 'all 200ms ease',
                    }}
                  >
                    {done ? <IconCheck size={16} /> : i + 1}
                  </Box>
                  <Box style={{ whiteSpace: 'nowrap' }}>
                    <Text size="sm" fw={isCurrent ? 700 : 500} c={isCurrent ? undefined : 'dimmed'}>
                      {s.label}
                    </Text>
                    <Text size="10px" c={s.hint ? 'brand.4' : 'dimmed'} lineClamp={1}>
                      {s.hint ?? '—'}
                    </Text>
                  </Box>
                </Group>
              </UnstyledButton>
            </Fragment>
          );
        })}
      </Group>
    </Paper>
  );
}
