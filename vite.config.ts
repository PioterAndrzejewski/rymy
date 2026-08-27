import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// GitHub Pages serves the app from https://<user>.github.io/rymy/, so every
// asset URL needs that prefix. Override with VITE_BASE=/ for other hosts.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/rymy/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: { port: 5173, open: false },
});
