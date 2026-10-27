import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import './index.css'
import './api/httpInterceptor'
import App from './App.tsx'
import { registerServiceWorker } from './lib/push'
import { ThemeProvider } from './context/ThemeContext'
import { errorReporter } from './utils/errorReporter'
import { reportWebVitals } from './lib/webVitals'

registerServiceWorker()
errorReporter.init()
reportWebVitals()

// Après un déploiement, un onglet resté ouvert réclame d'anciens fichiers qui n'existent plus :
// on recharge une fois (garde anti-boucle) pour récupérer la version courante.
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('rg_chunk_reload')) return
    sessionStorage.setItem('rg_chunk_reload', '1')
  } catch { /* stockage indisponible : un seul rechargement tenté quand même */ }
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
