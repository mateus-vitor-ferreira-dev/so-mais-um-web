/**
 * A conexão de stream, uma por aba e fora do sino (web#472).
 *
 * O que estes testes protegem:
 *
 * - **uma conexão só**, por mais consumidores que existam — e trocar de layout
 *   (desmontar e montar consumidores) não reabre;
 * - **evento sem nome e evento nomeado não se misturam**: o sino lê o sem nome, e
 *   uma mensagem de suporte nunca pode aparecer nele como notificação;
 * - **reconexão é o `open` que vem depois de um `error`**, e não a primeira
 *   abertura. Confundir as duas faria toda tela reler tudo ao abrir;
 * - **sem usuário, nada abre; no logout, fecha.**
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act, useState } from 'react'
import { StreamProvider } from './StreamProvider'
import { useEventoDoStream, useReconexaoDoStream } from '../hooks/useEventoDoStream'

const { estadoDaSessao } = vi.hoisted(() => ({ estadoDaSessao: { user: null as { id: string } | null } }))

vi.mock('./AuthContext', () => ({ useAuth: () => estadoDaSessao }))

class EventSourceFalso {
  static instancias: EventSourceFalso[] = []
  readonly url: string
  readonly withCredentials: boolean
  fechada = false
  private ouvintes = new Map<string, Set<(e: Event) => void>>()

  constructor(url: string, init?: EventSourceInit) {
    this.url = url
    this.withCredentials = !!init?.withCredentials
    EventSourceFalso.instancias.push(this)
  }

  addEventListener(tipo: string, ouvinte: (e: Event) => void) {
    if (!this.ouvintes.has(tipo)) this.ouvintes.set(tipo, new Set())
    this.ouvintes.get(tipo)!.add(ouvinte)
  }

  close() {
    this.fechada = true
  }

  emitir(tipo: string, dado?: unknown) {
    const evento = dado === undefined ? new Event(tipo) : new MessageEvent(tipo, { data: JSON.stringify(dado) })
    act(() => this.ouvintes.get(tipo)?.forEach(ouvinte => ouvinte(evento)))
  }
}

/** Um consumidor qualquer: anota o que recebe. */
function Escuta({ evento, rotulo }: { evento: string; rotulo: string }) {
  const [recebidos, setRecebidos] = useState<string[]>([])
  const [reconexoes, setReconexoes] = useState(0)
  useEventoDoStream<{ texto: string }>(evento, dado => setRecebidos(prev => [...prev, dado.texto]))
  useReconexaoDoStream(() => setReconexoes(n => n + 1))
  return (
    <p data-testid={rotulo}>
      {recebidos.join(',')}|{reconexoes}
    </p>
  )
}

const conexoes = () => EventSourceFalso.instancias
const ultima = () => EventSourceFalso.instancias.at(-1)!

/**
 * Atribuição direta, e não `vi.stubGlobal`: o `setup.ts` define o
 * `window.EventSource` gravável mas não reconfigurável, e o `stubGlobal`
 * redefine a propriedade — o que falha com "Cannot redefine property".
 */
const EventSourceDoSetup = window.EventSource

beforeEach(() => {
  EventSourceFalso.instancias = []
  estadoDaSessao.user = { id: 'u1' }
  window.EventSource = EventSourceFalso as unknown as typeof EventSource
})

afterEach(() => {
  window.EventSource = EventSourceDoSetup
})

