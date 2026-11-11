import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// O service worker não faz cache da aplicação: ele existe só para receber o
// Push quando a aba está fechada. Registro cedo não pede permissão nenhuma.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { void navigator.serviceWorker.register('/service-worker.js') })
}

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado no index.html')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
