import {
  Badge, Box, Button, Group, Paper, Progress, SimpleGrid, Stack, Table, Text, Tooltip,
} from '@mantine/core';
import {
  IconArrowNarrowRight, IconArrowUp, IconDice5, IconRefresh, IconRobot, IconSettings,
  IconThumbDown, IconTrophy,
} from '@tabler/icons-react';
import type { ChainBest, ChainLink, ChainProgress, ChainScores } from '@/storage/chainProgress';
import { QUALITY_LABEL } from '@/wordbank/pl/phonetics';
import { QualityDots } from './ChainStrip';
import { BAR_HINT, BAR_LABEL, PASS_BAR, PASS_TOTAL, pathSentence, verdict, type ChainReport } from './score';
import { categoryLabel, categoriesOf } from './words';
import { CHAIN_LEVELS, isFree, linkWord, type ChainLevel } from './config';

type Props = {
  def: ChainLevel;
  seed: string;
  links: ChainLink[];
  report: ChainReport;
  /** rekord poziomu sprzed tej rundy */
  recordBefore?: ChainBest;
  progress: ChainProgress | null;
  onAgain: () => void;
  onSameStart: () => void;
  onLevel: (level: number) => void;
  onExit: () => void;
};

const BAR_KEYS = ['length', 'tempo', 'quality', 'spread'] as const;

function Bar({ name, value }: { name: (typeof BAR_KEYS)[number]; value: number }) {
  const weak = value < PASS_BAR;
  return (
    <Box>
      <Group justify="space-between" gap="xs" mb={4}>
        <Text size="sm" fw={600}>{BAR_LABEL[name]}</Text>
        <Text size="sm" fw={700} c={weak ? 'red.4' : 'brand.3'}>{value}</Text>
      </Group>
      <Progress value={value} color={weak ? 'red' : 'brand'} size="md" />
      <Text size="10px" c="dimmed" mt={4}>{BAR_HINT[name]}</Text>
    </Box>
  );
}

/**
 * Puenta całej rundy.
 *
 * Otwiera ją jedno zdanie o przebytej drodze — to jest moment, dla którego się
 * wraca, i jedyny ekran w tym trybie wart zrzutu. Werdykt jest zdaniem, nie
 * fanfarą; konfetti nie mamy z premedytacją.
 */
