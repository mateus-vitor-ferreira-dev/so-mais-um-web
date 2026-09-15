/**
 * O cadastro de dono pelo convite, com a cortesia dentro (web#503, api#597).
 *
 * Quem chega pelo e-mail da cortesia precisa ver que ela vem junto antes de
 * criar a conta — e o convite comum continua dizendo o que dizia.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import * as authService from '../../services/auth'
import OwnerAccess from './index'

vi.mock('../../services/auth')
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<typeof import('../../contexts/AuthContext')>()),
  useAuth: () => ({ login: vi.fn(), registerOwner: vi.fn(), logout: vi.fn() }),
}))

const auth = vi.mocked(authService)

const monta = () =>
  renderWithProviders(<OwnerAccess />, { route: '/seja-parceiro?convite=abc', path: '/seja-parceiro' })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('o convite de dono', () => {
  it('com cortesia, diz quantos dias e o plano, contados do cadastro', async () => {
    auth.verifyInvite.mockResolvedValue({
      success: true,
      data: { email: 'nova@arena.com', expiresAt: '2026-09-22T00:00:00.000Z', cortesia: { planoNome: 'Pro', dias: 30 } },
    } as Awaited<ReturnType<typeof authService.verifyInvite>>)
    monta()

    expect(await screen.findByText(/a conta já nasce com 30 dias de cortesia no plano Pro, contados a partir do cadastro/))
      .toBeInTheDocument()
    expect(auth.verifyInvite).toHaveBeenCalledWith('abc')
  })

  it('sem cortesia, ou na api antiga, continua como era', async () => {
    auth.verifyInvite.mockResolvedValue({
      success: true,
      data: { email: 'nova@arena.com', expiresAt: '2026-09-22T00:00:00.000Z' },
    } as Awaited<ReturnType<typeof authService.verifyInvite>>)
    monta()

    expect(await screen.findByText('Convite válido — bem-vindo ao portal de parceiros')).toBeInTheDocument()
    expect(screen.queryByText(/cortesia/)).not.toBeInTheDocument()
  })
})
