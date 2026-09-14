import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import { leituraDoDia } from '../../test/previsao'
import PrevisaoDosDias from './index'

describe('PrevisaoDosDias (web#476)', () => {
  it('uma linha por dia, com a previsão do dia ou a partir de quando ela aparece', () => {
    renderWithProviders(
      <PrevisaoDosDias
        carregando={false}
        erro={false}
        dias={[
          { data: '2026-09-19', leitura: leituraDoDia({ chanceDeChuva: 20 }) },
          { data: '2026-09-20', leitura: leituraDoDia({}, 'ATENCAO', ['CHUVA']) },
          { data: '2026-09-30', leitura: { alcance: 'AINDA_LONGE', disponivelEm: '2026-09-21', risco: 'NENHUM', motivos: [] } },
        ]}
      />,
    )

    expect(screen.getByText('sáb, 19/09')).toBeInTheDocument()
    expect(screen.getByText('dom, 20/09')).toBeInTheDocument()
    expect(screen.getByText('Atenção: chuva')).toBeInTheDocument()
    expect(screen.getByText('A previsão aparece a partir de 21/09')).toBeInTheDocument()
    expect(screen.getByText(/Google Maps/)).toBeInTheDocument()
  })

  it('torneio sem nada a dizer — encerrado, sem local — some', () => {
    const { container } = renderWithProviders(
      <PrevisaoDosDias
        carregando={false}
        erro={false}
        dias={[{ data: '2026-09-19', leitura: { alcance: 'PASSOU', risco: 'NENHUM', motivos: [] } }]}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('com a rota fora do ar, diz que a previsão está indisponível', () => {
    renderWithProviders(<PrevisaoDosDias carregando={false} erro />)

    expect(screen.getByText('Previsão indisponível agora.')).toBeInTheDocument()
  })
})
