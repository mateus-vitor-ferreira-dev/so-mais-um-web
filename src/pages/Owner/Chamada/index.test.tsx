import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../../test/render'
import { aulasService } from '../../../services/aulas'
import * as placesService from '../../../services/places'
import { turmasService } from '../../../services/turmas'
import OwnerChamada from './index'
import type { AxiosResponse } from 'axios'
import type { ApiEnvelope, Place, Turma } from '../../../types/api'

vi.mock('../../../services/aulas')
vi.mock('../../../services/places')
vi.mock('../../../services/turmas')
const servico = vi.mocked(aulasService)

const auth = vi.hoisted(() => ({ estado: { user: { id: 'dono', role: 'OWNER' } } }))
vi.mock('../../../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))
const aula = { id: 'a1', turmaId: 't1', courtId: 'q1', inicio: '2026-09-02T15:00:00Z', fim: '2026-09-02T16:00:00Z', status: 'AGENDADA' as const }

const monta = () => renderWithProviders(<OwnerChamada />, { route: '/owner/turmas/t1/chamada?placeId=p1', path: '/owner/turmas/:turmaId/chamada' })

beforeEach(() => {
  vi.clearAllMocks()
  servico.listar.mockResolvedValue([aula])
  servico.chamada.mockResolvedValue({ aula, alunos: [
    { matriculaId: 'm1', nome: 'Ana', temConta: false, presente: null },
    { matriculaId: 'm2', nome: 'Beto', temConta: true, presente: false },
  ] })
  servico.registrar.mockResolvedValue({ aula: { ...aula, status: 'DADA' }, alunos: [] })
})

describe('OwnerChamada', () => {
  it('chega à aula pela lista da turma, e não pela agenda da quadra', async () => {
    const { user } = monta()
    await user.click(await screen.findByRole('button', { name: 'Abrir chamada' }))
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(servico.listar).toHaveBeenCalledWith('p1', 't1', expect.any(String), expect.any(String))
  })

  it('distingue não chamado de faltou', async () => {
    const { user } = monta(); await user.click(await screen.findByRole('button', { name: 'Abrir chamada' }))
    expect(await screen.findByText(/não chamado/i)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Faltou', checked: true })).toBeInTheDocument()
  })

  it('salva só as marcações afirmadas e não mostra temConta', async () => {
    const { user } = monta(); await user.click(await screen.findByRole('button', { name: 'Abrir chamada' }))
    await user.click(await screen.findAllByRole('radio', { name: 'Veio' }).then(itens => itens[0]))
    await user.click(screen.getByRole('button', { name: 'Salvar chamada' }))
    await waitFor(() => expect(servico.registrar).toHaveBeenCalledWith('p1', 'a1', [
      { matriculaId: 'm1', presente: true }, { matriculaId: 'm2', presente: false },
    ]))
    expect(screen.queryByText(/tem conta/i)).not.toBeInTheDocument()
  })

  it('aula dada continua alcançável para correção', async () => {
    servico.listar.mockResolvedValue([{ ...aula, status: 'DADA' }])
    monta(); expect(await screen.findByRole('button', { name: 'Corrigir chamada' })).toBeInTheDocument()
  })

  it('sem placeId no endereço, acha o espaço da turma entre os do dono (web#520)', async () => {
    vi.mocked(placesService).list.mockResolvedValue({
      data: { success: true, data: [
        { id: 'p0', name: 'Outro espaço', ownerId: 'dono' },
        { id: 'p1', name: 'Espaço da turma', ownerId: 'dono' },
      ] as Place[] },
    } as AxiosResponse<ApiEnvelope<Place[]>>)
    vi.mocked(turmasService).listar.mockImplementation(async (placeId: string) =>
      (placeId === 'p1' ? [{ id: 't1' }] : []) as Turma[])

    renderWithProviders(<OwnerChamada />, { route: '/owner/turmas/t1/chamada', path: '/owner/turmas/:turmaId/chamada' })

    expect(await screen.findByRole('button', { name: 'Abrir chamada' })).toBeInTheDocument()
    expect(servico.listar).toHaveBeenCalledWith('p1', 't1', expect.any(String), expect.any(String))
  })
})
