import {
  Card,
  SimpleGrid,
  Text,
  Title,
  Stack,
  Badge,
  Group,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { IconRepeat, IconBook2 } from "@tabler/icons-react";

const modes = [
  {
    slug: "family",
    label: "Wypluj się z rymów",
    desc: "Jedna końcówka, zegar i tyle rymów, ile zdążysz wypluć.",
    icon: IconRepeat,
    tag: "bez podkładu",
  },
  {
    slug: "story",
    label: "Historia",
    desc: "Temat i słowa klucze, chwila na zapamiętanie, potem śpiewasz.",
    icon: IconBook2,
    tag: "4 kroki",
  },
];

export default function Home() {
  return (
    <Stack gap="xl" my="md">
      <div>
        <Title order={2}>Wybierz tryb praktyki</Title>
        <Text c="dimmed" mt={4}>
          Każdy tryb prowadzi cię krok po kroku: podkład → ustawienia → start.
        </Text>
      </div>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.slug}
              component={Link}
              to={`/practice/${m.slug}`}
              withBorder
              padding="lg"
              style={{
                transition: "transform 120ms ease, border-color 120ms ease",
              }}
              className="hover:!border-[var(--mantine-color-brand-6)] hover:-translate-y-0.5"
            >
              <Group justify="space-between" mb="sm">
                <Icon size={22} />
                <Badge variant="light" color="brand">
                  {m.tag}
                </Badge>
              </Group>
              <Text fw={600} size="lg">
                {m.label}
              </Text>
              <Text c="dimmed" size="sm" mt={4}>
                {m.desc}
              </Text>
            </Card>
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
