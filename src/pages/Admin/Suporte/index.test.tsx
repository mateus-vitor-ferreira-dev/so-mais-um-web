/**
 * A caixa do suporte, do lado da equipe (web#473, épico api#570).
 *
 * O que estes testes protegem, além de a tela abrir:
 *
 * - **a caixa se atualiza sem recarregar** — toda mensagem nova muda a ordem e a
 *   contagem, e o evento `suporte` é a deixa para reler;
 * - **a conversa aberta só recebe o que é dela** — o evento chega de todas as
 *   conversas, e mensagem de outro dono não pode aparecer nesta;
 * - **quem responde sabe com quem fala e quem já falou**: o dono com plano e
 *   situação, e cada resposta com o nome do admin;
 * - **abrir a conversa a marca como lida**, atualiza a caixa e apaga o aviso do
 *   sino desta aba.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../../test/render'
import { criaUsuario } from '../../../test/factories'
import { criaStreamFalso } from '../../../test/streamFalso'
import type { ConversaNaCaixa, ConversaParaEquipe, MensagemDeSuporte, UserMe } from '../../../types/api'
import AdminSuporte from './index'

vi.mock('../../../services/suporte')

const { sessao } = vi.hoisted(() => ({ sessao: { user: null as UserMe | null } }))

vi.mock('../../../contexts/AuthContext', async original => ({
  ...(await original<typeof import('../../../contexts/AuthContext')>()),
  useAuth: () => ({ user: sessao.user }),
}))

import { suporteDaEquipe } from '../../../services/suporte'

const buscaCaixa = vi.mocked(suporteDaEquipe.caixa)
const buscaConversa = vi.mocked(suporteDaEquipe.conversa)
const envia = vi.mocked(suporteDaEquipe.enviar)
const marcaLida = vi.mocked(suporteDaEquipe.marcarLida)

const EU = { id: 'admin-1', name: 'Mateus' }
const OUTRO_ADMIN = { id: 'admin-2', name: 'Ana' }
const CARLA = { id: 'dono-1', name: 'Carla Mendes' }

function naCaixa(over: Partial<ConversaNaCaixa> = {}): ConversaNaCaixa {
  return {
    id: 'c1',
    dono: CARLA,
    naoLidas: 0,
    ultimaMensagemEm: '2026-09-11T12:00:00.000Z',
    ultimaMensagem: { texto: 'Não consigo cadastrar mercadoria', daEquipe: false, criadaEm: '2026-09-11T12:00:00.000Z' },
    ...over,
  }
}

function mensagem(over: Partial<MensagemDeSuporte> = {}): MensagemDeSuporte {
  return { id: 'm1', texto: 'Olá', daEquipe: false, tela: null, criadaEm: '2026-09-11T12:00:00.000Z', autor: CARLA, ...over }
}

function conversa(over: Partial<ConversaParaEquipe> = {}): ConversaParaEquipe {
  return {
    id: 'c1',
    naoLidas: 0,
    ultimaMensagemEm: '2026-09-11T12:00:00.000Z',
    dono: {
      ...CARLA,
      email: 'carla@exemplo.com',
      assinatura: {
        plano: { id: 'p1', nome: 'Pro' },
        origem: 'STRIPE',
        status: 'active',
        currentPeriodEnd: '2026-10-11T03:00:00.000Z',
        emDia: true,
      },
    },
    mensagens: [mensagem()],
    maisAntigas: null,
    ...over,
  }
}

function abre(route = '/admin/suporte') {
  const stream = criaStreamFalso()
  const resultado = renderWithProviders(
    <stream.Provider>
      <AdminSuporte />
    </stream.Provider>,
    { route, path: '/admin/suporte/:conversaId?' },
  )
  return { ...resultado, stream }
}

const conversaAberta = () => screen.getByRole('log', { name: 'Conversa com o dono' })

let avisosDeLeitura: Array<string | undefined> = []
const anotaLeitura = (e: Event) => avisosDeLeitura.push((e as CustomEvent<{ conversaId?: string }>).detail.conversaId)

beforeEach(() => {
  vi.clearAllMocks()
  sessao.user = criaUsuario({ ...EU, role: 'ADMIN' })
  buscaCaixa.mockResolvedValue([])
  buscaConversa.mockResolvedValue(conversa())
  marcaLida.mockResolvedValue(undefined)
  avisosDeLeitura = []
  window.addEventListener('so-mais-um:suporte-lido', anotaLeitura)
})

afterEach(() => {
  window.removeEventListener('so-mais-um:suporte-lido', anotaLeitura)
})

describe('Suporte da equipe — a caixa', () => {
  it('vazia: diz que ainda não há conversa', async () => {
    abre()

    expect(await screen.findByText('Nenhuma conversa ainda')).toBeInTheDocument()
    expect(screen.getByText('Escolha uma conversa na lista para ler e responder.')).toBeInTheDocument()
  })

  it('mostra as não lidas primeiro, com a contagem, na ordem que a api manda', async () => {
    buscaCaixa.mockResolvedValue([
      naCaixa({ id: 'c1', naoLidas: 2 }),
      naCaixa({
        id: 'c2',
        dono: { id: 'dono-2', name: 'João Pedro' },
        ultimaMensagem: { texto: 'Pode tentar agora', daEquipe: true, criadaEm: '2026-09-10T12:00:00.000Z' },
      }),
    ])
    abre()

    const caixa = await screen.findByRole('navigation', { name: 'Conversas de suporte' })
    // A caixa existe antes de a lista chegar ("Carregando as conversas…").
    const itens = await within(caixa).findAllByRole('link')
    expect(itens[0]).toHaveTextContent('Carla Mendes')
    expect(itens[0]).toHaveAttribute('href', '/admin/suporte/c1')
    expect(within(itens[0]).getByLabelText('2 não lidas')).toBeInTheDocument()
    // A última palavra foi da equipe: o trecho diz isso.
    expect(itens[1]).toHaveTextContent('Equipe: Pode tentar agora')
    expect(within(itens[1]).queryByLabelText(/não lida/)).not.toBeInTheDocument()
  })

  it('se atualiza sem recarregar quando chega mensagem de qualquer conversa', async () => {
    const { stream } = abre()
    await screen.findByText('Nenhuma conversa ainda')

    stream.emitir('suporte', { conversaId: 'c7', mensagem: mensagem({ id: 'm7' }) })

    await waitFor(() => expect(buscaCaixa).toHaveBeenCalledTimes(2))
  })

  it('relê a caixa depois de uma reconexão', async () => {
    const { stream } = abre()
    await screen.findByText('Nenhuma conversa ainda')

    stream.reconectar()

    await waitFor(() => expect(buscaCaixa).toHaveBeenCalledTimes(2))
  })
})

describe('Suporte da equipe — a conversa aberta', () => {
  it('mostra quem é o dono antes de qualquer mensagem: nome, e-mail, plano e situação', async () => {
    abre('/admin/suporte/c1')

    const dono = await screen.findByRole('banner', { name: 'Quem é o dono' })
    expect(dono).toHaveTextContent('Carla Mendes')
    expect(within(dono).getByRole('link', { name: 'carla@exemplo.com' })).toHaveAttribute('href', 'mailto:carla@exemplo.com')
    expect(dono).toHaveTextContent('Pro · Em dia · até 11/10/2026')
    expect(buscaConversa).toHaveBeenCalledWith('c1', undefined)
  })

  it('a cortesia vencida aparece como teste acabado', async () => {
    buscaConversa.mockResolvedValue(
      conversa({
        dono: {
          ...CARLA,
          email: 'carla@exemplo.com',
          assinatura: { plano: { id: 'p1', nome: 'Premium' }, origem: 'CORTESIA', status: 'active', currentPeriodEnd: '2026-09-10T03:00:00.000Z', emDia: false },
        },
      }),
    )
    abre('/admin/suporte/c1')

    expect(await screen.findByText('Teste acabado')).toBeInTheDocument()
  })

  it('mostra de que tela o dono escreveu, e qual admin mandou cada resposta', async () => {
    buscaConversa.mockResolvedValue(
      conversa({
        mensagens: [
          mensagem({ id: 'm1', texto: 'Sumiram minhas mercadorias', tela: '/owner/inventory' }),
          mensagem({ id: 'm2', texto: 'Qual filtro está ligado?', daEquipe: true, autor: OUTRO_ADMIN }),
          mensagem({ id: 'm3', texto: 'O de estoque baixo, desmarca ele', daEquipe: true, autor: EU }),
        ],
      }),
    )
    abre('/admin/suporte/c1')

    await screen.findByText('Sumiram minhas mercadorias')
    const [doDono, daAna, minha] = within(conversaAberta()).getAllByRole('article')
    expect(doDono).toHaveTextContent('Carla Mendes')
    expect(doDono).toHaveTextContent('escrito de: Estoque')
    expect(daAna).toHaveTextContent('Ana · equipe')
    expect(minha).toHaveTextContent('Você')
  })

  it('abrir a conversa com não lidas a marca como lida, atualiza a caixa e apaga o aviso do sino', async () => {
    buscaConversa.mockResolvedValue(conversa({ naoLidas: 1 }))
    abre('/admin/suporte/c1')

    await waitFor(() => expect(marcaLida).toHaveBeenCalledWith('c1'))
    await waitFor(() => expect(avisosDeLeitura).toEqual(['c1']))
    await waitFor(() => expect(buscaCaixa).toHaveBeenCalledTimes(2))
  })

  it('a mensagem do dono entra sozinha pelo evento, e a conversa é marcada como lida', async () => {
    const { stream } = abre('/admin/suporte/c1')
    await screen.findByText('Olá')

    stream.emitir('suporte', { conversaId: 'c1', mensagem: mensagem({ id: 'm9', texto: 'Ainda não apareceu' }) })

    expect(await within(conversaAberta()).findByText('Ainda não apareceu')).toBeInTheDocument()
    await waitFor(() => expect(marcaLida).toHaveBeenCalledWith('c1'))
  })

  it('mensagem de outra conversa não entra na que está aberta', async () => {
    const { stream } = abre('/admin/suporte/c1')
    await screen.findByText('Olá')

    stream.emitir('suporte', { conversaId: 'c2', mensagem: mensagem({ id: 'm8', texto: 'Sou de outro dono' }) })

    expect(within(conversaAberta()).queryByText('Sou de outro dono')).not.toBeInTheDocument()
    expect(marcaLida).not.toHaveBeenCalled()
  })

  it('a resposta de outro admin aparece na conversa aberta, sem recarregar', async () => {
    const { stream } = abre('/admin/suporte/c1')
    await screen.findByText('Olá')

    stream.emitir('suporte', {
      conversaId: 'c1',
      mensagem: mensagem({ id: 'm10', texto: 'Já respondi, pode deixar', daEquipe: true, autor: OUTRO_ADMIN }),
    })

    expect(await within(conversaAberta()).findByText('Já respondi, pode deixar')).toBeInTheDocument()
    expect(screen.getByText('Ana · equipe')).toBeInTheDocument()
    // Resposta da equipe não é leitura do que o dono escreveu.
    expect(marcaLida).not.toHaveBeenCalled()
  })

  it('a resposta enviada aparece na hora, e vai para a conversa certa', async () => {
    envia.mockResolvedValue(mensagem({ id: 'm11', texto: 'Resolvido!', daEquipe: true, autor: EU }))
    const { user } = abre('/admin/suporte/c1')
    await screen.findByText('Olá')

    await user.type(screen.getByRole('textbox', { name: 'Resposta para o dono' }), 'Resolvido!{Enter}')

    expect(await within(conversaAberta()).findByText('Resolvido!')).toBeInTheDocument()
    expect(envia).toHaveBeenCalledWith('c1', 'Resolvido!')
    await waitFor(() => expect(screen.queryByText('Enviando…')).not.toBeInTheDocument())
  })
})
