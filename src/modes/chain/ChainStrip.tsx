import { useEffect, useRef } from 'react';
import { Badge, Box, Group, Paper, Text, Tooltip } from '@mantine/core';
import { IconArrowNarrowRight, IconRobot, IconTrophy } from '@tabler/icons-react';
import type { ChainLink } from '@/storage/chainProgress';
import type { RhymeQuality } from '@/wordbank/pl/phonetics';
import { linkWord } from './config';

type Props = {
  seed: string;
  links: ChainLink[];
  /** ile ogniw ma twój rekord na tym poziomie — kreska na torze */
  record: number;
  /** aktualna seria ogniw z rymem na wymaganym poziomie */
  combo: number;
};

/** Kropki zamiast liczby: jakość rymu widać kątem oka, bez czytania. */
export function QualityDots({ q, cheap }: { q: RhymeQuality; cheap?: boolean }) {
  return (
    <Group gap={2} wrap="nowrap">
      {[1, 2, 3].map((n) => (
        <Box
          key={n}
          w={5}
          h={5}
          style={{
            borderRadius: '50%',
            background: n <= q
              ? cheap ? 'var(--mantine-color-gray-6)' : 'var(--mantine-color-brand-4)'
              : 'var(--mantine-color-dark-4)',
          }}
        />
      ))}
    </Group>
  );
}

/**
 * Taśma łańcucha.
 *
 * To jest licznik tego trybu — tylko zamiast rosnącej liczby widzisz drogę,
 * którą przeszedłeś, i kreskę tam, gdzie stanąłeś poprzednio.
 */
export function ChainStrip({ seed, links, record, combo }: Props) {
  const scroller = useRef<HTMLDivElement>(null);

  // Nowe ogniwo ma być widoczne bez przewijania — taśma dojeżdża sama.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
  }, [links.length]);

  const hot = combo >= 3;

  return (
    <Paper
      withBorder
      p="sm"
      radius="md"
      style={{
        borderColor: hot ? 'var(--mantine-color-brand-6)' : undefined,
        background: hot ? 'rgba(243, 184, 29, 0.05)' : undefined,
        transition: 'border-color 240ms ease, background 240ms ease',
      }}
    >
      <Group justify="space-between" mb={6} gap="xs">
        <Text size="10px" tt="uppercase" lts={1} c="dimmed">łańcuch</Text>
        <Group gap="xs">
          {combo >= 2 && (
            <Badge size="sm" variant="light" color="brand">seria {combo}</Badge>
          )}
          <Text size="10px" c="dimmed">
            {links.length} {linkWord(links.length)}
            {record > 0 && ` · rekord ${record}`}
          </Text>
        </Group>
      </Group>

      <Box ref={scroller} className="rymy-hscroll">
        <Group gap={6} wrap="nowrap" align="center" style={{ minHeight: 34 }}>
          <Badge size="lg" variant="outline" color="gray" style={{ flexShrink: 0 }}>
            {seed}
          </Badge>
          {links.map((l, i) => (
            <Group key={`${l.assoc}-${i}`} gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
              <IconArrowNarrowRight size={14} opacity={0.5} />
              <Tooltip
                withArrow
                label={l.auto
                  ? 'ogniwo dopisane przez nas'
                  : `${l.signal} · ${(l.ms / 1000).toFixed(1)} s${l.cheap ? ' · tani rym' : ''}`}
              >
                <Paper
                  className="rymy-pop"
                  withBorder
                  px={8}
                  py={3}
                  radius="sm"
                  style={{
                    borderColor: l.auto ? 'var(--mantine-color-dark-4)' : undefined,
                    opacity: l.auto ? 0.6 : 1,
                    background: l.auto ? undefined : 'rgba(255,255,255,0.03)',
                  }}
                >
                  <Group gap={6} wrap="nowrap">
                    {l.auto && <IconRobot size={12} opacity={0.7} />}
                    <Text size="sm" c={l.auto ? 'dimmed' : undefined}>
                      {l.assoc} <Text span c="dimmed">/</Text> <b>{l.rhyme}</b>
                    </Text>
                    <QualityDots q={l.q} cheap={l.cheap} />
                  </Group>
                </Paper>
              </Tooltip>
              {/* kreska rekordu: gonisz własny ślad, nie abstrakcyjny wynik */}
              {record > 0 && i + 1 === record && (
                <Tooltip label={`Twój rekord: ${record} ${linkWord(record)}`} withArrow>
                  <Group gap={2} wrap="nowrap" style={{ flexShrink: 0 }}>
                    <IconTrophy size={12} color="var(--mantine-color-brand-4)" />
                    <Box
                      w={2}
                      h={26}
                      style={{ borderRadius: 2, background: 'var(--mantine-color-brand-5)' }}
                    />
                  </Group>
                </Tooltip>
              )}
            </Group>
          ))}
        </Group>
      </Box>
    </Paper>
  );
}
