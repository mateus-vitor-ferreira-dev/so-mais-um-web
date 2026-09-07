/**
 * A marca do time na tela (#314).
 *
 * O teste que carrega este arquivo é o do **tema**. A cor é guardada no banco
 * pelo nome, e o tom é escolhido aqui — se o claro e o escuro devolvessem o
 * mesmo hexadecimal, metade dos times sumiria no fundo de um dos dois, e o
 * defeito não aparece em nenhum teste de comportamento.
 *
 * O segundo é a acessibilidade: a marca fica ao lado do nome do time em todos
 * os lugares onde aparece, e anunciá-la faria o leitor de tela dizer duas vezes
 * a mesma coisa.
 */
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import MarcaDoTime from './index'
import { TONS, corDerivadaDoNome } from '../../constants/coresDeTime'

describe('MarcaDoTime', () => {
  it('mostra as iniciais do time', () => {
    renderWithProviders(<MarcaDoTime nome="Fúria Azul" cor="ROXO" />)

    expect(screen.getByText('FA')).toBeInTheDocument()
  })

  it('não é anunciada — o nome do time está do lado', () => {
    renderWithProviders(<MarcaDoTime nome="Fúria Azul" cor="ROXO" />)

    expect(screen.getByText('FA')).toHaveAttribute('aria-hidden', 'true')
  })

  it('pinta com a cor escolhida', () => {
    renderWithProviders(<MarcaDoTime nome="Fúria Azul" cor="ROXO" />)

    expect(screen.getByText('FA')).toHaveStyle({ background: TONS.light.ROXO.fundo })
  })

  it('sem cor escolhida, pinta com a derivada do nome', () => {
    renderWithProviders(<MarcaDoTime nome="Fúria Azul" cor={null} />)

    const derivada = corDerivadaDoNome('Fúria Azul')
    expect(screen.getByText('FA')).toHaveStyle({ background: TONS.light[derivada].fundo })
  })

  it('o tom acompanha o tema — é por isso que o banco guarda o nome da cor', () => {
    renderWithProviders(<MarcaDoTime nome="Fúria Azul" cor="ROXO" />, { theme: 'dark' })

    expect(screen.getByText('FA')).toHaveStyle({ background: TONS.dark.ROXO.fundo })
    // E o tom do escuro precisa ser OUTRO: se fossem iguais, esta tabela não
    // teria razão de existir e o defeito voltaria sem nada reclamar.
    expect(TONS.dark.ROXO.fundo).not.toBe(TONS.light.ROXO.fundo)
  })

  it('todas as oito cores têm tom nos dois temas', () => {
    for (const cor of Object.keys(TONS.light) as (keyof typeof TONS.light)[]) {
      expect(TONS.dark[cor], cor).toBeDefined()
      expect(TONS.dark[cor].fundo, cor).not.toBe(TONS.light[cor].fundo)
    }
  })
})
