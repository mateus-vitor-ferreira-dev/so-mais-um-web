/**
 * A conversa do dono com a equipe (web#472, épico api#570).
 *
 * O que estes testes protegem, além de a tela abrir:
 *
 * - **o que o dono escreveu nunca some** — aparece na hora, e a falha fica
 *   visível com "tentar de novo", reenviando o mesmo texto;
 * - **o eco não duplica** — o evento `suporte` chega também com o que o próprio
 *   dono mandou, às vezes antes da resposta do POST;
 * - **a reconexão relê** — o que chegou durante a queda do stream aparece;
 * - **a tela de origem vai só na primeira mensagem da visita.**
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, waitFor, within } from '../../../test/render'
import { erroDaApi } from '../../../test/factories'
import { criaStreamFalso } from '../../../test/streamFalso'
import { HORARIO_DE_ATENDIMENTO } from '../../../constants/suporte'
import type { ConversaDoDono, MensagemDeSuporte } from '../../../types/api'
import OwnerSuporte from './index'

vi.mock('../../../services/suporte')

import { suporteService } from '../../../services/suporte'

const buscaConversa = vi.mocked(suporteService.conversa)
const envia = vi.mocked(suporteService.enviar)
const marcaLida = vi.mocked(suporteService.marcarLida)

function mensagem(over: Partial<MensagemDeSuporte> = {}): MensagemDeSuporte {
  return { id: 'm1', texto: 'Olá', daEquipe: false, tela: null, criadaEm: '2026-09-11T12:00:00.000Z', ...over }
}

function pagina(over: Partial<ConversaDoDono> = {}): ConversaDoDono {
  return { conversaId: 'c1', naoLidas: 0, mensagens: [], maisAntigas: null, ...over }
}

function abre(opcoes: { state?: unknown } = {}) {
  const stream = criaStreamFalso()
  const resultado = renderWithProviders(
    <stream.Provider>
      <OwnerSuporte />
    </stream.Provider>,
    { route: '/owner/suporte', ...opcoes },
  )
  return { ...resultado, stream }
}

const campo = () => screen.getByRole('textbox', { name: 'Mensagem para a equipe' })
const baloes = () => within(screen.getByRole('log')).getAllByRole('article')

beforeEach(() => {
  vi.clearAllMocks()
  buscaConversa.mockResolvedValue(pagina())
  marcaLida.mockResolvedValue(undefined)
})

describe('Suporte — a conversa', () => {
  it('vazia: convida a escrever, e diz quando a equipe responde', async () => {
    abre()

    expect(await screen.findByText('Fale com a equipe do Só+1')).toBeInTheDocument()
    // Um chat que promete tempo real e fica mudo parece quebrado.
    expect(screen.getByText(HORARIO_DE_ATENDIMENTO)).toBeInTheDocument()
    expect(marcaLida).not.toHaveBeenCalled()
  })

  it('mostra as mensagens na ordem de leitura, e a equipe como "Equipe Só+1"', async () => {
    buscaConversa.mockResolvedValue(
      pagina({
        mensagens: [
          mensagem({ id: 'm1', texto: 'Não consigo cadastrar mercadoria' }),
          mensagem({ id: 'm2', texto: 'Já corrigimos, pode tentar de novo', daEquipe: true }),
        ],
      }),
    )
    abre()

    await screen.findByText('Já corrigimos, pode tentar de novo')
    const [primeiro, segundo] = baloes()
    expect(primeiro).toHaveTextContent('Você')
    expect(primeiro).toHaveTextContent('Não consigo cadastrar mercadoria')
    expect(segundo).toHaveTextContent('Equipe Só+1')
  })

  it('marca como lida ao abrir, quando há resposta não lida', async () => {
    buscaConversa.mockResolvedValue(pagina({ naoLidas: 2, mensagens: [mensagem({ daEquipe: true })] }))
    abre()

    await waitFor(() => expect(marcaLida).toHaveBeenCalledTimes(1))
  })

  it('as mensagens anteriores entram em cima quando o dono pede', async () => {
    buscaConversa.mockImplementation(async antes =>
      antes === 'm2'
        ? pagina({ mensagens: [mensagem({ id: 'm1', texto: 'A mais antiga' })], maisAntigas: null })
        : pagina({ mensagens: [mensagem({ id: 'm2', texto: 'A mais nova' })], maisAntigas: 'm2' }),
    )
    const { user } = abre()

    await screen.findByText('A mais nova')
    await user.click(screen.getByRole('button', { name: 'Ver mensagens anteriores' }))

    await screen.findByText('A mais antiga')
    expect(buscaConversa).toHaveBeenLastCalledWith('m2')
    expect(baloes()[0]).toHaveTextContent('A mais antiga')
    // A conversa começa ali: não há mais o que carregar.
    expect(screen.queryByRole('button', { name: 'Ver mensagens anteriores' })).not.toBeInTheDocument()
  })

  it('falha ao carregar oferece tentar de novo', async () => {
    buscaConversa.mockRejectedValueOnce(erroDaApi('fora do ar', 503))
    const { user } = abre()

    await screen.findByText(/não foi possível carregar a conversa/i)
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    await screen.findByText('Fale com a equipe do Só+1')
    expect(buscaConversa).toHaveBeenCalledTimes(2)
  })
})

describe('Suporte — enviar', () => {
  it('a mensagem aparece na hora como "enviando", e fica quando a api confirma', async () => {
    let confirma: (m: MensagemDeSuporte) => void = () => {}
    envia.mockReturnValue(new Promise(resolve => { confirma = resolve }))
    const { user } = abre()
    await screen.findByText('Fale com a equipe do Só+1')

    await user.type(campo(), 'Oi, preciso de ajuda{Enter}')

    expect(screen.getByText('Oi, preciso de ajuda')).toBeInTheDocument()
    expect(screen.getByText('Enviando…')).toBeInTheDocument()
    expect(campo()).toHaveValue('')

    confirma(mensagem({ id: 'm9', texto: 'Oi, preciso de ajuda' }))

    await waitFor(() => expect(screen.queryByText('Enviando…')).not.toBeInTheDocument())
    expect(screen.getAllByText('Oi, preciso de ajuda')).toHaveLength(1)
  })

  it('Shift+Enter quebra a linha, e não envia', async () => {
    const { user } = abre()
    await screen.findByText('Fale com a equipe do Só+1')

    await user.type(campo(), 'linha 1{Shift>}{Enter}{/Shift}linha 2')

    expect(campo()).toHaveValue('linha 1\nlinha 2')
    expect(envia).not.toHaveBeenCalled()
  })

  it('mensagem só de espaços não sai', async () => {
    const { user } = abre()
    await screen.findByText('Fale com a equipe do Só+1')

    await user.type(campo(), '   {Enter}')

    expect(envia).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled()
  })

  it('a primeira mensagem diz de que tela o dono veio; a segunda, não', async () => {
    envia.mockImplementation(async ({ texto }) => mensagem({ id: texto, texto }))
    const { user } = abre({ state: { de: '/owner/inventory' } })
    await screen.findByText('Fale com a equipe do Só+1')

    await user.type(campo(), 'primeira{Enter}')
    await waitFor(() => expect(envia).toHaveBeenCalledWith({ texto: 'primeira', tela: '/owner/inventory' }))

    await user.type(campo(), 'segunda{Enter}')
    await waitFor(() => expect(envia).toHaveBeenLastCalledWith({ texto: 'segunda' }))
  })

  it('o envio que falha fica visível, e "tentar de novo" reenvia o mesmo texto', async () => {
    envia
      .mockRejectedValueOnce(erroDaApi('Muitas mensagens seguidas. Espere um minuto e tente de novo.', 429))
      .mockResolvedValueOnce(mensagem({ id: 'm5', texto: 'Socorro' }))
    const { user } = abre()
    await screen.findByText('Fale com a equipe do Só+1')

    await user.type(campo(), 'Socorro{Enter}')

    // O que o dono escreveu nunca some: fica, marcado, com o motivo.
    expect(await screen.findByRole('alert')).toHaveTextContent('Não enviada: Muitas mensagens seguidas.')
    expect(screen.getByText('Socorro')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /tentar de novo/i }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(envia).toHaveBeenCalledTimes(2)
    expect(envia).toHaveBeenNthCalledWith(2, { texto: 'Socorro' })
    expect(screen.getAllByText('Socorro')).toHaveLength(1)
  })

  it('o contador só aparece perto do limite', async () => {
    const { user } = abre()
    await screen.findByText('Fale com a equipe do Só+1')

    await user.click(campo())
    await user.paste('a'.repeat(1700))
    expect(screen.queryByText(/caracteres restantes/)).not.toBeInTheDocument()

    await user.paste('a'.repeat(150))
    expect(screen.getByText('150 caracteres restantes')).toBeInTheDocument()
  })
})

describe('Suporte — tempo real', () => {
  it('a resposta da equipe entra sozinha, pelo evento, e marca a conversa como lida', async () => {
    const { stream } = abre()
    await screen.findByText('Fale com a equipe do Só+1')

    stream.emitir('suporte', { conversaId: 'c1', mensagem: mensagem({ id: 'm7', daEquipe: true, texto: 'Resolvido!' }) })

    expect(await screen.findByText('Resolvido!')).toBeInTheDocument()
    expect(marcaLida).toHaveBeenCalledTimes(1)
  })

  it('o eco da própria mensagem não duplica — nem antes, nem depois do POST', async () => {
    let confirma: (m: MensagemDeSuporte) => void = () => {}
    envia.mockReturnValue(new Promise(resolve => { confirma = resolve }))
    const { user, stream } = abre()
    await screen.findByText('Fale com a equipe do Só+1')

    await user.type(campo(), 'Oi{Enter}')
    const salva = mensagem({ id: 'm8', texto: 'Oi' })

    // O eco chega antes da resposta do POST...
    stream.emitir('suporte', { conversaId: 'c1', mensagem: salva })
    expect(screen.getAllByText('Oi')).toHaveLength(1)

    // ...e a resposta do POST, depois dele, não repete.
    confirma(salva)
    await waitFor(() => expect(screen.queryByText('Enviando…')).not.toBeInTheDocument())
    stream.emitir('suporte', { conversaId: 'c1', mensagem: salva })
    expect(screen.getAllByText('Oi')).toHaveLength(1)
    // O eco do dono não conta como resposta para marcar como lida.
    expect(marcaLida).not.toHaveBeenCalled()
  })

  it('depois de uma reconexão, a conversa é relida e nada falta', async () => {
    buscaConversa
      .mockResolvedValueOnce(pagina({ mensagens: [mensagem({ id: 'm1', texto: 'Antes da queda' })] }))
      .mockResolvedValueOnce(
        pagina({
          mensagens: [
            mensagem({ id: 'm1', texto: 'Antes da queda' }),
            mensagem({ id: 'm2', texto: 'Chegou durante a queda', daEquipe: true }),
          ],
        }),
      )
    const { stream } = abre()
    await screen.findByText('Antes da queda')

    stream.reconectar()

    expect(await screen.findByText('Chegou durante a queda')).toBeInTheDocument()
    expect(buscaConversa).toHaveBeenCalledTimes(2)
    expect(screen.getAllByText('Antes da queda')).toHaveLength(1)
  })

  it('sair da tela cancela a assinatura do evento', async () => {
    const { stream, unmount } = abre()
    await screen.findByText('Fale com a equipe do Só+1')
    expect(stream.ouvintesDe('suporte')).toBe(1)

    unmount()

    expect(stream.ouvintesDe('suporte')).toBe(0)
  })
})
