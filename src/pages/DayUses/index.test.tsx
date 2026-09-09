import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import DayUses from './index'

const auth = vi.hoisted(() => ({ user: { address: { city: 'Lavras' } as { city: string | null } } }))

vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => auth,
}))
vi.mock('../../hooks/useSports', () => ({
  useSports: () => ({ sports: [{ id: 'BEACH_TENNIS', label: 'Beach tennis' }] }),
}))
vi.mock('../../components/DayUsesDoDia', () => ({
  default: ({ city, courtType }: { city?: string; courtType?: string }) => (
    <div data-testid="lista-day-uses">{city}/{courtType}</div>
  ),
}))

describe('DayUses', () => {
  beforeEach(() => {
    auth.user = { address: { city: 'Lavras' } }
    window.history.pushState({}, '', '/day-uses')
  })

  it('nasce filtrada pela cidade do jogador', () => {
    renderWithProviders(<DayUses />)

    expect(screen.getByTestId('lista-day-uses')).toHaveTextContent('Lavras/')
  })

  it('sem cidade não consulta a lista inteira até a pessoa delimitar a busca', () => {
    auth.user = { address: { city: null } }
    renderWithProviders(<DayUses />)

    expect(screen.getByText(/Informe uma cidade ou modalidade/)).toBeInTheDocument()
    expect(screen.queryByTestId('lista-day-uses')).not.toBeInTheDocument()
  })
})
