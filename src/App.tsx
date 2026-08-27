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
    <AppShell header={{ height: 56 }} padding={{ base: 'xs', sm: 'md' }}>
      <AppShell.Header>
        <Container size="xl" h="100%" px={{ base: 'xs', sm: 'md' }}>
          <Group h="100%" gap="md" wrap="nowrap">
            <Title order={4} style={{ letterSpacing: '-0.02em', flexShrink: 0 }}>Rymy</Title>
            <Group gap={4} wrap="nowrap">
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
                    // 44px tall so it is a real touch target, not just text.
                    style={{ display: 'flex', alignItems: 'center', height: 44, padding: '0 10px', borderRadius: 8 }}
                  >
                    <Group gap={6} wrap="nowrap">
                      <Icon size={18} />
                      {l.label}
                    </Group>
                  </Anchor>
                );
              })}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl" px={{ base: 'xs', sm: 'md' }} className="rymy-safe-bottom">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
