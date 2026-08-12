import { defineConfig } from 'vite';

export default defineConfig({
  appType: 'spa',
  server: { port: 5173, open: false },
  preview: { port: 4173 },
  build: {
    target: 'es2019',
    cssCodeSplit: false,
    assetsInlineLimit: 4096,
  },
});
