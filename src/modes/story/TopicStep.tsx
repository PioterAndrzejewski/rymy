import { useState } from "react";
import {
  Badge,
  Button,
  Flex,
  Group,
  Textarea,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconDice5,
  IconEyeOff,
  IconListNumbers,
  IconPencil,
  IconRefresh,
} from "@tabler/icons-react";
import { Section } from "@/components/wizard/StepShell";
import { ChoiceCard } from "@/components/wizard/ChoiceCard";
import { randomTopics } from "@/wordbank/pl/story-topics";
import {
  TOPIC_COUNT,
  parseDirectWords,
  randomTopic,
  type StoryConfig,
} from "./config";

type Props = {
  config: StoryConfig;
  patch: (p: Partial<StoryConfig>) => void;
};

export function TopicStep({ config, patch }: Props) {
  const [suggestions, setSuggestions] = useState(() => randomTopics(6));
  const directCount = parseDirectWords(config.directWords).length;

  return (
    <Stack gap="md">
      <Section title="Skąd temat historii">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="sm">
          <ChoiceCard
            icon={<IconPencil size={20} />}
            title="Wybieram temat"
            description="Wpisz własny albo wylosuj teraz — zobaczysz go przed startem."
            selected={config.topicMode === "pick"}
            onSelect={() => patch({ topicMode: "pick" })}
          >
            <Stack gap="xs">
              <Flex
                gap="xs"
                align={{ base: "stretch", xs: "end" }}
                direction={{ base: "column", xs: "row" }}
              >
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
                    variant={config.topic === t.text ? "filled" : "light"}
                    color={config.topic === t.text ? "brand" : "gray"}
                    style={{ cursor: "pointer" }}
                    onClick={() => patch({ topic: t.text })}
                  >
                    {t.text}
                  </Badge>
                ))}
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
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
            description="Temat wylosuje się dopiero przy starcie"
            selected={config.topicMode === "auto"}
            onSelect={() => patch({ topicMode: "auto" })}
          >
            <Text size="xs" c="dimmed">
              Losujemy z {TOPIC_COUNT} tematów. Zobaczysz go razem ze słowami
              kluczami.
            </Text>
          </ChoiceCard>
        </SimpleGrid>

        <ChoiceCard
          icon={<IconListNumbers size={20} />}
          title="Po prostu wpiszę słowa klucze"
          description="Bez tematu i bez reszty ustawień — wpisujesz listę i od razu startujesz."
          selected={config.topicMode === "none"}
          onSelect={() => patch({ topicMode: "none" })}
        >
          <Textarea
            label="Słowa klucze — jedno na linię"
            description="Kolejność ma znaczenie: w tej kolejności będą padać w ćwiczeniu."
            autosize
            minRows={4}
            maxRows={12}
            value={config.directWords}
            onChange={(e) => patch({ directWords: e.currentTarget.value })}
            placeholder={"rower\ndeszcz\nprzystanek"}
          />
          <Group justify="space-between" mt="xs">
            <Text size="xs" c="dimmed">
              {directCount === 0
                ? "Wpisz przynajmniej dwa słowa."
                : `${directCount} ${directCount === 1 ? "słowo" : directCount < 5 ? "słowa" : "słów"} — tyle będzie w ćwiczeniu.`}
            </Text>
          </Group>
        </ChoiceCard>
      </Section>
    </Stack>
  );
}
