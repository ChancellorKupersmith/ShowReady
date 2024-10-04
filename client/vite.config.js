import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
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
})
