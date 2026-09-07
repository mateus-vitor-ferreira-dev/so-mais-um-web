/**
 * A escolha da cor (#314).
 *
 * Duas coisas que somem numa refatoração e não aparecem na tela:
 *
 * 1. **É um grupo de rádio de verdade.** Sem `role`/`aria-checked`, quem usa
 *    leitor de tela ouve oito botões sem nome e sem estado — e cor é justamente
 *    o que essa pessoa não consegue ver.
 * 2. **Dá para desescolher.** Sem isso, clicar por curiosidade prende o time à
 *    primeira cor, e a única saída seria escolher outra.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import SeletorDeCorDoTime from './index'
import { CORES_DE_TIME, corDerivadaDoNome, NOME_DA_COR } from '../../constants/coresDeTime'

describe('SeletorDeCorDoTime', () => {
  it('oferece a paleta inteira, cada cor com o nome dela', () => {
    renderWithProviders(<SeletorDeCorDoTime valor={null} aoEscolher={vi.fn()} nome="Fúria" />)

    const opcoes = screen.getAllByRole('radio')
    expect(opcoes).toHaveLength(CORES_DE_TIME.length)
    // Quem não distingue as cores escolhe pelo nome.
    expect(screen.getByRole('radio', { name: NOME_DA_COR.ROXO })).toBeInTheDocument()
  })

  it('marca a cor escolhida', () => {
    renderWithProviders(<SeletorDeCorDoTime valor="ROXO" aoEscolher={vi.fn()} nome="Fúria" />)

    expect(screen.getByRole('radio', { name: NOME_DA_COR.ROXO })).toBeChecked()
  })

  it('sem escolha, marca a cor derivada do nome — "sem cor" não é nada marcado', () => {
    renderWithProviders(<SeletorDeCorDoTime valor={null} aoEscolher={vi.fn()} nome="Fúria" />)

    const derivada = corDerivadaDoNome('Fúria')
    expect(screen.getByRole('radio', { name: NOME_DA_COR[derivada] })).toBeChecked()
  })

  it('avisa quem escolheu', async () => {
    const aoEscolher = vi.fn()
    const { user } = renderWithProviders(
      <SeletorDeCorDoTime valor={null} aoEscolher={aoEscolher} nome="Fúria" />,
    )

    await user.click(screen.getByRole('radio', { name: NOME_DA_COR.CIANO }))
    expect(aoEscolher).toHaveBeenCalledWith('CIANO')
  })

  it('dá para desfazer a escolha e voltar à cor do nome', async () => {
    const aoEscolher = vi.fn()
    const { user } = renderWithProviders(
      <SeletorDeCorDoTime valor="ROXO" aoEscolher={aoEscolher} nome="Fúria" />,
    )

    await user.click(screen.getByRole('button', { name: /Usar a cor do nome/ }))
    // `null`, e não a cor derivada: é a api que precisa saber que ninguém
    // escolheu, senão a derivada viraria uma escolha e pararia de acompanhar o
    // nome quando o time fosse renomeado.
    expect(aoEscolher).toHaveBeenCalledWith(null)
  })

  it('sem escolha, não oferece o desfazer — não há o que desfazer', () => {
    renderWithProviders(<SeletorDeCorDoTime valor={null} aoEscolher={vi.fn()} nome="Fúria" />)

    expect(screen.queryByRole('button', { name: /Usar a cor do nome/ })).not.toBeInTheDocument()
  })
})
