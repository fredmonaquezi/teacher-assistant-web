import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/toolbox': {
        target: 'http://127.0.0.1:4173',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/toolbox/, '') || '/',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'vendor-react'
          }
          if (id.includes('/react-router/') || id.includes('/react-router-dom/')) {
            return 'vendor-router'
          }
          if (id.includes('/@supabase/')) {
            return 'vendor-supabase'
          }
          if (id.includes('/@tanstack/react-query/')) {
            return 'vendor-query'
          }
          if (id.includes('/i18next/') || id.includes('/react-i18next/')) {
            return 'vendor-i18n'
          }
          if (id.includes('/date-fns/') || id.includes('/react-day-picker/')) {
            return 'vendor-dates'
          }
          return 'vendor'
        },
      },
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.ui.test.jsx'],
    setupFiles: ['./src/test/setup-ui.js'],
    env: {
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_ANON_KEY: 'test-public-anon-key',
      VITE_ENABLE_GOOGLE_AUTH: 'false',
      VITE_PUBLIC_APP_URL: 'http://127.0.0.1:5173',
    },
    pool: 'threads',
    maxWorkers: 1,
    fileParallelism: false,
  },
})