describe('StreamProvider', () => {
  it('sem usuário, não abre conexão nenhuma', () => {
    estadoDaSessao.user = null
    render(<StreamProvider><Escuta evento="message" rotulo="sino" /></StreamProvider>)

    expect(conexoes()).toHaveLength(0)
  })

  it('abre uma conexão só, com o cookie, por mais consumidores que existam', () => {
    render(
      <StreamProvider>
        <Escuta evento="message" rotulo="sino-do-main" />
        <Escuta evento="message" rotulo="sino-do-dashboard" />
        <Escuta evento="suporte" rotulo="suporte" />
      </StreamProvider>,
    )

    expect(conexoes()).toHaveLength(1)
    expect(ultima().url).toMatch(/\/notifications\/stream$/)
    expect(ultima().withCredentials).toBe(true)
  })

  it('o evento sem nome vai para quem escuta "message", e o nomeado só para quem o assinou', () => {
    render(
      <StreamProvider>
        <Escuta evento="message" rotulo="sino" />
        <Escuta evento="suporte" rotulo="suporte" />
      </StreamProvider>,
    )

    ultima().emitir('message', { texto: 'notificação' })
    ultima().emitir('suporte', { texto: 'resposta da equipe' })

    expect(screen.getByTestId('sino')).toHaveTextContent('notificação|0')
    // A mensagem de suporte não pode aparecer no sino como notificação.
    expect(screen.getByTestId('sino')).not.toHaveTextContent('resposta da equipe')
    expect(screen.getByTestId('suporte')).toHaveTextContent('resposta da equipe|0')
  })

  it('a primeira abertura não é reconexão; o open depois de um error é', () => {
    render(<StreamProvider><Escuta evento="message" rotulo="sino" /></StreamProvider>)

    ultima().emitir('open')
    expect(screen.getByTestId('sino')).toHaveTextContent('|0')

    ultima().emitir('error')
    ultima().emitir('open')
    expect(screen.getByTestId('sino')).toHaveTextContent('|1')
  })

  it('trocar de layout — desmontar e montar consumidores — não reabre a conexão', () => {
    function Troca() {
      const [layout, setLayout] = useState<'main' | 'dashboard'>('main')
      return (
        <>
          <button onClick={() => setLayout(l => (l === 'main' ? 'dashboard' : 'main'))}>trocar</button>
          {layout === 'main' ? <Escuta key="main" evento="message" rotulo="main" /> : <Escuta key="dash" evento="message" rotulo="dash" />}
        </>
      )
    }
    render(<StreamProvider><Troca /></StreamProvider>)

    act(() => screen.getByText('trocar').click())
    ultima().emitir('message', { texto: 'depois da troca' })

    expect(conexoes()).toHaveLength(1)
    expect(screen.getByTestId('dash')).toHaveTextContent('depois da troca')
  })

  it('consumidor que assina depois de a conexão abrir também recebe', () => {
    function Tardio() {
      const [montado, setMontado] = useState(false)
      return (
        <>
          <button onClick={() => setMontado(true)}>montar</button>
          {montado && <Escuta evento="suporte" rotulo="tardio" />}
        </>
      )
    }
    render(<StreamProvider><Tardio /></StreamProvider>)

    act(() => screen.getByText('montar').click())
    ultima().emitir('suporte', { texto: 'chegou' })

    expect(screen.getByTestId('tardio')).toHaveTextContent('chegou')
  })

  it('no logout, fecha a conexão', () => {
    const { rerender } = render(<StreamProvider><Escuta evento="message" rotulo="sino" /></StreamProvider>)
    const conexao = ultima()

    estadoDaSessao.user = null
    rerender(<StreamProvider><Escuta evento="message" rotulo="sino" /></StreamProvider>)

    expect(conexao.fechada).toBe(true)
  })

  it('payload malformado é ignorado, e não derruba quem escuta', () => {
    render(<StreamProvider><Escuta evento="message" rotulo="sino" /></StreamProvider>)

    act(() => {
      // Chega direto no ouvinte, sem passar pelo JSON.stringify do `emitir`.
      ;(ultima() as unknown as { ouvintes: Map<string, Set<(e: Event) => void>> }).ouvintes
        .get('message')!
        .forEach(ouvinte => ouvinte(new MessageEvent('message', { data: '{quebrado' })))
    })
    ultima().emitir('message', { texto: 'depois' })

    expect(screen.getByTestId('sino')).toHaveTextContent('depois|0')
  })
})
