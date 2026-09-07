/**
 * O que a #356 prende.
 *
 * O defeito não era o número errado: era o número **ausente** em toda tela que
 * não fosse a de solicitações. Quem entrava pela Visão Geral via o item
 * "Solicitações" limpo, como se não houvesse nada represado, e o contador só
 * aparecia depois de clicar — avisando quem já tinha ido olhar.
 *
 * Por isso o teste que carrega este arquivo renderiza o painel numa rota que
 * **não** é a de solicitações. Um teste montado em `/admin/requests` passaria
 * com o código velho e não protegeria nada.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor } from '../test/render'
import { AdminPanelLayout, OwnerPanelLayout } from '../routes/shells'
import { Routes, Route } from 'react-router-dom'

vi.mock('../services/placeRequests')
import * as placeRequestsService from '../services/placeRequests'

const auth = vi.hoisted(() => ({ estado: { user: { id: 'eu', name: 'Admin', role: 'ADMIN' }, loading: false } }))
vi.mock('../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => auth.estado,
}))

// O menu do owner consulta o plano; aqui ele não é o objeto do teste.
vi.mock('../hooks/useSubscription', () => ({
  useSubscription: () => ({ temFuncionalidade: () => true, loading: false }),
}))

const servico = vi.mocked(placeRequestsService)

/** Resposta do axios como o serviço a devolve: `res.data.data`. */
function comPendentes(quantidade: number) {
  const lista = Array.from({ length: quantidade }, (_, i) => ({ id: `s${i}`, status: 'PENDING' }))
  return Promise.resolve({ data: { data: lista } }) as never
}

beforeEach(() => {
  vi.clearAllMocks()
  servico.listAll.mockReturnValue(comPendentes(3))
  servico.listMine.mockReturnValue(comPendentes(2))
})

function painel(Layout: () => React.ReactElement, rota: string) {
  return renderWithProviders(
    <Routes>
      <Route element={<Layout />}>
        <Route path={rota} element={<p>corpo da página</p>} />
      </Route>
    </Routes>,
    { route: rota },
  )
}

describe('contador de solicitações no menu', () => {
  it('aparece no painel admin numa tela que não é a de solicitações', async () => {
    painel(AdminPanelLayout, '/admin/dashboard')

    expect(await screen.findByText('3')).toBeInTheDocument()
    expect(servico.listAll).toHaveBeenCalledWith('PENDING')
  })

  it('aparece no painel do owner numa tela que não é a de solicitações', async () => {
    auth.estado = { user: { id: 'eu', name: 'Dono', role: 'OWNER' }, loading: false }
    painel(OwnerPanelLayout, '/owner/dashboard')

    expect(await screen.findByText('2')).toBeInTheDocument()
    expect(servico.listMine).toHaveBeenCalledWith('PENDING')
  })

  it('não desenha nada quando não há pendências', async () => {
    servico.listAll.mockReturnValue(comPendentes(0))
    auth.estado = { user: { id: 'eu', name: 'Admin', role: 'ADMIN' }, loading: false }
    painel(AdminPanelLayout, '/admin/dashboard')

    expect(await screen.findByText('Solicitações')).toBeInTheDocument()
    // Zero é fila vazia, e fila vazia não merece um selo dizendo "0".
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('falha da API não derruba o menu, e não inventa contador', async () => {
    servico.listAll.mockRejectedValue(new Error('rede fora'))
    auth.estado = { user: { id: 'eu', name: 'Admin', role: 'ADMIN' }, loading: false }
    painel(AdminPanelLayout, '/admin/dashboard')

    // O menu é moldura: um erro nele não pode custar a tela que a pessoa abriu.
    expect(await screen.findByText('corpo da página')).toBeInTheDocument()
    expect(screen.getByText('Solicitações')).toBeInTheDocument()
    await waitFor(() => expect(servico.listAll).toHaveBeenCalled())
  })
})
