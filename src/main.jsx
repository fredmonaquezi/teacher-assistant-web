import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import './i18n'
import { queryClient } from './lib/queryClient'

const PRELOAD_RELOAD_GUARD_KEY = 'ta.preload-reload-once'

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()

    const hasReloaded = window.sessionStorage.getItem(PRELOAD_RELOAD_GUARD_KEY) === '1'
    if (hasReloaded) return

    window.sessionStorage.setItem(PRELOAD_RELOAD_GUARD_KEY, '1')
    window.location.reload()
  })

  window.addEventListener('pageshow', () => {
    window.sessionStorage.removeItem(PRELOAD_RELOAD_GUARD_KEY)
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
