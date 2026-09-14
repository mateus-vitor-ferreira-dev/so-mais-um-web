import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import { diaDaSemanaEMes, hora } from '../../utils/datas'
import CartaoDePartida, { type PartidaDoCartao } from './index'

const PARTIDA: PartidaDoCartao = {
  id: 'p1',
  date: new Date(2026, 8, 17, 19, 0).toISOString(),
  maxPlayers: 4,
  totalValue: '90.00',
  _count: { participations: 3 },
  court: { name: 'Quadra 2', type: 'BEACH_TENNIS', place: { name: 'Arena Sul', neighborhood: 'Centro', city: 'Lavras' } },
}

describe('CartaoDePartida (web#492)', () => {
  it('o esporte é o título, e o dia e a hora vêm logo abaixo, antes do espaço', () => {
    renderWithProviders(<CartaoDePartida partida={PARTIDA} aoAbrir={() => {}} />)

    expect(screen.getByRole('heading', { level: 3, name: 'Beach Tennis' })).toBeInTheDocument()
    expect(screen.getByText(hora(PARTIDA.date)).closest('p')).toHaveTextContent(diaDaSemanaEMes(PARTIDA.date))
    expect(screen.getByText('Arena Sul')).toBeInTheDocument()
    expect(screen.getByText('Centro, Lavras')).toBeInTheDocument()
  })

  it('as vagas, com o singular, e o valor por pessoa', () => {
    renderWithProviders(<CartaoDePartida partida={PARTIDA} aoAbrir={() => {}} />)

    expect(screen.getByText('3 / 4 confirmados')).toBeInTheDocument()
    expect(screen.getByText('1 vaga restante')).toBeInTheDocument()
    expect(screen.getByText('R$ 22,50 / pessoa')).toBeInTheDocument()
  })

  it('lotada diz lotada', () => {
    renderWithProviders(<CartaoDePartida partida={{ ...PARTIDA, _count: { participations: 4 } }} aoAbrir={() => {}} />)

    expect(screen.getByText('Lotada')).toBeInTheDocument()
  })

  it('o clique abre, e o link do mapa e o rodapé não levam o clique para o cartão', async () => {
    const aoAbrir = vi.fn()
    const noBotao = vi.fn()
    const { user } = renderWithProviders(
      <CartaoDePartida
        partida={PARTIDA}
        aoAbrir={aoAbrir}
        mapaUrl="https://maps.example/arena"
        rodape={<button type="button" onClick={(e) => { e.stopPropagation(); noBotao() }}>Entrar</button>}
      />,
    )

    await user.click(screen.getByRole('link', { name: 'Ver no mapa' }))
    await user.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(noBotao).toHaveBeenCalled()
    expect(aoAbrir).not.toHaveBeenCalled()

    await user.click(screen.getByText('Arena Sul'))
    expect(aoAbrir).toHaveBeenCalledTimes(1)
  })
})
