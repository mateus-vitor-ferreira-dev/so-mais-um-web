import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { PageHeaderProvider } from '../components/DashboardLayout/pageHeader'

/**
 * A topbar do layout, reduzida ao que a página publica nela (web#493).
 *
 * Desde a #493 o título das páginas do jogador sai do corpo e vai para a
 * topbar, pelo `usePageHeader`. Montar o `DashboardLayout` inteiro num teste de
 * página traria o sino, o menu e a sessão junto; isto recebe o título e o
 * mostra como o layout mostraria, num `<h1>`.
 */
export function ComTopbar({ children }: { children: ReactNode }) {
  const [cabecalho, setCabecalho] = useState<{ title: string; sub?: string }>({ title: '' })
  const setHeader = useCallback((title: string, sub?: string) => setCabecalho({ title, sub }), [])
  const valor = useMemo(() => ({ setHeader, actionsSlot: null }), [setHeader])

  return (
    <PageHeaderProvider value={valor}>
      <header>
        <h1>{cabecalho.title}</h1>
        {cabecalho.sub && <p>{cabecalho.sub}</p>}
      </header>
      {children}
    </PageHeaderProvider>
  )
}
