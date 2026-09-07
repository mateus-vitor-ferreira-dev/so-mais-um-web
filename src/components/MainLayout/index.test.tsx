/**
 * As entradas a mais do menu do jogador (api#451).
 *
 * O que este arquivo prende é a **decisão B** da api#451: o professor continua
 * `PLAYER` e ganha uma área a mais, e quem decide isso é o **vínculo**, não o
 * `user.role`. É uma distinção fácil de desfazer sem perceber — basta alguém
 * "simplificar" a função para receber o papel de novo, como ela era antes —, e
 * o efeito seria mudo: o professor perde a entrada e não há erro nenhum.
 *
 * A regra do avesso importa igual: a entrada **não** aparece para quem não tem
 * vínculo. Professor é papel de poucos, e anunciar uma área que a pessoa não
 * alcança sozinha — só o dono de um espaço a concede — é pior que não anunciar.
 */
import { describe, it, expect, vi } from 'vitest'
import { renderWithProviders, screen } from '../../test/render'
import MainLayout from './index'

const auth = vi.hoisted(() => ({ estado: { user: null as Record<string, unknown> | null, loading: false } }))
vi.mock('../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))
vi.mock('../NotificationBell', () => ({ default: () => null }))

const jogador = (extra: Record<string, unknown> = {}) => ({
  id: 'u1', name: 'Mateus', email: 'm@m.com', role: 'PLAYER', ...extra,
})

const menu = () => screen.getAllByRole('link').map((l) => l.textContent?.trim())

describe('entradas a mais do menu', () => {
  it('quem tem vínculo de professor vê "Minhas aulas"', () => {
    auth.estado = {
      user: jogador({ vinculos: { professorEm: [{ id: 'p1', name: 'Arena Sul' }] } }),
      loading: false,
    }
    renderWithProviders(<MainLayout />)

    expect(screen.getByRole('link', { name: /Minhas aulas/ })).toHaveAttribute('href', '/professor')
  })

  it('quem não tem vínculo não vê — mesmo sendo PLAYER como o professor', () => {
    auth.estado = { user: jogador(), loading: false }
    renderWithProviders(<MainLayout />)

    expect(screen.queryByRole('link', { name: /Minhas aulas/ })).not.toBeInTheDocument()
  })

  it('vínculo vazio conta como não ter — lista vazia não é vínculo', () => {
    auth.estado = { user: jogador({ vinculos: { professorEm: [] } }), loading: false }
    renderWithProviders(<MainLayout />)

    expect(screen.queryByRole('link', { name: /Minhas aulas/ })).not.toBeInTheDocument()
  })

  it('o papel continua decidindo os painéis, e o vínculo some junto do professor', () => {
    auth.estado = { user: jogador({ role: 'OWNER' }), loading: false }
    renderWithProviders(<MainLayout />)

    expect(screen.getByRole('link', { name: /Painel Owner/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Painel Admin/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Minhas aulas/ })).not.toBeInTheDocument()
  })

  it('os dois convivem: dono que também dá aula vê as duas entradas', () => {
    // A colisão que a #451 chamou de dolorosa — PROFESSOR × OWNER — e que a
    // decisão B resolve justamente por não passar pelo `role`.
    auth.estado = {
      user: jogador({ role: 'OWNER', vinculos: { professorEm: [{ id: 'p1', name: 'Arena Sul' }] } }),
      loading: false,
    }
    renderWithProviders(<MainLayout />)

    expect(screen.getByRole('link', { name: /Painel Owner/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Minhas aulas/ })).toBeInTheDocument()
  })

  it('admin vê os dois painéis, e o menu do jogador continua inteiro', () => {
    auth.estado = { user: jogador({ role: 'ADMIN' }), loading: false }
    renderWithProviders(<MainLayout />)

    expect(screen.getByRole('link', { name: /Painel Admin/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Painel Owner/ })).toBeInTheDocument()
    expect(menu()).toEqual(expect.arrayContaining([expect.stringContaining('Início')]))
  })
})
