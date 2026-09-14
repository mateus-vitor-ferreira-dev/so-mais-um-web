import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import { horaDoTempo, leituraDoDia, leituraPorHora } from '../../test/previsao'
import SeloDoTempo from './index'

describe('SeloDoTempo (web#476)', () => {
  it('por hora: a temperatura da primeira hora e o risco', () => {
    const leitura = leituraPorHora([
      horaDoTempo(9, { temperatura: 21.4 }),
      horaDoTempo(10, { risco: 'ALTO', motivos: ['VENTO'] }),
    ])

    renderWithProviders(<SeloDoTempo leitura={leitura} />)

    expect(screen.getByText('21°')).toBeInTheDocument()
    expect(screen.getByText('Risco: vento forte')).toBeInTheDocument()
  })

  it('do dia: a máxima e a mínima', () => {
    renderWithProviders(<SeloDoTempo leitura={leituraDoDia()} />)

    expect(screen.getByText('24° / 15°')).toBeInTheDocument()
    expect(screen.queryByText(/Risco|Atenção/)).not.toBeInTheDocument()
  })

  it('só o risco, no jogo da chave', () => {
    renderWithProviders(<SeloDoTempo leitura={leituraDoDia({}, 'ATENCAO', ['CHUVA'])} soRisco />)

    expect(screen.getByText('Atenção: chuva')).toBeInTheDocument()
    expect(screen.queryByText('24° / 15°')).not.toBeInTheDocument()
  })

  it('sem leitura, coberta ou longe demais, não aparece', () => {
    const { container } = renderWithProviders(
      <>
        <SeloDoTempo />
        <SeloDoTempo leitura={{ alcance: 'COBERTA', risco: 'NENHUM', motivos: [] }} />
        <SeloDoTempo leitura={{ alcance: 'AINDA_LONGE', disponivelEm: '2026-10-01', risco: 'NENHUM', motivos: [] }} />
      </>,
    )

    expect(container).toBeEmptyDOMElement()
  })
})
