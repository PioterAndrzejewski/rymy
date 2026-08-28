import { AppShell, Group, Title, Container, UnstyledButton } from '@mantine/core';
import { Link, Outlet } from 'react-router-dom';

export default function App() {
  return (
    <AppShell header={{ height: 56 }} padding={{ base: 'xs', sm: 'md' }}>
      <AppShell.Header>
        <Container size="xl" h="100%" px={{ base: 'xs', sm: 'md' }}>
          <Group h="100%" gap="md" wrap="nowrap">
            {/* The title is the only nav we need: it always goes back to the mode list. */}
            <UnstyledButton component={Link} to="/">
              <Title order={4} style={{ letterSpacing: '-0.02em', flexShrink: 0 }}>Rymy</Title>
            </UnstyledButton>
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
