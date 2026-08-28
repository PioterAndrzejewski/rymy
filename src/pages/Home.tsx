import { Card, Grid, Text, Stack, Badge, Group } from "@mantine/core";
import { Link } from "react-router-dom";
import {
  IconRepeat,
  IconLink,
  IconBook2,
  IconBuildingCastle,
  IconNotes,
} from "@tabler/icons-react";

const modes = [
  {
    slug: "family",
    label: "Wypluj się z rymów",
    desc: "Jedna końcówka, zegar i tyle rymów, ile zdążysz wypluć.",
    icon: IconRepeat,
    tag: "bez podkładu",
  },
  {
    slug: "chain",
    label: "Łańcuch skojarzeń",
    desc: "Skojarzenie i rym do niego, a twój rym startuje następne ogniwo.",
    icon: IconLink,
    tag: "bez podkładu",
  },
  {
    slug: "palace",
    label: "Pałac mentalny",
    desc: "Słowa w pokojach, rozproszenie, a potem odtwarzasz je w kolejności.",
    icon: IconBuildingCastle,
    tag: "pamięć",
  },
  {
    slug: "verse",
    label: "Piosenka",
    desc: "Skojarzenia i rymy budują kolejne zwrotki. Na końcu śpiewasz swój tekst do podkładu.",
    icon: IconNotes,
    tag: "pisz + śpiewaj",
  },
  {
    slug: "story",
    label: "Historia",
    desc: "Temat i słowa klucze, chwila na zapamiętanie, potem śpiewasz.",
    icon: IconBook2,
    tag: "4 kroki",
    featured: true,
  },
];

export default function Home() {
  return (
    <Stack gap="xl" my="md">
      <Grid gutter="md">
        {modes.map((m) => {
          const Icon = m.icon;
          return (
            <Grid.Col key={m.slug} span={m.featured ? 12 : { base: 12, sm: 6 }}>
              <Card
                component={Link}
                to={`/practice/${m.slug}`}
                withBorder
                padding="lg"
                h="100%"
                style={{
                  transition: "transform 120ms ease, border-color 120ms ease",
                }}
                className="hover:!border-[var(--mantine-color-brand-6)] hover:-translate-y-0.5"
              >
                <Group justify="space-between" mb="sm">
                  <Icon size={m.featured ? 28 : 22} />
                  <Badge variant="light" color="brand">
                    {m.tag}
                  </Badge>
                </Group>
                <Text fw={600} size={m.featured ? "xl" : "lg"}>
                  {m.label}
                </Text>
                <Text c="dimmed" size="sm" mt={4}>
                  {m.desc}
                </Text>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
    </Stack>
  );
}
