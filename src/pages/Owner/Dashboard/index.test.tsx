import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../../../test/render'
import type { Plan, SubscriptionStatus } from '../../../types/api'
import OwnerDashboard from './index'

vi.mock('../../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ user: { role: 'OWNER' } }),
}))

const navigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const real = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return { ...real, useNavigate: () => navigate }
})

vi.mock('../../../services/subscriptionService')
vi.mock('../../../services/ownerService')
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }))

const temFuncionalidade = vi.fn()
vi.mock('../../../hooks/useSubscription', () => ({ useSubscription: () => ({ temFuncionalidade }) }))

import { subscriptionService } from '../../../services/subscriptionService'
import { ownerService } from '../../../services/ownerService'

const getStatus = vi.mocked(subscriptionService.getStatus)
const getStats = vi.mocked(ownerService.getStats)

const pro: Plan = {
  id: 'pro',
  nome: 'Só+1 Pro',
  precoCentavos: 7990, precoNoCartaoCentavos: 8411,
  funcionalidades: ['ESTATISTICAS'],
}

/** Quem ainda não assinou. É o estado que a #404 encontrou sem teste nenhum. */
function semPlano(usage: { quadras: number; estabelecimentos: number }): SubscriptionStatus {
  return { status: 'inactive', currentPeriodEnd: null, plan: null, usage }
}

beforeEach(() => {
  vi.clearAllMocks()
  // Sem assinatura, `getStats` responde 403 e a tela cai no `null`. É o caminho
  // real de quem vê os próximos passos — e a razão de o estado dos passos sair
  // do `usage`, e não daqui.
  getStats.mockResolvedValue(null as never)
  temFuncionalidade.mockReturnValue(false)
})

describe('Dashboard do dono, sem assinatura (#404)', () => {
  it('mostra os próximos passos no lugar da caixa que só apontava para /owner/plans', async () => {
    getStatus.mockResolvedValue(semPlano({ quadras: 0, estabelecimentos: 0 }))
    renderWithProviders(<OwnerDashboard />)

    expect(await screen.findByText('Próximos passos')).toBeInTheDocument()

    // O que a issue pediu para sumir é o CARD "Escolha seu plano" — um título e
    // uma frase apontando para a tela de planos, ao lado de um botão que já
    // leva lá. O texto continua existindo, mas como o terceiro passo da lista,
    // que é outra coisa: ele tem um lugar na ordem e um estado.
    expect(screen.queryByRole('heading', { name: 'Escolha seu plano' })).not.toBeInTheDocument()
    expect(
      screen.queryByText('Compare preços e limites para escolher o plano que acompanha o seu negócio.'),
    ).not.toBeInTheDocument()

    for (const passo of ['Cadastre seu espaço', 'Cadastre uma quadra', 'Escolha seu plano']) {
      expect(screen.getByRole('button', { name: new RegExp(passo) })).toBeInTheDocument()
    }
  })

  it('nada cadastrado deixa os três passos pendentes', async () => {
    getStatus.mockResolvedValue(semPlano({ quadras: 0, estabelecimentos: 0 }))
    renderWithProviders(<OwnerDashboard />)

    const espaco = await screen.findByRole('button', { name: /Cadastre seu espaço/ })
    expect(espaco.closest('li')).toHaveAttribute('data-feito', 'false')
    expect(
      screen.getByRole('button', { name: /Cadastre uma quadra/ }).closest('li'),
    ).toHaveAttribute('data-feito', 'false')
  })

  it('o que já existe aparece feito, e diz quantos são', async () => {
    getStatus.mockResolvedValue(semPlano({ quadras: 3, estabelecimentos: 1 }))
    renderWithProviders(<OwnerDashboard />)

    const espaco = await screen.findByRole('button', { name: /Cadastre seu espaço/ })
    expect(espaco.closest('li')).toHaveAttribute('data-feito', 'true')
    expect(espaco).toHaveTextContent('1 espaço cadastrado.')

    const quadra = screen.getByRole('button', { name: /Cadastre uma quadra/ })
    expect(quadra.closest('li')).toHaveAttribute('data-feito', 'true')
    expect(quadra).toHaveTextContent('3 quadras cadastradas.')

    // O terceiro nunca chega marcado: este card só existe sem assinatura.
    expect(
      screen.getByRole('button', { name: /Escolha seu plano/ }).closest('li'),
    ).toHaveAttribute('data-feito', 'false')
  })

  it('o estado dos passos vem do usage, e não das estatísticas que o 403 zera', async () => {
    getStatus.mockResolvedValue(semPlano({ quadras: 2, estabelecimentos: 1 }))
    getStats.mockRejectedValue(new Error('403'))
    renderWithProviders(<OwnerDashboard />)

    const espaco = await screen.findByRole('button', { name: /Cadastre seu espaço/ })
    expect(espaco.closest('li')).toHaveAttribute('data-feito', 'true')
  })

  it('cada passo leva à tela onde ele se resolve', async () => {
    getStatus.mockResolvedValue(semPlano({ quadras: 0, estabelecimentos: 0 }))
    const { user } = renderWithProviders(<OwnerDashboard />)

    await user.click(await screen.findByRole('button', { name: /Cadastre seu espaço/ }))
    expect(navigate).toHaveBeenCalledWith('/owner/places')

    // A quadra também: `places/:placeId/courts` exige o id do espaço, que o
    // dashboard não tem — a lista de espaços é o caminho real.
    await user.click(screen.getByRole('button', { name: /Cadastre uma quadra/ }))
    expect(navigate).toHaveBeenCalledWith('/owner/places')

    await user.click(screen.getByRole('button', { name: /Escolha seu plano/ }))
    expect(navigate).toHaveBeenCalledWith('/owner/plans')
  })

  it('o caminho para assinar continua a um clique na coluna da esquerda', async () => {
    getStatus.mockResolvedValue(semPlano({ quadras: 0, estabelecimentos: 0 }))
    const { user } = renderWithProviders(<OwnerDashboard />)

    await user.click(await screen.findByRole('button', { name: /Ver planos e assinar/ }))
    expect(navigate).toHaveBeenCalledWith('/owner/plans')
  })
})

describe('Dashboard do dono, com assinatura (#404)', () => {
  it('continua mostrando o que o plano abre, e não os próximos passos', async () => {
    getStatus.mockResolvedValue({
      status: 'active',
      currentPeriodEnd: '2026-10-01T12:00:00.000Z',
      plan: pro,
      usage: { quadras: 6, estabelecimentos: 2 },
    })
    temFuncionalidade.mockReturnValue(true)
    getStats.mockResolvedValue({
      totalPlaces: 2,
      totalCourts: 6,
      activeEvents: 4,
      pendingRequests: 1,
    } as never)

    renderWithProviders(<OwnerDashboard />)

    expect(await screen.findByText('O que seu plano abre')).toBeInTheDocument()
    expect(screen.queryByText('Próximos passos')).not.toBeInTheDocument()

    await waitFor(() => expect(screen.getByText('Só+1 Pro')).toBeInTheDocument())
  })
})
