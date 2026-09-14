/**
 * A previsão na página da atividade (web#476).
 *
 * Um teste por alcance, porque o texto de cada um é a decisão: "a previsão por
 * hora aparece dois dias antes" é o que evita a pergunta de por que não há
 * faixa, e "Quadra coberta" é o que evita a de por que não há previsão nenhuma.
 */
import { describe, expect, it } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import { horaDoTempo, leituraDoDia, leituraPorHora } from '../../test/previsao'
import PrevisaoDoTempo from './index'

const GOOGLE = /inclui dados meteorológicos do Google Maps/

describe('PrevisaoDoTempo', () => {
  it('HORA: a faixa das horas do jogo, a frase do risco e a atribuição', () => {
    const leitura = leituraPorHora([
      horaDoTempo(18),
      horaDoTempo(19, { risco: 'ALTO', motivos: ['TEMPESTADE'], condicao: 'THUNDERSTORM', chanceDeChuva: 80 }),
    ])

    renderWithProviders(<PrevisaoDoTempo leitura={leitura} carregando={false} erro={false} />)

    expect(screen.getByText('Risco de tempestade às 19h')).toBeInTheDocument()
    expect(screen.getByLabelText('Previsão do tempo por hora')).toBeInTheDocument()
    expect(screen.getByLabelText(/19h: 24°, 80% de chuva, risco de tempestade/)).toBeInTheDocument()
    expect(screen.getByText(GOOGLE)).toBeInTheDocument()
  })

  it('HORA sem risco: só a faixa, sem frase', () => {
    renderWithProviders(
      <PrevisaoDoTempo leitura={leituraPorHora([horaDoTempo(18)])} carregando={false} erro={false} />,
    )

    expect(screen.getByLabelText('Previsão do tempo por hora')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('DIA: a previsão do dia, a atenção, e quando a por hora aparece', () => {
    renderWithProviders(
      <PrevisaoDoTempo leitura={leituraDoDia({}, 'ATENCAO', ['CHUVA'])} carregando={false} erro={false} />,
    )

    expect(screen.getByText(/Previsão do dia: 24° \/ 15°, 70% de chuva/)).toBeInTheDocument()
    expect(screen.getByText('Atenção: chuva no dia')).toBeInTheDocument()
    expect(screen.getByText('A previsão por hora aparece dois dias antes.')).toBeInTheDocument()
    expect(screen.getByText(GOOGLE)).toBeInTheDocument()
  })

  it('AINDA_LONGE: a partir de quando', () => {
    renderWithProviders(
      <PrevisaoDoTempo
        leitura={{ alcance: 'AINDA_LONGE', disponivelEm: '2026-09-21', risco: 'NENHUM', motivos: [] }}
        carregando={false}
        erro={false}
      />,
    )

    expect(screen.getByText('A previsão aparece a partir de 21/09.')).toBeInTheDocument()
    expect(screen.queryByText(GOOGLE)).not.toBeInTheDocument()
  })

  it('COBERTA: diz que é coberta', () => {
    renderWithProviders(
      <PrevisaoDoTempo leitura={{ alcance: 'COBERTA', risco: 'NENHUM', motivos: [] }} carregando={false} erro={false} />,
    )

    expect(screen.getByText('Quadra coberta.')).toBeInTheDocument()
  })

  it.each(['SEM_LOCAL', 'PASSOU'] as const)('%s: não mostra nada', (alcance) => {
    const { container } = renderWithProviders(
      <PrevisaoDoTempo leitura={{ alcance, risco: 'NENHUM', motivos: [] }} carregando={false} erro={false} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('erro: previsão indisponível, sem vermelho de erro', () => {
    renderWithProviders(<PrevisaoDoTempo carregando={false} erro />)

    expect(screen.getByText('Previsão indisponível agora.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
