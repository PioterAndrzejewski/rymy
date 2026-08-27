import { useParams } from 'react-router-dom';
import { Alert } from '@mantine/core';
import { RhymeFamily } from '@/modes/RhymeFamily';
import { StoryMode } from '@/modes/StoryMode';

export default function Practice() {
  const { mode } = useParams();
  switch (mode) {
    case 'family': return <RhymeFamily />;
    case 'story': return <StoryMode />;
    default:
      return <Alert color="red" title="Nieznany tryb">Brak trybu: {mode}</Alert>;
  }
}
