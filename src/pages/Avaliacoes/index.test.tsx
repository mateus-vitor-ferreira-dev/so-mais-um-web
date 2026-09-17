import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/render'
import { playerService } from '../../services/playerService'
import Avaliacoes from './index'
import type { ApiEnvelope, Review, UserStats } from '../../types/api'

vi.mock('../../services/playerService')
const servico = vi.mocked(playerService)

const auth = vi.hoisted(() => ({ estado: { user: { id: 'eu', name: 'Mateus' } } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

const recebida = {
  id: 'r1', stars: 4, tag: 'FAIR_PLAY', comment: null, matchId: 'm1', reviewerId: 'joao', reviewedId: 'eu',
  reviewer: { id: 'joao', name: 'João Henrique', avatarUrl: null },
  createdAt: '2026-09-15T12:00:00Z',
} as Review

beforeEach(() => {
  vi.clearAllMocks()
  servico.getUserReviews.mockResolvedValue({
    success: true,
    data: { summary: { averageStars: 4, totalReviews: 1, totalPartidas: 3, tags: [] }, reviews: [recebida] },
  } as ApiEnvelope<{ summary: UserStats; reviews: Review[] }>)
  servico.getUserReviewsGiven.mockResolvedValue({ success: true, data: [] } as ApiEnvelope<Review[]>)
})

const monta = () => renderWithProviders(
  <Routes>
    <Route path="/avaliacoes" element={<Avaliacoes />} />
    <Route path="/jogador/:userId" element={<p>perfil público</p>} />
  </Routes>,
  { route: '/avaliacoes' },
)

describe('Avaliacoes', () => {
  it('as estrelas são ícone, com uma frase só para o leitor de tela (#511)', async () => {
    monta()
    expect(await screen.findByRole('img', { name: '4 estrelas' })).toBeInTheDocument()
    expect(screen.queryByText(/⭐/)).not.toBeInTheDocument()
  })

  it('o nome de quem avaliou leva ao perfil, e o teclado chega nele (#511)', async () => {
    const { user } = monta()
    const nome = await screen.findByRole('button', { name: 'João Henrique' })
    nome.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('perfil público')).toBeInTheDocument()
  })
})
