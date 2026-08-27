import { useState } from 'react';
import {
  Paper, Stack, Group, Title, FileInput, TextInput, NumberInput, Button,
} from '@mantine/core';
import { IconUpload, IconPlus } from '@tabler/icons-react';
import { addUserTrack } from '@/storage/userTracks';
import { useLibrary } from '@/state/library';
import { notifications } from '@mantine/notifications';

export function AddTrackForm() {
  const refresh = useLibrary((s) => s.refresh);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [bpm, setBpm] = useState(90);
  const [offset, setOffset] = useState(0);
  const [introBars, setIntroBars] = useState(0);
  const [style, setStyle] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!file) return;
    setBusy(true);
    try {
      const id = `user-${Date.now()}`;
      await addUserTrack({
        id,
        name: name || file.name.replace(/\.[^.]+$/, ''),
        bpm,
        timeSignature: [4, 4],
        downbeatOffsetMs: offset,
        introBars,
        style: style || undefined,
        blob: file,
        mime: file.type || 'audio/mpeg',
        createdAt: Date.now(),
      });
      await refresh();
      notifications.show({ color: 'brand', title: 'Dodano podkład', message: name || file.name });
      setFile(null); setName(''); setStyle(''); setOffset(0); setIntroBars(0);
    } catch (e) {
      notifications.show({ color: 'red', title: 'Błąd', message: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper withBorder p="md">
      <Stack gap="md">
        <Title order={5}>Dodaj podkład (do IndexedDB)</Title>
        <Group grow align="end">
          <FileInput
            label="Plik audio"
            accept="audio/*"
            value={file}
            onChange={setFile}
            placeholder="mp3, wav, ogg..."
            leftSection={<IconUpload size={16} />}
          />
          <TextInput
            label="Nazwa"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="(z nazwy pliku)"
          />
          <NumberInput
            label="BPM"
            description="Można ułamkowo, np. 69.7"
            value={bpm} min={30} max={300} step={0.1} decimalScale={1}
            onChange={(v) => setBpm(Number(v))}
          />
        </Group>
        <Group grow align="end">
          <NumberInput
            label="Offset downbeat (ms)"
            value={offset}
            onChange={(v) => setOffset(Number(v))}
          />
          <NumberInput
            label="Takty intro"
            description="ile taktów na starcie bez słów"
            value={introBars} min={0} max={64}
            onChange={(v) => setIntroBars(Number(v))}
          />
          <TextInput
            label="Styl"
            value={style}
            onChange={(e) => setStyle(e.currentTarget.value)}
            placeholder="boom bap, trap, rock..."
          />
          <Button
            leftSection={<IconPlus size={16} />}
            disabled={!file || busy}
            loading={busy}
            onClick={submit}
          >
            Dodaj
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}
