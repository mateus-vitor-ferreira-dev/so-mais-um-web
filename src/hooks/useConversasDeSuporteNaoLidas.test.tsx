/**
 * O contador do Suporte no menu do admin (web#508).
 *
 * O que ele precisa provar: conta **donos**, e não mensagens; aparece em
 * qualquer tela do painel, e não só na do suporte; e anda sozinho quando o
 * evento `suporte` chega, sem ninguém recarregar a página.
 */
import { act } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Route, Routes } from 'react-router-dom'
import { renderWithProviders, screen, waitFor, within } from '../test/render'
import { AdminPanelLayout } from '../routes/shells'
import { StreamContext } from '../contexts/streamContext'
import type { OuvinteDoStream, StreamContextValue } from '../contexts/streamContext'
import type { ConversaNaCaixa } from '../types/api'

vi.mock('../services/placeRequests')
vi.mock('../services/suporte')
import * as placeRequestsService from '../services/placeRequests'
import { suporteDaEquipe } from '../services/suporte'

vi.mock('../contexts/AuthContext', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  useAuth: () => ({ user: { id: 'eu', name: 'Admin', role: 'ADMIN' }, loading: false }),
}))

const caixa = vi.mocked(suporteDaEquipe.caixa)

const conversa = (id: string, naoLidas: number): ConversaNaCaixa => ({
  id,
  dono: { id: `dono-${id}`, name: `Dono ${id}` },
  naoLidas,
  ultimaMensagemEm: '2026-09-15T12:00:00.000Z',
  ultimaMensagem: null,
})

/** Um stream de mentira: guarda os ouvintes e deixa o teste disparar o evento. */
function streamFalso() {
  const ouvintes = new Map<string, Set<OuvinteDoStream>>()
  const valor: StreamContextValue = {
    assinar: (evento, ouvinte) => {
      if (!ouvintes.has(evento)) ouvintes.set(evento, new Set())
      ouvintes.get(evento)!.add(ouvinte)
      return () => ouvintes.get(evento)!.delete(ouvinte)
    },
    aoReconectar: () => () => {},
  }
  const emitir = (evento: string, dado: unknown) => ouvintes.get(evento)?.forEach((o) => o(dado))
  return { valor, emitir }
}

function painel(stream = streamFalso()) {
  renderWithProviders(
    <StreamContext.Provider value={stream.valor}>
      <Routes>
        <Route element={<AdminPanelLayout />}>
          <Route path="/admin/dashboard" element={<p>corpo da página</p>} />
        </Route>
      </Routes>
    </StreamContext.Provider>,
    { route: '/admin/dashboard' },
  )
  return stream
}

const itemDoSuporte = () => screen.getByRole('link', { name: /Suporte/ })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(placeRequestsService.listAll).mockResolvedValue({ data: { data: [] } } as never)
})

describe('contador do suporte no menu do admin', () => {
  it('soma um por dono com mensagem não lida, e não uma por mensagem', async () => {
    // Três donos esperando: um com cinco mensagens, dois com uma. Mais dois já lidos.
    caixa.mockResolvedValue([conversa('a', 5), conversa('b', 1), conversa('c', 1), conversa('d', 0), conversa('e', 0)])
    painel()

    await waitFor(() => expect(within(itemDoSuporte()).getByText('3')).toBeInTheDocument())
  })

  it('aparece numa tela que não é a do suporte', async () => {
    caixa.mockResolvedValue([conversa('a', 2)])
    painel()

    expect(await screen.findByText('corpo da página')).toBeInTheDocument()
    await waitFor(() => expect(within(itemDoSuporte()).getByText('1')).toBeInTheDocument())
  })

  it('sem conversa esperando, não desenha contador', async () => {
    caixa.mockResolvedValue([conversa('a', 0)])
    painel()

    await waitFor(() => expect(caixa).toHaveBeenCalled())
    expect(within(itemDoSuporte()).queryByText(/\d/)).not.toBeInTheDocument()
  })

  it('outro dono escrevendo acende mais um, sem recarregar a página', async () => {
    caixa.mockResolvedValue([conversa('a', 1)])
    const stream = painel()
    await waitFor(() => expect(within(itemDoSuporte()).getByText('1')).toBeInTheDocument())

    // Chega a mensagem de um segundo dono: a api já a conta na caixa.
    caixa.mockResolvedValue([conversa('b', 1), conversa('a', 1)])
    act(() => stream.emitir('suporte', { conversaId: 'b', mensagem: { id: 'm1', daEquipe: false } }))

    await waitFor(() => expect(within(itemDoSuporte()).getByText('2')).toBeInTheDocument())
  })

  it('a resposta da equipe apaga o contador daquele dono', async () => {
    caixa.mockResolvedValue([conversa('a', 1), conversa('b', 1)])
    const stream = painel()
    await waitFor(() => expect(within(itemDoSuporte()).getByText('2')).toBeInTheDocument())

    caixa.mockResolvedValue([conversa('a', 0), conversa('b', 1)])
    act(() => stream.emitir('suporte', { conversaId: 'a', mensagem: { id: 'm2', daEquipe: true } }))

    await waitFor(() => expect(within(itemDoSuporte()).getByText('1')).toBeInTheDocument())
  })

  it('falha da api não derruba o menu', async () => {
    caixa.mockRejectedValue(new Error('rede fora'))
    painel()

    expect(await screen.findByText('corpo da página')).toBeInTheDocument()
    await waitFor(() => expect(caixa).toHaveBeenCalled())
    expect(within(itemDoSuporte()).queryByText(/\d/)).not.toBeInTheDocument()
  })
})
