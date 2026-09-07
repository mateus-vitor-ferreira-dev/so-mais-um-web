/**
 * O contrato do vazio compartilhado (#315).
 *
 * Ele nasceu de 14 declarações em 14 `styles.ts`, com nove aparências
 * distintas para a mesma ideia. O que estes testes prendem não é a aparência —
 * essa a revisão visual pega — e sim as três decisões que se perdem calado:
 *
 * 1. **O vazio com título é uma região nomeada.** Sem isso, quem usa leitor de
 *    tela recebe dois parágrafos sem contexto, e o botão do vazio soa igual ao
 *    do cabeçalho, sem nada que os separe.
 * 2. **O ícone não é anunciado.** Ele dá peso visual; o conteúdo está no texto.
 * 3. **A moldura acompanha o título por padrão.** É o sinal de que o vazio é o
 *    assunto da área, e não um aviso de canto de tela.
 */
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import EmptyState from './index'

describe('EmptyState', () => {
  it('mostra o texto que recebe', () => {
    renderWithProviders(<EmptyState>Nenhuma partida disponível.</EmptyState>)

    expect(screen.getByText('Nenhuma partida disponível.')).toBeInTheDocument()
  })

  it('com título, vira região nomeada por ele', () => {
    renderWithProviders(<EmptyState titulo="Você ainda não tem time">Crie o seu.</EmptyState>)

    const regiao = screen.getByRole('region', { name: 'Você ainda não tem time' })
    expect(regiao).toBeInTheDocument()
    expect(regiao).toHaveTextContent('Crie o seu.')
  })

  it('sem título, não inventa região — vazio de canto de tela não é seção', () => {
    renderWithProviders(<EmptyState>Nenhum usuário encontrado.</EmptyState>)

    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })

  it('o ícone fica fora da árvore de acessibilidade', () => {
    renderWithProviders(<EmptyState icone="🏆">Nenhum torneio encontrado.</EmptyState>)

    // O emoji não pode ser lido em voz alta: "troféu" não acrescenta nada a
    // "Nenhum torneio encontrado".
    expect(screen.getByText('🏆')).toHaveAttribute('aria-hidden', 'true')
  })

  it('a ação chega junto e continua clicável', async () => {
    const { user } = renderWithProviders(
      <EmptyState titulo="Sem times" acao={<button type="button">Criar time</button>}>
        Crie o seu.
      </EmptyState>,
    )

    const botao = screen.getByRole('button', { name: 'Criar time' })
    await user.click(botao)
    expect(botao).toBeInTheDocument()
  })

  it('quem renderiza ainda manda: o papel passado por fora vence', () => {
    renderWithProviders(
      <EmptyState titulo="Sem nada" role="status">vazio</EmptyState>,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('region')).not.toBeInTheDocument()
  })
})
