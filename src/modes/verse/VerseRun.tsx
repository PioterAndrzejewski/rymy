import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Group, Paper, Stack, Text, TextInput, Tooltip,
} from '@mantine/core';
import { IconArrowLeft, IconX } from '@tabler/icons-react';
import { rhymeQuality } from '@/wordbank/pl/phonetics';
import { pickStartWord } from '@/modes/chain/words';
import type { VerseConfig, VerseLink } from './config';

type Slot = 'assoc' | 'rhyme' | 'verse';

type Props = {
  config: VerseConfig;
  onDone: (links: VerseLink[]) => void;
  onExit: () => void;
};

const TAIL = 2;
const wordStyle = { fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 700, lineHeight: 1.2 } as const;

function hue(pair: number): string {
  return pair % 2 === 0 ? 'var(--mantine-color-brand-4)' : 'var(--mantine-color-teal-4)';
}

function WordRow({
  filler, main, pair, opacity,
}: {
  filler: React.ReactNode;
  main: React.ReactNode;
  pair: number;
  opacity: number;
}) {
  return (
    <Group gap="sm" wrap="nowrap" align="center" style={{ opacity, transition: 'opacity 240ms ease' }}>
      <Box style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>{filler}</Box>
      <Box w={1} h={22} style={{ background: 'var(--mantine-color-dark-4)', flexShrink: 0, borderRadius: 1 }} />
      <Box style={{ flex: 1, minWidth: 0 }}>{main}</Box>
      <Box w={34} style={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        {pair >= 0 && (
          <Box w={6} h={6} style={{ borderRadius: '50%', background: hue(pair) }} />
        )}
      </Box>
    </Group>
  );
}

export function VerseRun({ config, onDone, onExit }: Props) {
  const [seed] = useState<string>(() =>
    config.start === 'own' && config.startWord.trim()
      ? config.startWord.trim().toLowerCase()
      : pickStartWord(''),
  );

  const [links, setLinks] = useState<VerseLink[]>([]);
  const [slot, setSlot] = useState<Slot>('assoc');

  // Raw inputs while the user is typing
  const [assocInput, setAssocInput] = useState('');
  const [rhymeInput, setRhymeInput] = useState('');
  const [verseInput, setVerseInput] = useState('');

  // Confirmed words for the current link
  const [cAssoc, setCAssoc] = useState('');
  const [cRhyme, setCRhyme] = useState('');

  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const assocRef = useRef<HTMLInputElement>(null);
  const rhymeRef = useRef<HTMLInputElement>(null);
  const verseRef = useRef<HTMLInputElement>(null);

  const from = links.length ? links[links.length - 1].assoc : seed;
  const linkIdx = links.length;
  const isLast = linkIdx + 1 >= config.verses;

  const used = useMemo(() => {
    const s = new Set<string>([seed]);
    for (const l of links) { s.add(l.assoc); s.add(l.rhyme); }
    return s;
  }, [seed, links]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (slot === 'assoc') assocRef.current?.focus();
      else if (slot === 'rhyme') rhymeRef.current?.focus();
      else verseRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, [slot, linkIdx]);

  function reject(msg: string) {
    setError(msg);
    setShake(true);
    window.setTimeout(() => setShake(false), 350);
  }

  function submitAssoc() {
    const word = assocInput.trim().toLowerCase();
    if (!word) return;
    if (used.has(word)) { reject('To słowo już było — użyj czegoś nowego.'); return; }
    setCAssoc(word);
    setSlot('rhyme');
    setAssocInput('');
    setError('');
  }

  function submitRhyme() {
    const word = rhymeInput.trim().toLowerCase();
    if (!word) return;
    if (used.has(word)) { reject('To słowo już było.'); return; }
    const { q } = rhymeQuality(cAssoc, word);
    if (q < 1) { reject(`„${word}" nie rymuje się z „${cAssoc}".`); return; }
    setCRhyme(word);
    setSlot('verse');
    setRhymeInput('');
    setError('');
  }

  function submitVerse() {
    const text = verseInput.trim();
    if (!text) { reject('Napisz coś przed przejściem dalej.'); return; }
    const newLink: VerseLink = { from, assoc: cAssoc, rhyme: cRhyme, verse: text };
    const newLinks = [...links, newLink];
    setLinks(newLinks);
    if (newLinks.length >= config.verses) {
      onDone(newLinks);
    } else {
      setCAssoc(''); setCRhyme(''); setVerseInput(''); setError(''); setSlot('assoc');
    }
  }

  function submit() {
    if (slot === 'assoc') submitAssoc();
    else if (slot === 'rhyme') submitRhyme();
    else submitVerse();
  }

  function goBack() {
    if (slot === 'rhyme') {
      setAssocInput(cAssoc); setCAssoc(''); setSlot('assoc'); setError('');
    } else if (slot === 'verse') {
      setRhymeInput(cRhyme); setCRhyme(''); setSlot('rhyme'); setError('');
    }
  }

  const tail = links.slice(-TAIL);
  const tailOffset = links.length - tail.length;

  const assocField = (
    <div className={shake && slot === 'assoc' ? 'rymy-shake' : ''} style={{ minWidth: 0 }}>
      <TextInput
        ref={assocRef}
        size="md"
        variant="filled"
        placeholder={`skojarz z „${from}"`}
        value={assocInput}
        onChange={(e) => { setAssocInput(e.currentTarget.value); if (error) setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') submitAssoc(); }}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        error={slot === 'assoc' ? error || undefined : undefined}
        styles={{ input: { fontSize: 20, fontWeight: 700 } }}
      />
    </div>
  );

  const rhymeField = (
    <div className={shake && slot === 'rhyme' ? 'rymy-shake' : ''} style={{ minWidth: 0 }}>
      <TextInput
        ref={rhymeRef}
        size="md"
        variant="filled"
        placeholder={cAssoc ? `rym do „${cAssoc}"` : 'rym…'}
        value={rhymeInput}
        onChange={(e) => { setRhymeInput(e.currentTarget.value); if (error) setError(''); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submitRhyme();
          if (e.key === 'Backspace' && !rhymeInput) goBack();
        }}
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        error={slot === 'rhyme' ? error || undefined : undefined}
        styles={{ input: { fontSize: 20, fontWeight: 700, textAlign: 'right' } }}
      />
    </div>
  );

  return (
    <Stack gap="md" my="md">
      {/* Header bar */}
      <Paper withBorder p={{ base: 'sm', sm: 'md' }} radius="md">
        <Group justify="space-between">
          <Box>
            <Text size="10px" tt="uppercase" lts={1} c="dimmed">zwrotka</Text>
            <Text size="20px" fw={800} ff="monospace">{linkIdx + 1} / {config.verses}</Text>
          </Box>
          <Button
            size="sm" variant="subtle" color="gray"
            leftSection={<IconX size={14} />}
            onClick={onExit}
          >
            Zakończ
          </Button>
        </Group>
      </Paper>

      {/* Word-pair + verse panel */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }} radius="md">
        {/* Phase hint */}
        <Box mb="sm">
          <Text size="xs" c="dimmed" tt="uppercase" lts={1}>
            {slot === 'assoc'
              ? 'skojarz ze słowem głównym'
              : slot === 'rhyme'
                ? 'domknij rym'
                : 'napisz zwrotkę'}
          </Text>
          <Text size="sm" c="dimmed">
            {slot === 'assoc'
              ? <>Co ci przychodzi z „<Text span c="brand.3" fw={700}>{from}</Text>"?</>
              : slot === 'rhyme'
                ? <>Teraz rym do „<Text span c="brand.3" fw={700}>{cAssoc}</Text>".</>
                : (
                  <>
                    Napisz zwrotkę z „<Text span c="brand.3" fw={700}>{cAssoc}</Text>
                    {'" i „'}
                    <Text span c="teal.4" fw={700}>{cRhyme}</Text>".
                  </>
                )}
          </Text>
        </Box>

        {/* Column labels */}
        <Group gap="sm" wrap="nowrap" mb={6} px={2}>
          <Text size="10px" tt="uppercase" lts={1} c="dimmed" style={{ flex: 1, textAlign: 'right' }}>rym</Text>
          <Box w={1} style={{ flexShrink: 0 }} />
          <Text size="10px" tt="uppercase" lts={1} c="dimmed" style={{ flex: 1 }}>słowo główne</Text>
          <Box w={34} style={{ flexShrink: 0 }} />
        </Group>

        <Stack gap={6}>
          {/* Seed row (visible only on the first link) */}
          {linkIdx === 0 && (
            <WordRow
              pair={-1}
              opacity={0.3}
              filler={<Text size="xs" c="dimmed" ta="right">start</Text>}
              main={<Text style={wordStyle} truncate>{seed}</Text>}
            />
          )}

          {/* Fading history from completed links */}
          {tail.map((l, i) => {
            const idx = tailOffset + i;
            const opacity = 0.28 + 0.22 * i;
            return (
              <Box key={`${l.assoc}-${idx}`} style={{ opacity, transition: 'opacity 240ms ease' }}>
                <WordRow
                  pair={idx}
                  opacity={1}
                  filler={<Text style={wordStyle} c={hue(idx)} truncate>{l.rhyme}</Text>}
                  main={<Text style={wordStyle} c="dimmed" truncate>{l.assoc}</Text>}
                />
                <Text
                  size="xs"
                  c="dimmed"
                  lineClamp={1}
                  mt={2}
                  pl={4}
                  style={{ fontStyle: 'italic' }}
                >
                  {l.verse}
                </Text>
              </Box>
            );
          })}

          {/* Active link row */}
          <Box className="rymy-fade-up">
            <WordRow
              pair={linkIdx}
              opacity={1}
              filler={
                slot === 'rhyme'
                  ? rhymeField
                  : slot === 'verse'
                    ? <Text style={wordStyle} c={hue(linkIdx)} truncate>{cRhyme}</Text>
                    : <Text style={wordStyle} c="dimmed" opacity={0.35}>rym do skojarzenia…</Text>
              }
              main={
                slot === 'assoc'
                  ? assocField
                  : (
                    <Tooltip label="Kliknij, żeby wrócić" withArrow>
                      <Text
                        style={{ ...wordStyle, cursor: 'pointer' }}
                        c={hue(linkIdx)}
                        onClick={goBack}
                        truncate
                      >
                        {cAssoc}
                      </Text>
                    </Tooltip>
                  )
              }
            />
          </Box>
        </Stack>

        {/* Verse input — slides in after both words are confirmed */}
        {slot === 'verse' && (
          <Box mt="md" className="rymy-fade-up">
            <TextInput
              ref={verseRef}
              placeholder="Wpisz całą zwrotkę…"
              value={verseInput}
              onChange={(e) => { setVerseInput(e.currentTarget.value); if (error) setError(''); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitVerse();
                if (e.key === 'Backspace' && !verseInput) goBack();
              }}
              autoCapitalize="sentences"
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="next"
              error={error || undefined}
              styles={{ input: { fontSize: 16 } }}
            />
          </Box>
        )}

        {error && slot !== 'verse' && (
          <Text size="xs" c="red.4" mt="xs" ta="center">{error}</Text>
        )}

        {/* Actions */}
        <Group justify="center" gap="sm" wrap="nowrap" mt="md">
          <Button
            size="md"
            color="brand"
            onClick={submit}
            disabled={
              (slot === 'assoc' && !assocInput.trim())
              || (slot === 'rhyme' && !rhymeInput.trim())
              || (slot === 'verse' && !verseInput.trim())
            }
          >
            {slot === 'verse'
              ? (isLast ? 'Pokaż piosenkę' : 'Zamknij zwrotkę')
              : 'Dalej'}
          </Button>
          {slot !== 'assoc' && (
            <Button
              size="md" variant="subtle" color="gray"
              leftSection={<IconArrowLeft size={14} />}
              onClick={goBack}
            >
              Wróć
            </Button>
          )}
        </Group>

        <Text size="xs" c="dimmed" ta="center" mt="sm">
          {slot === 'assoc'
            ? 'Skojarzenie zawsze ze słowa głównego — rym to tylko wypełniacz.'
            : slot === 'rhyme'
              ? 'Rym do twojego skojarzenia zamknie linijkę.'
              : 'Pisz swobodnie — oba słowa powinny wpaść do tekstu.'}
        </Text>
      </Paper>
    </Stack>
  );
}
