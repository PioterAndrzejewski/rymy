import { Badge, Button, Group, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { IconDice5, IconEyeOff, IconPencil } from '@tabler/icons-react';
import { Section } from '@/components/wizard/StepShell';
import { ChoiceCard } from '@/components/wizard/ChoiceCard';
import { STORY_TOPICS } from '@/wordbank/pl/story-topics';
import { randomTopic, type StoryConfig } from './config';

type Props = {
  config: StoryConfig;
  patch: (p: Partial<StoryConfig>) => void;
};

export function TopicStep({ config, patch }: Props) {
  const suggestions = STORY_TOPICS.slice(0, 6);

  return (
    <Stack gap="md">
      <Section title="Skąd temat historii">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <ChoiceCard
            icon={<IconPencil size={20} />}
            title="Wybieram temat"
            description="Wpisz własny albo wylosuj teraz — zobaczysz go przed startem."
            selected={config.topicMode === 'pick'}
            onSelect={() => patch({ topicMode: 'pick' })}
          >
            <Stack gap="xs">
              <Group gap="xs" align="end" wrap="nowrap">
                <TextInput
                  style={{ flex: 1 }}
                  placeholder="np. spóźniony autobus"
                  value={config.topic}
                  onChange={(e) => patch({ topic: e.currentTarget.value })}
                />
                <Button
                  variant="default"
                  leftSection={<IconDice5 size={14} />}
                  onClick={() => patch({ topic: randomTopic() })}
                >
                  Losuj
                </Button>
              </Group>
              <Group gap={6} wrap="wrap">
                {suggestions.map((t) => (
                  <Badge
                    key={t}
                    variant={config.topic === t ? 'filled' : 'light'}
                    color={config.topic === t ? 'brand' : 'gray'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => patch({ topic: t })}
                  >
                    {t}
                  </Badge>
                ))}
              </Group>
            </Stack>
          </ChoiceCard>

          <ChoiceCard
            icon={<IconEyeOff size={20} />}
            title="Niespodzianka"
            description="Temat wylosuje się dopiero przy starcie — zero czasu na przygotowanie."
            selected={config.topicMode === 'auto'}
            onSelect={() => patch({ topicMode: 'auto' })}
          >
            <Text size="xs" c="dimmed">
              Losujemy z {STORY_TOPICS.length} tematów. Zobaczysz go razem ze słowami kluczami.
            </Text>
          </ChoiceCard>
        </SimpleGrid>
      </Section>
    </Stack>
  );
}
