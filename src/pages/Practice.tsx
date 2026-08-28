import { useParams } from 'react-router-dom';
import { Alert } from '@mantine/core';
import { RhymeFamily } from '@/modes/RhymeFamily';
import { ChainMode } from '@/modes/ChainMode';
import { StoryMode } from '@/modes/StoryMode';
import { MemoryPalace } from '@/modes/MemoryPalace';
import { VerseMode } from '@/modes/VerseMode';

export default function Practice() {
  const { mode } = useParams();
  switch (mode) {
    case 'family': return <RhymeFamily />;
    case 'chain': return <ChainMode />;
    case 'palace': return <MemoryPalace />;
    case 'verse': return <VerseMode />;
    case 'story': return <StoryMode />;
    default:
      return <Alert color="red" title="Nieznany tryb">Brak trybu: {mode}</Alert>;
  }
}
