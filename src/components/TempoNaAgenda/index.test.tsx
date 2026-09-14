/**
 * A agenda do dia do dono, com o tempo (web#477).
 *
 * O teste que carrega o arquivo é o do 503: a previsão é um extra, e com a
 * Google fora do ar — ou a chave da Weather API sem configurar — a agenda
 * precisa continuar ali, igual a de hoje.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { fireEvent, renderWithProviders, screen, within } from '../../test/render'
import type { Court, HoraDoTempo, LeituraDoTempo, PrevisaoDoEspaco } from '../../types/api'
import TempoNaAgenda from './index'

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: { id: 'dono-1', role: 'OWNER' } }),
}))
vi.mock('../../services/places')
vi.mock('../../services/courts')
vi.mock('../../services/previsao')

import * as placesService from '../../services/places'
import * as courtsService from '../../services/courts'
import { previsaoService } from '../../services/previsao'

const quadra = (id: string, name: string, coberta: boolean | null): Court => ({
  id,
  name,
  type: 'SOCIETY',
  status: 'OPEN',
  pricePerHour: null,
  coberta,
  placeId: 'place-1',
  createdAt: '',
  updatedAt: '',
})

const hora = (inicio: string, fim: string, extra: Partial<HoraDoTempo> = {}): HoraDoTempo => ({
  inicio,
  fim,
  temperatura: 24,
  sensacao: 24,
  chanceDeChuva: 10,
  chuvaMm: 0,
  chanceDeTempestade: 0,
  vento: 5,
  rajada: 10,
  uv: 2,
  condicao: 'CLEAR',
  risco: 'NENHUM',
  motivos: [],
  ...extra,
})

const HORAS: HoraDoTempo[] = [
  hora('2026-09-14T21:00:00.000Z', '2026-09-14T22:00:00.000Z'),
  hora('2026-09-14T22:00:00.000Z', '2026-09-14T23:00:00.000Z', {
    chanceDeChuva: 80,
    condicao: 'RAIN',
    risco: 'ALTO',
    motivos: ['CHUVA'],
  }),
]

function previsao(leituras: Record<string, LeituraDoTempo>): PrevisaoDoEspaco {
  return {
    data: '2026-09-14',
    quadras: Object.entries(leituras).map(([courtId, leitura]) => ({
      courtId,
      nome: courtId,
      tipo: 'SOCIETY',
      coberta: null,
      leitura,
    })),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(placesService.list).mockResolvedValue({
    data: { success: true, data: [{ id: 'place-1', name: 'Arena Um', ownerId: 'dono-1' }] },
  } as never)
  vi.mocked(courtsService.getCourtsByPlace).mockResolvedValue({
    success: true,
    data: [quadra('q1', 'Society 1', false), quadra('q2', 'Ginásio', true)],
  })
  vi.mocked(courtsService.getAgendaDaQuadra).mockImplementation(async (courtId) => ({
    success: true,
    data: {
      courtId,
      de: '',
      ate: '',
      ocupacoes:
        courtId === 'q1'
          ? [{ tipo: 'PARTIDA', id: 'p1', inicio: '2026-09-14T22:00:00.000Z', fim: '2026-09-14T23:00:00.000Z', descricao: 'partida de Ana' }]
          : [],
    },
  }))
})

describe('TempoNaAgenda', () => {
  it('mostra a faixa por hora na descoberta e destaca a marcação em risco alto, com o motivo', async () => {
    vi.mocked(previsaoService.doEspaco).mockResolvedValue(
      previsao({
        q1: { alcance: 'HORA', risco: 'ALTO', motivos: ['CHUVA'], horas: HORAS },
        q2: { alcance: 'COBERTA', risco: 'NENHUM', motivos: [] },
      }),
    )

    renderWithProviders(<TempoNaAgenda />)

    expect(await screen.findByLabelText('Previsão do tempo por hora')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Previsão do tempo por hora')).toHaveLength(1)
    expect(await screen.findByText('Risco de chuva')).toBeInTheDocument()
    expect(screen.getByText('partida de Ana')).toBeInTheDocument()
    expect(screen.getByText('Ginásio · coberta')).toBeInTheDocument()
    expect(screen.getByText(/inclui dados meteorológicos do Google Maps/)).toBeInTheDocument()
  })

  it('com a previsão respondendo 503, avisa e a agenda continua', async () => {
    vi.mocked(previsaoService.doEspaco).mockRejectedValue({ response: { status: 503 } })

    renderWithProviders(<TempoNaAgenda />)

    expect(await screen.findByText(/Previsão do tempo indisponível agora/)).toBeInTheDocument()
    expect(await screen.findByText('partida de Ana')).toBeInTheDocument()
    expect(screen.queryByLabelText('Previsão do tempo por hora')).not.toBeInTheDocument()
    expect(screen.queryByText(/Google Maps/)).not.toBeInTheDocument()
  })

  it('dia além do alcance por hora: sem faixa, e a agenda como hoje', async () => {
    vi.mocked(previsaoService.doEspaco).mockResolvedValue(
      previsao({
        q1: { alcance: 'DIA', risco: 'ATENCAO', motivos: ['CHUVA'] },
        q2: { alcance: 'COBERTA', risco: 'NENHUM', motivos: [] },
      }),
    )

    renderWithProviders(<TempoNaAgenda />)

    expect(await screen.findByText('A previsão hora a hora aparece para hoje e amanhã.')).toBeInTheDocument()
    expect(await screen.findByText('partida de Ana')).toBeInTheDocument()
    expect(screen.queryByLabelText('Previsão do tempo por hora')).not.toBeInTheDocument()
    expect(screen.queryByText(/Risco de/)).not.toBeInTheDocument()
  })

  it('a agenda que falha fala do painel, e não da criação de partida (web#491)', async () => {
    vi.mocked(previsaoService.doEspaco).mockResolvedValue(previsao({}))
    vi.mocked(courtsService.getAgendaDaQuadra).mockRejectedValue(new Error('fora do ar'))

    renderWithProviders(<TempoNaAgenda />)

    expect((await screen.findAllByText(/Recarregue a página para tentar de novo/)).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Você pode criar assim mesmo/)).not.toBeInTheDocument()
  })

  it('espaço sem coordenada diz por que não há previsão', async () => {
    vi.mocked(previsaoService.doEspaco).mockResolvedValue(
      previsao({
        q1: { alcance: 'SEM_LOCAL', risco: 'NENHUM', motivos: [] },
        q2: { alcance: 'SEM_LOCAL', risco: 'NENHUM', motivos: [] },
      }),
    )

    renderWithProviders(<TempoNaAgenda />)

    expect(await screen.findByText(/não foi localizado no mapa/)).toBeInTheDocument()
  })

  it('pede a previsão do dia escolhido', async () => {
    vi.mocked(previsaoService.doEspaco).mockResolvedValue(previsao({}))

    renderWithProviders(<TempoNaAgenda />)

    const secao = await screen.findByRole('region', { name: 'A agenda do dia, com o tempo' })
    // `user.type` não digita em `<input type="date">` no jsdom; o `change` é o que o navegador dispara.
    fireEvent.change(within(secao).getByLabelText('Dia'), { target: { value: '2026-09-20' } })

    await vi.waitFor(() => expect(previsaoService.doEspaco).toHaveBeenLastCalledWith('place-1', '2026-09-20'))
  })

  it('dono sem espaço não vê a seção', async () => {
    vi.mocked(placesService.list).mockResolvedValue({ data: { success: true, data: [] } } as never)

    const { container } = renderWithProviders(<TempoNaAgenda />)

    await vi.waitFor(() => expect(placesService.list).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
    expect(previsaoService.doEspaco).not.toHaveBeenCalled()
  })
})
