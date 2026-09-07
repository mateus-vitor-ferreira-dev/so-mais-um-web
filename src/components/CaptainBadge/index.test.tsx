/**
 * O selo do capitão (#315).
 *
 * Eram duas peças idênticas com dois nomes — `CaptainTag` e `CaptainBadge` —,
 * e a coroa era desenhada por quem chamava, em dois tamanhos diferentes. O que
 * este teste prende é a divisão: a **coroa** vem de dentro, o **rótulo** de
 * fora. É o rótulo que legitimamente difere entre as telas.
 */
import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import CaptainBadge from './index'

describe('CaptainBadge', () => {
  it('aceita o rótulo de quem chama — as duas telas dizem coisas diferentes', () => {
    const { unmount } = renderWithProviders(<CaptainBadge>Você é o capitão</CaptainBadge>)
    expect(screen.getByText(/Você é o capitão/)).toBeInTheDocument()
    unmount()

    renderWithProviders(<CaptainBadge>Capitão</CaptainBadge>)
    expect(screen.getByText(/Capitão/)).toBeInTheDocument()
  })

  it('desenha a coroa sozinho, e ela não é lida em voz alta', () => {
    const { container } = renderWithProviders(<CaptainBadge>Capitão</CaptainBadge>)

    const coroa = container.querySelector('svg')
    expect(coroa).not.toBeNull()
    expect(coroa).toHaveAttribute('aria-hidden', 'true')
  })
})
