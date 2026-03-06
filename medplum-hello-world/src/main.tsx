// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { MantineProvider, createTheme } from '@mantine/core';
import '@mantine/core/styles.css';
import { MedplumClient } from '@medplum/core';
import { MedplumProvider } from '@medplum/react';
import '@medplum/react/styles.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App';
import { getConfig } from './config';
import { startExpirationChecker } from './utils/expirationChecker';

const medplum = new MedplumClient({
  onUnauthenticated: () => (window.location.href = '/'),
  baseUrl: getConfig().baseUrl,
});

// Start background expiration checker
// This will run periodically to detect and mark expired positioners
startExpirationChecker(medplum);

const theme = createTheme({
  primaryColor: 'green',
  colors: {
    green: [
      '#e8f5e9',
      '#c8e6c9',
      '#a5d6a7',
      '#81c784',
      '#66bb6a',
      '#4caf50',
      '#43a047',
      '#388e3c',
      '#2e7d32',
      '#1b5e20',
    ],
  },
  headings: {
    sizes: {
      h1: {
        fontSize: '1.125rem',
        fontWeight: '500',
        lineHeight: '2.0',
      },
    },
  },
  fontSizes: {
    xs: '0.6875rem',
    sm: '0.875rem',
    md: '0.875rem',
    lg: '1.0rem',
    xl: '1.125rem',
  },
  defaultRadius: 'md',
});

const container = document.getElementById('root') as HTMLDivElement;
const root = createRoot(container);
root.render(
  <StrictMode>
    <BrowserRouter>
      <MedplumProvider medplum={medplum}>
        <MantineProvider theme={theme}>
          <App />
        </MantineProvider>
      </MedplumProvider>
    </BrowserRouter>
  </StrictMode>
);
