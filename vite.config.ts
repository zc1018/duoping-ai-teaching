import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/duoping/',
  server: {
    proxy: {
      '/api/kimi': {
        target: 'https://api.moonshot.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kimi/, ''),
        secure: true,
      }
    }
  }
})
