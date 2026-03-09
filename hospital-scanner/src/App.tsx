import { Container, Paper, Title, Text, Stack, Group, Badge } from '@mantine/core';
import { IconQrcode } from '@tabler/icons-react';
import type { JSX } from 'react';
import { Scanner } from './components/Scanner';
import styles from './App.module.css';

export function App(): JSX.Element {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Group gap="md">
              <div className={styles.logo}>
                <IconQrcode size={28} color="white" />
              </div>
              <div>
                <Title order={3} c="white">Hospital Scanner</Title>
                <Text size="sm" c="rgba(255,255,255,0.8)">Patient → Positioner Assignment</Text>
              </div>
            </Group>
            <Badge size="lg" variant="light" color="white">
              Medplum Connected
            </Badge>
          </Group>
        </Container>
      </header>
      
      <main className={styles.main}>
        <Container size="sm">
          <Paper shadow="lg" radius="lg" p="xl" className={styles.scannerCard}>
            <Scanner />
          </Paper>
        </Container>
      </main>
      
      <footer className={styles.footer}>
        <Container size="lg">
          <Text size="sm" c="dimmed" ta="center">
            Pressure Injury Prevention System • Scan patient bracelet, then positioner barcode
          </Text>
        </Container>
      </footer>
    </div>
  );
}
