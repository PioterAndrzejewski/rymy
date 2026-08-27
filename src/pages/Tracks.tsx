import { useEffect } from 'react';
import {
  Stack, Title, Text, Paper, Table, Badge, Group, ActionIcon, Tooltip, Box, Divider,
} from '@mantine/core';
import { IconTrash, IconCopy } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useLibrary } from '@/state/library';
import { AddTrackForm } from '@/components/AddTrackForm';
import { deleteUserTrack } from '@/storage/userTracks';
import { clearOverride } from '@/storage/trackOverrides';
import type { Track } from '@/types';
import { fmtBpm } from '@/lib/format';

function toManifestSnippet(t: Track): string {
  const entry = {
    id: t.id,
    name: t.name,
    path: `/tracks/${t.name.replace(/\s+/g, '_')}.mp3`,
    bpm: t.bpm,
    timeSignature: t.timeSignature,
    downbeatOffsetMs: t.downbeatOffsetMs,
    ...(t.introBars ? { introBars: t.introBars } : {}),
    ...(t.style ? { style: t.style } : {}),
  };
  return JSON.stringify(entry, null, 2);
}

export default function Tracks() {
  const { tracks, loading, error, refresh } = useLibrary();
  useEffect(() => { void refresh(); }, [refresh]);

  async function remove(id: string) {
    await deleteUserTrack(id);
    clearOverride(id);
    await refresh();
    notifications.show({ color: 'gray', message: 'Usunięto podkład' });
  }

  async function copyManifest(t: Track) {
    const snippet = toManifestSnippet(t);
    await navigator.clipboard.writeText(snippet);
    notifications.show({
      color: 'brand',
      title: 'Skopiowano wpis manifestu',
      message: 'Wklej do public/tracks/tracks.json → tracks[] i wgraj plik audio do public/tracks/.',
    });
  }

  return (
    <Stack gap="lg" my="md">
      <div>
        <Title order={2}>Podkłady</Title>
        <Text c="dimmed" size="sm">
          Manifest (<code>public/tracks/tracks.json</code>) jest źródłem prawdy; uploady trafiają
          do IndexedDB. Dla podkładów user możesz skopiować wpis manifestu, żeby „awansować” je do repo.
        </Text>
      </div>

      <AddTrackForm />

      <Paper withBorder>
        <Group p="sm" justify="space-between" wrap="wrap" gap="xs">
          <Text fw={500}>Biblioteka</Text>
          <Text size="xs" c="dimmed">
            {loading ? 'ładowanie…' : `${tracks.length} podkład(ów)`}
            {error && ` · błąd: ${error}`}
          </Text>
        </Group>
        {tracks.length === 0 ? (
          <Text p="md" size="sm" c="dimmed">
            Brak podkładów. Dodaj plik przez formularz, albo dodaj wpis w <code>tracks.json</code>.
          </Text>
        ) : (
          <>
            {/* Phone: one card per track. A seven-column table is unreadable
                at 390px even inside its own scroller. */}
            <Stack gap={0} hiddenFrom="sm">
              {tracks.map((t) => (
                <Box key={t.id}>
                  <Divider />
                  <Box p="sm">
                    <Group justify="space-between" wrap="nowrap" align="start" gap="xs">
                      <Box style={{ minWidth: 0 }}>
                        <Text fw={600}>{t.name}</Text>
                        <Group gap={6} mt={6} wrap="wrap">
                          <Badge variant="light" color="gray" size="sm">{fmtBpm(t.bpm)} BPM</Badge>
                          <Badge variant="light" color="gray" size="sm">
                            {t.timeSignature[0]}/{t.timeSignature[1]}
                          </Badge>
                          <Badge variant="light" color="gray" size="sm">intro {t.introBars ?? 0}</Badge>
                          <Badge variant="light" color="gray" size="sm">{t.downbeatOffsetMs} ms</Badge>
                          {t.style && <Badge variant="light" color="gray" size="sm">{t.style}</Badge>}
                          <Badge variant="light" color={t.source === 'manifest' ? 'accent' : 'brand'} size="sm">
                            {t.source}
                          </Badge>
                        </Group>
                      </Box>
                      {t.source === 'user' && (
                        <Group gap={4} wrap="nowrap">
                          <ActionIcon
                            variant="subtle" size="lg"
                            aria-label="Skopiuj wpis manifestu"
                            onClick={() => void copyManifest(t)}
                          >
                            <IconCopy size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle" size="lg" color="red"
                            aria-label="Usuń podkład"
                            onClick={() => void remove(t.id)}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      )}
                    </Group>
                  </Box>
                </Box>
              ))}
            </Stack>

            {/* Tablet and up: the full table. */}
            <Box visibleFrom="sm">
              <Table.ScrollContainer minWidth={620} type="native">
                <Table verticalSpacing="xs" highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Nazwa</Table.Th>
                      <Table.Th>BPM</Table.Th>
                      <Table.Th>Metrum</Table.Th>
                      <Table.Th>Offset</Table.Th>
                      <Table.Th>Intro</Table.Th>
                      <Table.Th>Styl</Table.Th>
                      <Table.Th>Źródło</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {tracks.map((t) => (
                      <Table.Tr key={t.id}>
                        <Table.Td style={{ minWidth: 140 }}>{t.name}</Table.Td>
                        <Table.Td>{fmtBpm(t.bpm)}</Table.Td>
                        <Table.Td>{t.timeSignature[0]}/{t.timeSignature[1]}</Table.Td>
                        <Table.Td style={{ whiteSpace: 'nowrap' }}>{t.downbeatOffsetMs} ms</Table.Td>
                        <Table.Td>{t.introBars ?? 0}</Table.Td>
                        <Table.Td>{t.style ?? '—'}</Table.Td>
                        <Table.Td>
                          <Badge variant="light" color={t.source === 'manifest' ? 'accent' : 'brand'}>
                            {t.source}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4} justify="flex-end" wrap="nowrap">
                            {t.source === 'user' && (
                              <Tooltip label="Skopiuj wpis manifestu">
                                <ActionIcon variant="subtle" size="lg" onClick={() => void copyManifest(t)}>
                                  <IconCopy size={16} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                            {t.source === 'user' && (
                              <Tooltip label="Usuń">
                                <ActionIcon variant="subtle" size="lg" color="red" onClick={() => void remove(t.id)}>
                                  <IconTrash size={16} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Box>
          </>
        )}
      </Paper>
    </Stack>
  );
}
