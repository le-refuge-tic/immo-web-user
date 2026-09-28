import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './api/httpInterceptor'
import App from './App.tsx'
import { registerServiceWorker } from './lib/push'
import { ThemeProvider } from './context/ThemeContext'
import { errorReporter } from './utils/errorReporter'

registerServiceWorker()

window.addEventListener('unhandledrejection', e => {
  errorReporter.send(e.reason, { extra: { type: 'unhandledrejection' } })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
