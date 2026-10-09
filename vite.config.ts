import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  build: { outDir: '../../dist/client', emptyOutDir: true },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4317',
        changeOrigin: true,
        configure(proxy) {
          proxy.on('proxyReq', (req) => {
            if (req.hasHeader('origin'))
              req.setHeader('origin', 'http://127.0.0.1:4317');
          });
        },
      },
    },
  },
});
