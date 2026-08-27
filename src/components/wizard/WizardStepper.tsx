import { Fragment } from 'react';
import { Box, Group, Paper, Stack, Text, UnstyledButton } from '@mantine/core';
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

type DotProps = {
  index: number;
  done: boolean;
  isCurrent: boolean;
  size: number;
};

function StepDot({ index, done, isCurrent, size }: DotProps) {
  return (
    <Box
      w={size}
      h={size}
      style={{
        flexShrink: 0,
        borderRadius: '50%',
        display: 'grid',
        placeItems: 'center',
        fontSize: size >= 30 ? 13 : 12,
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
      {done ? <IconCheck size={16} /> : index + 1}
    </Box>
  );
}

export function WizardStepper({ steps, current, onSelect }: Props) {
  const active = steps[current];

  return (
    <Paper withBorder p="sm" radius="md">
      {/* Mobile: numbered dots only — labels never fit four steps across 390px.
          The active step's label and hint go underneath, where they can wrap. */}
      <Stack gap={8} hiddenFrom="sm">
        <Group gap={0} wrap="nowrap" justify="center">
          {steps.map((s, i) => {
            const isCurrent = i === current;
            const done = s.complete && !isCurrent;
            const enabled = isReachable(steps, i, current) && !isCurrent;

            return (
              <Fragment key={s.id}>
                {i > 0 && (
                  <Box
                    style={{
                      flex: 1,
                      minWidth: 12,
                      maxWidth: 48,
                      height: 2,
                      margin: '0 6px',
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
                  aria-label={`Krok ${i + 1}: ${s.label}`}
                  aria-current={isCurrent ? 'step' : undefined}
                  disabled={!enabled}
                  style={{
                    // 44px touch target around a 32px dot.
                    display: 'grid',
                    placeItems: 'center',
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: '50%',
                    cursor: enabled ? 'pointer' : 'default',
                    opacity: !isCurrent && !s.complete && !enabled ? 0.45 : 1,
                    transition: 'opacity 200ms ease',
                  }}
                >
                  <StepDot index={i} done={done} isCurrent={isCurrent} size={32} />
                </UnstyledButton>
              </Fragment>
            );
          })}
        </Group>
        {active && (
          <Box ta="center">
            <Text size="sm" fw={700}>{active.label}</Text>
            <Text size="xs" c={active.hint ? 'brand.4' : 'dimmed'}>{active.hint ?? '—'}</Text>
          </Box>
        )}
      </Stack>

      {/* Tablet and up: the full labelled stepper. */}
      <Group gap={0} wrap="nowrap" visibleFrom="sm">
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
                  <StepDot index={i} done={done} isCurrent={isCurrent} size={30} />
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
