import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react() as any],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    // Aseguramos que busque en la carpeta que creaste
    include: ['src/**/*.{test,spec}.{ts,tsx}'], 
  },
});