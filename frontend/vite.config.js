import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Unused while running on mock data (see src/services/api.js, USE_MOCK).
// Once the backend phase starts: flip USE_MOCK to false and this proxies
// /api and /ws to the Express backend on :4000, no CORS setup needed.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
      '/ws': { target: 'ws://localhost:4000', ws: true }
    }
  }
});
