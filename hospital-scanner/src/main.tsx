import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/index.css';

const theme = createTheme({
  primaryColor: 'teal',
  colors: {
    teal: [
      '#e6f4f4',
      '#ccebeb',
      '#99d6d6',
      '#66c2c2',
      '#33adad',
      '#009999',
      '#007a7a', // Main primary color
      '#006666',
      '#004d4d',
      '#003333',
    ],
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" />
      <App />
    </MantineProvider>
  </StrictMode>
);
