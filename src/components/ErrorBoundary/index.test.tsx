import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ErrorInfo } from 'react'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '.'

const reportaErro = vi.hoisted(() => vi.fn())
vi.mock('../../config/observabilidade', () => ({ reportaErro }))

function Estoura({ mensagem }: { mensagem: string }): never {
  throw new Error(mensagem)
}

/** React imprime o erro no console mesmo quando o boundary o trata. */
function semRuidoNoConsole() {
  return vi.spyOn(console, 'error').mockImplementation(() => {})
}

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

describe('ErrorBoundary', () => {
  /**
   * O ponto da web#529: esta tela aparecia para quem estava usando e mais
   * ninguém ficava sabendo.
   */
  it('reporta o erro e mostra a tela de falha', () => {
    semRuidoNoConsole()

    render(
      <ErrorBoundary>
        <Estoura mensagem="a tela quebrou de verdade" />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Algo deu errado')).toBeInTheDocument()
    expect(reportaErro).toHaveBeenCalledTimes(1)
    expect(reportaErro.mock.calls[0][1]).toMatchObject({ origem: 'errorBoundary' })
  })

  /**
   * Chunk velho depois de um deploy é HTML em cache apontando para um bundle
   * que não existe mais. A página recarrega e resolve sozinha — mandar isso
   * para o painel encheria o lugar de uma coisa que já se conserta.
   *
   * Aqui os dois métodos são chamados direto, sem renderizar. Com `render`, o
   * `hasError: false` que a recarga devolve faz o React remontar os filhos —
   * no navegador a recarga leva tudo embora, mas no jsdom ela é um espião, e a
   * remontagem vira um erro não tratado que reprova a suíte por um motivo que
   * não existe em produção.
   */
  it('NÃO reporta falha de chunk, que se resolve recarregando', () => {
    semRuidoNoConsole()
    const recarrega = vi.fn()
    vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      reload: recarrega,
    } as unknown as Location)
    const erro = new Error('Failed to fetch dynamically imported module: /assets/Perfil-abc.js')

    const estado = ErrorBoundary.getDerivedStateFromError(erro)
    new ErrorBoundary({ children: null }).componentDidCatch(erro, {
      componentStack: '',
    } as ErrorInfo)

    expect(recarrega).toHaveBeenCalled()
    // Sem tela de erro: a página está indo embora de qualquer jeito.
    expect(estado.hasError).toBe(false)
    expect(reportaErro).not.toHaveBeenCalled()
  })
})
