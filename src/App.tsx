import { AppShell, Group, Title, Anchor, Container } from '@mantine/core';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { IconMicrophone, IconMusic } from '@tabler/icons-react';

const links = [
  { to: '/', label: 'Start', icon: IconMicrophone, exact: true },
  { to: '/tracks', label: 'Podkłady', icon: IconMusic },
];

export default function App() {
  const loc = useLocation();
  const isActive = (to: string, exact?: boolean) =>
    exact ? loc.pathname === to : loc.pathname.startsWith(to.split('/').slice(0, 2).join('/'));

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="xl">
              <Title order={4} style={{ letterSpacing: '-0.02em' }}>Rymy</Title>
              <Group gap="xs">
                {links.map((l) => {
                  const Icon = l.icon;
                  const active = isActive(l.to, l.exact);
                  return (
                    <Anchor
                      key={l.to}
                      component={NavLink}
                      to={l.to}
                      underline="never"
                      c={active ? 'brand' : 'dimmed'}
                      fw={active ? 600 : 400}
                    >
                      <Group gap={6}>
                        <Icon size={16} />
                        {l.label}
                      </Group>
                    </Anchor>
                  );
                })}
              </Group>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
