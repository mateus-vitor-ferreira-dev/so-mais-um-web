/**
 * A faixa que rola de lado (web#511).
 *
 * O jsdom não calcula layout, então as medidas da rolagem são postas à mão. O
 * que se prende é a regra: o esmaecido de cada lado aparece só quando há mais
 * conteúdo daquele lado, e anda com a rolagem.
 */
import { describe, expect, it } from 'vitest'
import { fireEvent, renderWithProviders, screen } from '../../test/render'
import RolagemHorizontal from './index'

function medidas(el: HTMLElement, { largura, conteudo, rolagem }: { largura: number; conteudo: number; rolagem: number }) {
  Object.defineProperty(el, 'clientWidth', { configurable: true, value: largura })
  Object.defineProperty(el, 'scrollWidth', { configurable: true, value: conteudo })
  Object.defineProperty(el, 'scrollLeft', { configurable: true, writable: true, value: rolagem })
}

const faixa = () => screen.getByRole('region', { name: 'Horas' })
const esmaecidos = () => {
  // O styled-components põe as regras numa classe; o estado sai pelas props
  // transientes, que viram classes diferentes. Comparar a classe de dois
  // estados é o que o jsdom permite afirmar sem layout.
  return faixa().parentElement!.className
}

describe('RolagemHorizontal', () => {
  it('é uma região rotulada e alcançável pelo teclado', () => {
    renderWithProviders(<RolagemHorizontal rotulo="Horas"><ul><li>11h</li></ul></RolagemHorizontal>)

    expect(faixa()).toHaveAttribute('tabindex', '0')
    expect(screen.getByText('11h')).toBeInTheDocument()
  })

  it('muda o esmaecido conforme há mais conteúdo de cada lado', () => {
    renderWithProviders(<RolagemHorizontal rotulo="Horas"><ul><li>11h</li></ul></RolagemHorizontal>)

    medidas(faixa(), { largura: 300, conteudo: 300, rolagem: 0 })
    fireEvent.scroll(faixa())
    const cabeInteira = esmaecidos()

    medidas(faixa(), { largura: 300, conteudo: 900, rolagem: 0 })
    fireEvent.scroll(faixa())
    const maisADireita = esmaecidos()

    medidas(faixa(), { largura: 300, conteudo: 900, rolagem: 300 })
    fireEvent.scroll(faixa())
    const dosDoisLados = esmaecidos()

    medidas(faixa(), { largura: 300, conteudo: 900, rolagem: 600 })
    fireEvent.scroll(faixa())
    const noFim = esmaecidos()

    expect(new Set([cabeInteira, maisADireita, dosDoisLados, noFim]).size).toBe(4)
  })
})