export function ChainSummary({
  def, seed, links, report, recordBefore, progress, onAgain, onSameStart, onLevel, onExit,
}: Props) {
  const { scores } = report;
  const free = isFree(def.level);
  const auto = links.filter((l) => l.auto).length;
  const weak = links.filter((l) => l.weak).length;
  const nextLevel = CHAIN_LEVELS.find((l) => l.level > def.level)?.level;
  const beatRecord = report.own.length > (recordBefore?.links ?? 0);

  return (
    <Stack gap="md" my="md" className="rymy-fade-up">
      <Paper withBorder p={{ base: 'md', sm: 'xl' }} radius="md" ta="center">
        <Stack gap="md" align="center">
          <Text style={{ fontSize: 'clamp(20px, 5.5vw, 28px)', fontWeight: 800, lineHeight: 1.25 }} maw={640}>
            {pathSentence(seed, links)}
          </Text>
          <Text c="dimmed" size="sm">{verdict(report, links, def)}</Text>

          {!free && (
            <>
              <Text style={{ fontSize: 'clamp(52px, 15vw, 68px)', fontWeight: 800 }} c={report.passed ? 'brand.3' : undefined}>
                {scores.total}
              </Text>
              <Text size="sm" c="dimmed" mt={-14}>
                {report.passed
                  ? `poziom ${def.level} zaliczony`
                  : `do zaliczenia trzeba ${PASS_TOTAL} i żadnego paska poniżej ${PASS_BAR}`}
              </Text>
            </>
          )}

          <Group gap="xs" justify="center">
            <Badge size="lg" variant="light" color="gray">
              {report.own.length} / {links.length} {linkWord(links.length)} twoje
            </Badge>
            {report.medianMs > 0 && (
              <Badge size="lg" variant="light" color="gray">
                {(report.medianMs / 1000).toFixed(1)} s na ogniwo
              </Badge>
            )}
            {report.combo >= 3 && (
              <Badge size="lg" variant="light" color="brand">seria {report.combo}</Badge>
            )}
            {auto > 0 && (
              <Badge size="lg" variant="light" color="gray" leftSection={<IconRobot size={12} />}>
                {auto} od nas
              </Badge>
            )}
            {weak > 0 && (
              <Badge size="lg" variant="light" color="gray" leftSection={<IconThumbDown size={12} />}>
                {weak} skreślone przez ciebie
              </Badge>
            )}
            {beatRecord && (
              <Badge size="lg" variant="filled" color="brand" leftSection={<IconTrophy size={12} />}>
                {recordBefore?.links ? 'nowy rekord długości' : 'pierwszy przebieg'}
              </Badge>
            )}
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="md">
          Cztery paski
        </Text>
        <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
          {BAR_KEYS.map((k) => <Bar key={k} name={k} value={scores[k as keyof ChainScores]} />)}
        </SimpleGrid>
        {recordBefore && !free && (
          <Text size="xs" c="dimmed" mt="md">
            Rekord poziomu {def.level}: {recordBefore.total} punktów, {recordBefore.links}{' '}
            {linkWord(recordBefore.links)}
            {recordBefore.msPerLink > 0 && `, ${(recordBefore.msPerLink / 1000).toFixed(1)} s na ogniwo`}.
          </Text>
        )}
      </Paper>

      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Text size="sm" fw={600} tt="uppercase" lts={0.6} c="dimmed" mb="sm">Ogniwo po ogniwie</Text>
        <Box className="rymy-hscroll">
          <Table verticalSpacing={6} horizontalSpacing="sm" striped="even" style={{ minWidth: 560 }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={28}>#</Table.Th>
                <Table.Th>droga</Table.Th>
                <Table.Th>rym</Table.Th>
                <Table.Th>sygnał</Table.Th>
                <Table.Th ta="right">czas</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {links.map((l, i) => (
                <Table.Tr key={`${l.assoc}-${i}`} style={{ opacity: l.auto ? 0.55 : 1 }}>
                  <Table.Td c="dimmed">{i + 1}</Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="nowrap">
                      <Text size="sm" c="dimmed">{l.from}</Text>
                      <IconArrowNarrowRight size={12} opacity={0.5} />
                      <Text size="sm" td={l.weak ? 'line-through' : undefined}>{l.assoc}</Text>
                      <IconArrowNarrowRight size={12} opacity={0.5} />
                      <Text size="sm" fw={700}>{l.rhyme}</Text>
                      {l.auto && (
                        <Tooltip label="dopisane przez nas" withArrow>
                          <IconRobot size={13} />
                        </Tooltip>
                      )}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} wrap="nowrap">
                      <QualityDots q={l.q} cheap={l.cheap} />
                      <Text size="xs" c="dimmed">
                        {QUALITY_LABEL[l.q]}{l.cheap ? ' · tani' : ''}
                      </Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c={l.signal === 'skok' ? 'brand.4' : 'dimmed'}>{l.signal}</Text>
                  </Table.Td>
                  <Table.Td ta="right">
                    <Text size="xs" c="dimmed" ff="monospace">{(l.ms / 1000).toFixed(1)} s</Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>
        {report.categories.length > 0 && (
          <Group gap={6} wrap="wrap" mt="sm">
            <Text size="xs" c="dimmed">przeszedłeś przez:</Text>
            {report.categories.map((c) => (
              <Badge key={c} size="sm" variant="light" color="gray">{categoryLabel(c)}</Badge>
            ))}
          </Group>
        )}
        {progress && (
          <Text size="xs" c="dimmed" mt="sm">
            Zapisane: {Object.keys(progress.pairs).length} słów w twoim słowniku skojarzeń.
            Ostatnie ogniwo wyszło z „{links.at(-1)?.from ?? seed}"
            {categoriesOf(links.at(-1)?.rhyme ?? seed).length > 0
              ? ` i wylądowało w kategorii ${categoryLabel(categoriesOf(links.at(-1)?.rhyme ?? seed)[0])}.`
              : '.'}
          </Text>
        )}
      </Paper>

      <Group justify="center" gap="xs" wrap="wrap">
        <Button color="brand" leftSection={<IconRefresh size={16} />} onClick={onAgain}>
          Jeszcze raz
        </Button>
        <Button variant="light" color="brand" leftSection={<IconDice5 size={16} />} onClick={onSameStart}>
          To samo słowo startowe
        </Button>
        {report.passed && nextLevel && (
          <Button variant="light" color="accent" leftSection={<IconArrowUp size={16} />} onClick={() => onLevel(nextLevel)}>
            Poziom wyżej
          </Button>
        )}
        <Button variant="subtle" color="gray" leftSection={<IconSettings size={16} />} onClick={onExit}>
          Zmień ustawienia
        </Button>
      </Group>
    </Stack>
  );
}
