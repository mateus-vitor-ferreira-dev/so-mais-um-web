/**
 * O sino, agora consumidor da conexão da aba (web#472).
 *
 * O que estes testes protegem:
 *
 * - **o sino continua se comportando igual**: lista o que a api devolve e põe no
 *   topo o que chega pelo evento sem nome;
 * - **o evento `suporte` nunca entra na lista** — só a notificação
 *   `SUPPORT_MESSAGE` entra;
 * - **o primeiro tipo que leva a algum lugar**: a resposta da equipe abre a
 *   conversa do dono;
 * - **a reconexão relê a lista**, porque o que chegou na queda se perdeu.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Routes, Route } from 'react-router-dom'
import { renderWithProviders, screen, waitFor } from '../../test/render'
import { criaUsuario } from '../../test/factories'
import { criaStreamFalso } from '../../test/streamFalso'
import type { Notification, UserMe } from '../../types/api'
import NotificationBell from './index'

vi.mock('../../services/notificationService')

const { sessao } = vi.hoisted(() => ({ sessao: { user: null as UserMe | null } }))

vi.mock('../../contexts/AuthContext', async original => ({
  ...(await original<typeof import('../../contexts/AuthContext')>()),
  useAuth: () => ({ user: sessao.user }),
}))

import { notificationService } from '../../services/notificationService'

const lista = vi.mocked(notificationService.list)
const marcaUma = vi.mocked(notificationService.readOne)

function notificacao(over: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    userId: 'u1',
    type: 'PLAYER_JOINED',
    title: 'Alguém entrou na sua partida',
    body: '',
    data: null,
    read: false,
    createdAt: new Date().toISOString(),
    ...over,
  }
}

function abre() {
  const stream = criaStreamFalso()
  const resultado = renderWithProviders(
    <stream.Provider>
      <NotificationBell />
      <Routes>
        <Route path="/owner/suporte" element={<p>conversa de suporte aberta</p>} />
        <Route path="*" element={null} />
      </Routes>
    </stream.Provider>,
    { route: '/owner/dashboard' },
  )
  return { ...resultado, stream }
}

beforeEach(() => {
  vi.clearAllMocks()
  sessao.user = criaUsuario({ role: 'OWNER' })
  lista.mockResolvedValue([])
  marcaUma.mockResolvedValue({} as Awaited<ReturnType<typeof notificationService.readOne>>)
})

describe('NotificationBell', () => {
  it('lista o que a api devolve, e o que chega pelo evento sem nome entra no topo', async () => {
    lista.mockResolvedValue([notificacao()])
    const { user, stream } = abre()
    await waitFor(() => expect(lista).toHaveBeenCalled())

    stream.emitir('message', notificacao({ id: 'n2', title: 'A partida lotou' }))
    await user.click(screen.getByRole('button', { name: 'Notificações' }))

    expect(await screen.findByText('A partida lotou')).toBeInTheDocument()
    expect(screen.getByText('Alguém entrou na sua partida')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('o evento suporte não entra na lista', async () => {
    const { user, stream } = abre()
    await waitFor(() => expect(lista).toHaveBeenCalled())

    stream.emitir('suporte', { conversaId: 'c1', mensagem: { id: 'm1', texto: 'resposta', daEquipe: true } })
    await user.click(screen.getByRole('button', { name: 'Notificações' }))

    expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument()
  })

  it('clicar na resposta do suporte leva o dono à conversa', async () => {
    lista.mockResolvedValue([
      notificacao({ type: 'SUPPORT_MESSAGE', title: 'A equipe do Só+1 respondeu', data: { conversaId: 'c1' } }),
    ])
    const { user } = abre()

    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    await user.click(await screen.findByText('A equipe do Só+1 respondeu'))

    expect(await screen.findByText('conversa de suporte aberta')).toBeInTheDocument()
    expect(marcaUma).toHaveBeenCalledWith('n1')
  })

  it('notificação que só informa é marcada como lida, e a tela fica onde está', async () => {
    lista.mockResolvedValue([notificacao()])
    const { user } = abre()

    await user.click(screen.getByRole('button', { name: 'Notificações' }))
    await user.click(await screen.findByText('Alguém entrou na sua partida'))

    expect(marcaUma).toHaveBeenCalledWith('n1')
    expect(screen.queryByText('conversa de suporte aberta')).not.toBeInTheDocument()
    expect(screen.getByText('Alguém entrou na sua partida')).toBeInTheDocument()
  })

  it('depois de uma reconexão, relê a lista', async () => {
    const { stream } = abre()
    await waitFor(() => expect(lista).toHaveBeenCalledTimes(1))

    stream.reconectar()

    await waitFor(() => expect(lista).toHaveBeenCalledTimes(2))
  })
})
