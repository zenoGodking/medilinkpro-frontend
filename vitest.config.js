import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Vitest embarque sa propre version de Vite : on force le runtime JSX automatique de React 19.
  esbuild: { jsx: 'automatic' },
  define: { global: 'globalThis' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: false,
    // Les tests simulent la saisie au clavier : marge pour les machines lentes ou chargees.
    testTimeout: 20000,
  },
});
