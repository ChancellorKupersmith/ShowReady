import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        map: resolve(__dirname, "map.html"),
      },
    },
  },
  server: {
    // strictPort: true,
    // Local Development Proxies
    proxy: {
      '/map': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/songs_list': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/google_api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/spotify': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/radiogen': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
