import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import type { MantineColorsTuple } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import App from './App';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Tracks from './pages/Tracks';

import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import './index.css';

// Ciepła, złocisto-żółta barwa wiodąca + chłodny błękit jako akcent.
const brand: MantineColorsTuple = [
  '#fff9e1', '#fdf1c9', '#fae199', '#f7d064', '#f5c239',
  '#f3b81d', '#f3b30c', '#d89d00', '#c08b00', '#a67700',
];

const accent: MantineColorsTuple = [
  '#e5f4ff', '#cbe4fb', '#98c8f2', '#61aaea', '#3690e3', '#1a80e0', '#0878df', '#0067c7', '#005bb3', '#004e9e',
];

const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: { light: 6, dark: 5 },
  autoContrast: true,
  luminanceThreshold: 0.45,
  colors: { brand, accent },
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Mono", monospace',
  defaultRadius: 'md',
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'practice/:mode', element: <Practice /> },
      { path: 'tracks', element: <Tracks /> },
    ],
  },
], { basename: import.meta.env.BASE_URL });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications position="top-right" />
      <RouterProvider router={router} />
    </MantineProvider>
  </React.StrictMode>,
);
