import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import logoSoMaisUm from '../../assets/logo-so-mais-um.svg'
import { lightTheme } from '../../styles/theme'
import { reportaErro } from '../../config/observabilidade'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Falha de carregamento de chunk após um deploy novo: o HTML em cache aponta
 * para um bundle que não existe mais. O tratamento é recarregar a página.
 */
function isChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : ''
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('dynamically imported module') ||
    msg.includes('Unable to preload CSS')
  )
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    if (isChunkError(error)) {
      window.location.reload()
      return { hasError: false }
    }
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)

    /**
     * Aqui é onde o erro do usuário deixava de existir (web#529): esta tela
     * aparecia para ele e mais ninguém ficava sabendo.
     *
     * O de chunk fica de fora: ele é deploy novo com HTML velho em cache, o
     * `getDerivedStateFromError` acima já recarrega a página, e isso é o
     * tratamento certo — não é notícia. O `beforeSend` do `observabilidade.ts`
     * também o descarta, para quando ele vier por outro caminho; aqui a checagem
     * é direta porque quem sabe que é chunk é este componente.
     */
    if (!isChunkError(error)) reportaErro(error, { origem: 'errorBoundary' })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}>
          <img src={logoSoMaisUm} alt="Só+1" style={{ height: 56, marginBottom: 8 }} />
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Algo deu errado</h2>
          <p style={{ color: lightTheme.colors.textMuted, margin: 0, maxWidth: 360 }}>
            Ocorreu um erro inesperado. Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '10px 24px',
              // Fora do ThemeProvider, mas do tema claro: o #22c55e com branco dava 2,28:1 (#511).
              background: lightTheme.colors.primary,
              color: lightTheme.colors.textOnPrimary,
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 15,
            }}
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
