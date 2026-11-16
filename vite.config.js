import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // React + router change rarely; a separate chunk stays cached across deploys.
        manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom'] },
      },
    },
  },
});
