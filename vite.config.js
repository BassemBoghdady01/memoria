import { defineConfig } from 'vite';
import { resolve } from 'node:path';

/* Two apps from one repo: the storefront (/) and the owner dashboard (/admin/).
   In dev, /admin and /admin/... are served the dashboard page. */
const adminFallback = () => ({
  name: 'memoria-admin-fallback',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (/^\/admin(\/(?!src\/)[^.]*)?$/.test(req.url.split('?')[0])) req.url = '/admin/index.html';
      next();
    });
  },
});

export default defineConfig({
  appType: 'spa',
  plugins: [adminFallback()],
  server: { port: 5173, open: false },
  preview: { port: 4173 },
  build: {
    target: 'es2022',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
