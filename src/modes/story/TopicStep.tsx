import { useState } from 'react';
import { Badge, Button, Flex, Group, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { IconDice5, IconEyeOff, IconPencil, IconRefresh } from '@tabler/icons-react';
import { Section } from '@/components/wizard/StepShell';
import { ChoiceCard } from '@/components/wizard/ChoiceCard';
import { randomTopics } from '@/wordbank/pl/story-topics';
import { TOPIC_COUNT, randomTopic, type StoryConfig } from './config';

type Props = {
  config: StoryConfig;
  patch: (p: Partial<StoryConfig>) => void;
};

export function TopicStep({ config, patch }: Props) {
  const [suggestions, setSuggestions] = useState(() => randomTopics(6));

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
              <Flex gap="xs" align={{ base: 'stretch', xs: 'end' }} direction={{ base: 'column', xs: 'row' }}>
                <TextInput
                  style={{ flex: 1, minWidth: 0 }}
                  size="md"
                  placeholder="np. spóźniony autobus"
                  value={config.topic}
                  onChange={(e) => patch({ topic: e.currentTarget.value })}
                  enterKeyHint="done"
                />
                <Button
                  variant="default"
                  size="md"
                  leftSection={<IconDice5 size={14} />}
                  onClick={() => patch({ topic: randomTopic() })}
                >
                  Losuj
                </Button>
              </Flex>
              <Group gap={6} wrap="wrap" align="center">
                {suggestions.map((t) => (
                  <Badge
                    key={t.text}
                    variant={config.topic === t.text ? 'filled' : 'light'}
                    color={config.topic === t.text ? 'brand' : 'gray'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => patch({ topic: t.text })}
                  >
                    {t.text}
                  </Badge>
                ))}
                <Button
                  size="compact-xs" variant="subtle" color="gray"
                  leftSection={<IconRefresh size={12} />}
                  onClick={() => setSuggestions(randomTopics(6))}
                >
                  inne
                </Button>
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
              Losujemy z {TOPIC_COUNT} tematów. Zobaczysz go razem ze słowami kluczami.
            </Text>
          </ChoiceCard>
        </SimpleGrid>
      </Section>
    </Stack>
  );
}
