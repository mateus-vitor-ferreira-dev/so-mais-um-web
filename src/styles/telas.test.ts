/**
 * As larguras de corte (web#511): um lugar só, e o tema lendo dele.
 */
import { describe, expect, it } from 'vitest'
import { ALVO_DE_TOQUE, LARGURAS, ate } from './telas'
import { darkTheme, lightTheme } from './theme'

describe('as larguras de corte', () => {
  it('são três degraus crescentes', () => {
    expect(LARGURAS.celular).toBeLessThan(LARGURAS.tablet)
    expect(LARGURAS.tablet).toBeLessThan(LARGURAS.notebook)
  })

  it('as media queries saem dos mesmos números', () => {
    expect(ate.celular).toBe(`@media (max-width: ${LARGURAS.celular}px)`)
    expect(ate.tablet).toBe(`@media (max-width: ${LARGURAS.tablet}px)`)
    expect(ate.notebook).toBe(`@media (max-width: ${LARGURAS.notebook}px)`)
  })

  it('o tema expõe os mesmos números nos dois modos', () => {
    expect(lightTheme.breakpoints).toBe(LARGURAS)
    expect(darkTheme.breakpoints).toBe(LARGURAS)
  })

  it('o tablet é o degrau em que a barra lateral vira gaveta', () => {
    // O `DashboardLayout` troca a barra pela gaveta em 768. Se o degrau mudar
    // sem a gaveta, a tabela vira cartão numa largura e a barra some em outra.
    expect(LARGURAS.tablet).toBe(768)
  })

  it('o alvo de toque tem pelo menos 44px', () => {
    expect(parseInt(ALVO_DE_TOQUE, 10)).toBeGreaterThanOrEqual(44)
  })
})
