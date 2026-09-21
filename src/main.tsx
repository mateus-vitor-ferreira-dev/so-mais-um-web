import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { iniciaObservabilidade } from './config/observabilidade'

// Antes de montar: erro no primeiro render também é erro (web#529).
// Sem VITE_SENTRY_DSN não faz nada — ver `config/observabilidade.ts`.
iniciaObservabilidade()

const container = document.getElementById('root')
if (!container) throw new Error('Elemento #root não encontrado no index.html')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
