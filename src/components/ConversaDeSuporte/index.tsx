import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, ReactNode, UIEvent } from 'react'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData, QueryKey } from '@tanstack/react-query'
import { RotateCw, Send } from 'lucide-react'
import ErrorState from '../ErrorState'
import { useEventoDoStream, useReconexaoDoStream } from '../../hooks/useEventoDoStream'
import { mensagemDeErro } from '../../utils/apiError'
import { CONTADOR_A_PARTIR_DE, TEXTO_MAX, horaDaMensagem } from '../../constants/suporte'
import type { EventoDeSuporte, MensagemDeSuporte } from '../../types/api'
import {
  Conversa, Lista, Anteriores, Carregando, Balao, Autor, Texto, Detalhe, Rodape,
  TentarDeNovo, Composer, Acoes, Contador, BotaoEnviar,
} from './styles'

/** O que as duas pontas devolvem numa página: a do dono e a da equipe. */
export interface PaginaDaConversa {
  naoLidas: number
  mensagens: MensagemDeSuporte[]
  maisAntigas: string | null
}

export interface ConversaDeSuporteProps<P extends PaginaDaConversa> {
  chave: QueryKey
  /** Uma página; `antes` é o `maisAntigas` da anterior. */
  buscar: (antes?: string) => Promise<P>
  enviar: (texto: string, tela?: string) => Promise<MensagemDeSuporte>
  /**
   * De que tela a mensagem é escrita. Chamado **uma vez por mensagem nova**, e o
   * valor fica com ela — é o que o "tentar de novo" reenvia.
   */
  telaDaMensagem?: () => string | undefined
  marcarLida: () => Promise<void>
  /** Depois de marcar como lida: o sino e a caixa precisam saber. */
  aoMarcarLida?: () => void
  /** O evento é desta conversa? O dono tem uma só; a equipe, várias. */
  ehDestaConversa: (evento: EventoDeSuporte) => boolean
  /** A mensagem é do lado de quem está vendo: o dono vê as dele; a equipe, as da equipe. */
  doMeuLado: (mensagem: MensagemDeSuporte) => boolean
  autor: (mensagem: MensagemDeSuporte) => string
  /** Uma linha a mais no balão — a tela de onde o dono escreveu, para a equipe. */
  detalhe?: (mensagem: MensagemDeSuporte) => ReactNode
  /** O que vem antes das mensagens, lido da página mais nova — quem é o dono, para a equipe. */
  cabecalho?: (pagina: P) => ReactNode
  vazio: ReactNode
  rotuloDaLista: string
  rotuloDoCampo: string
  placeholder: string
}

interface Pendente {
  idLocal: string
  texto: string
  tela?: string
  estado: 'enviando' | 'falhou'
  erro?: string
}

/** A mensagem entra no fim da página mais nova — a menos que já esteja em alguma. */
function comMensagem<P extends PaginaDaConversa>(
  dados: InfiniteData<P, string | undefined>,
  mensagem: MensagemDeSuporte,
): InfiniteData<P, string | undefined> {
  if (dados.pages.some(p => p.mensagens.some(m => m.id === mensagem.id))) return dados
  const [maisNova, ...anteriores] = dados.pages
  return { ...dados, pages: [{ ...maisNova, mensagens: [...maisNova.mensagens, mensagem] }, ...anteriores] }
}

let sequencia = 0
const novoIdLocal = () => `local-${++sequencia}`

/** Distância do fim, em px, abaixo da qual a lista acompanha as mensagens novas. */
const PERTO_DO_FIM = 80
/** Distância do topo, em px, a partir da qual as anteriores carregam sozinhas. */
const PERTO_DO_TOPO = 60

/**
 * Uma conversa de suporte: as mensagens, o envio e o tempo real (web#472, web#473).
 *
 * Nasceu dentro da tela do dono e saiu dela quando a equipe precisou da mesma
 * coisa do outro lado. O que muda entre as pontas entra por prop — de onde ler,
 * para onde mandar, de que lado cada mensagem fica, como chamar o autor —; as
 * regras são uma só:
 *
 * - **o que se escreveu nunca some.** A mensagem aparece na hora como
 *   "enviando"; se a api falhar, fica marcada, com "tentar de novo";
 * - **o banco é a verdade, o stream é a campainha.** A mensagem do outro lado
 *   entra pelo evento `suporte`, e depois de uma reconexão a conversa é relida;
 * - **o eco não duplica.** O evento chega também com o que o próprio lado
 *   mandou, e tudo é deduplicado pelo `id` — inclusive quando o eco chega antes
 *   da resposta do POST.
 */
export default function ConversaDeSuporte<P extends PaginaDaConversa>(props: ConversaDeSuporteProps<P>) {
  const { chave, buscar, doMeuLado, autor, detalhe, cabecalho, vazio } = props
  const queryClient = useQueryClient()

  // As funções das props mudam a cada render de quem monta a conversa. Os
  // efeitos e o stream leem a versão mais recente daqui, sem se reassinar.
  const atual = useRef(props)
  useEffect(() => {
    atual.current = props
  })

  const conversa = useInfiniteQuery({
    queryKey: chave,
    queryFn: ({ pageParam }) => buscar(pageParam),
    initialPageParam: undefined as string | undefined,
    // "Próxima", para o react-query, é a página mais antiga: a conversa cresce
    // para cima quando se sobe a rolagem.
    getNextPageParam: (pagina: P) => pagina.maisAntigas ?? undefined,
  })

  const confirmadas = useMemo(
    () => (conversa.data ? [...conversa.data.pages].reverse().flatMap(p => p.mensagens) : []),
    [conversa.data],
  )

  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [texto, setTexto] = useState('')

  /** Põe a mensagem na conversa em cache. Sem cache ainda, relê. */
  const adicionar = useCallback((mensagem: MensagemDeSuporte) => {
    const chaveAtual = atual.current.chave
    if (!queryClient.getQueryData(chaveAtual)) {
      void queryClient.invalidateQueries({ queryKey: chaveAtual })
      return
    }
    queryClient.setQueryData<InfiniteData<P, string | undefined>>(chaveAtual, dados =>
      dados ? comMensagem(dados, mensagem) : dados,
    )
  }, [queryClient])

  const marcarLida = useCallback(() => {
    const { marcarLida: marcar, aoMarcarLida } = atual.current
    // Melhor esforço: não ter marcado como lida não justifica erro na tela.
    void marcar().then(() => aoMarcarLida?.(), () => {})
  }, [])

  // ── Lida ao abrir ──────────────────────────────────────────────────────────
  const naoLidas = conversa.data?.pages[0]?.naoLidas ?? 0
  const jaMarcouAoAbrir = useRef(false)
  useEffect(() => {
    if (jaMarcouAoAbrir.current || !conversa.isSuccess || naoLidas === 0) return
    jaMarcouAoAbrir.current = true
    marcarLida()
  }, [conversa.isSuccess, naoLidas, marcarLida])

  // ── Tempo real ─────────────────────────────────────────────────────────────
  /** Mensagem do outro lado que chegou com a aba escondida: fica para quando ela voltar. */
  const lerQuandoVoltar = useRef(false)

  useEventoDoStream<EventoDeSuporte>('suporte', evento => {
    if (!atual.current.ehDestaConversa(evento)) return
    const { mensagem } = evento
    adicionar(mensagem)

    if (atual.current.doMeuLado(mensagem)) {
      // O eco do que foi mandado daqui pode chegar antes da resposta do POST.
      // Sem isto a mensagem apareceria duas vezes até o POST voltar.
      setPendentes(prev => {
        const i = prev.findIndex(p => p.estado === 'enviando' && p.texto === mensagem.texto)
        return i < 0 ? prev : prev.filter((_, j) => j !== i)
      })
      return
    }

    if (document.visibilityState === 'visible') marcarLida()
    else lerQuandoVoltar.current = true
  })

  useEffect(() => {
    function aoVoltar() {
      if (document.visibilityState !== 'visible' || !lerQuandoVoltar.current) return
      lerQuandoVoltar.current = false
      marcarLida()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    return () => document.removeEventListener('visibilitychange', aoVoltar)
  }, [marcarLida])

  // O que chegou durante a queda se perdeu no stream, mas não no banco.
  useReconexaoDoStream(() => {
    void queryClient.invalidateQueries({ queryKey: atual.current.chave })
  })

  // ── Envio ──────────────────────────────────────────────────────────────────
  const lista = useRef<HTMLDivElement>(null)
  const grudarNoFim = useRef(true)

  const mandar = useCallback(async (pendente: Pendente) => {
    setPendentes(prev => prev.map(p => (p.idLocal === pendente.idLocal ? { ...p, estado: 'enviando', erro: undefined } : p)))
    try {
      const mensagem = await atual.current.enviar(pendente.texto, pendente.tela)
      adicionar(mensagem)
      setPendentes(prev => prev.filter(p => p.idLocal !== pendente.idLocal))
    } catch (erro) {
      setPendentes(prev =>
        prev.map(p =>
          p.idLocal === pendente.idLocal
            ? { ...p, estado: 'falhou', erro: mensagemDeErro(erro, 'Não foi possível enviar.') }
            : p,
        ),
      )
    }
  }, [adicionar])

  function enviar(evento?: FormEvent) {
    evento?.preventDefault()
    // Aparado como a api apara: é também o que o eco devolve, e é por ele que
    // o pendente é reconhecido.
    const limpo = texto.trim()
    if (!limpo) return

    const pendente: Pendente = {
      idLocal: novoIdLocal(),
      texto: limpo,
      tela: atual.current.telaDaMensagem?.(),
      estado: 'enviando',
    }
    grudarNoFim.current = true
    setPendentes(prev => [...prev, pendente])
    setTexto('')
    void mandar(pendente)
  }

  function aoTeclar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter envia; Shift+Enter quebra a linha. `isComposing` protege quem digita
    // acento por composição, em que o Enter confirma a letra, e não a mensagem.
    if (evento.key === 'Enter' && !evento.shiftKey && !evento.nativeEvent.isComposing) {
      evento.preventDefault()
      enviar()
    }
  }

  // ── Rolagem ────────────────────────────────────────────────────────────────
  const alturaAntesDasAnteriores = useRef<number | null>(null)

  function carregarAnteriores() {
    if (!conversa.hasNextPage || conversa.isFetchingNextPage) return
    alturaAntesDasAnteriores.current = lista.current?.scrollHeight ?? null
    void conversa.fetchNextPage()
  }

  function aoRolar(evento: UIEvent<HTMLDivElement>) {
    const el = evento.currentTarget
    grudarNoFim.current = el.scrollHeight - el.scrollTop - el.clientHeight < PERTO_DO_FIM
    if (el.scrollTop < PERTO_DO_TOPO) carregarAnteriores()
  }

  // As anteriores entram em cima: sem compensar a altura, a conversa pularia
  // para o topo e quem lê perderia onde estava.
  const totalDePaginas = conversa.data?.pages.length ?? 0
  useLayoutEffect(() => {
    const el = lista.current
    if (!el || alturaAntesDasAnteriores.current === null) return
    el.scrollTop += el.scrollHeight - alturaAntesDasAnteriores.current
    alturaAntesDasAnteriores.current = null
  }, [totalDePaginas])

  // Mensagem nova embaixo: acompanha, a menos que se esteja lendo o passado.
  const ultima = pendentes.at(-1)?.idLocal ?? confirmadas.at(-1)?.id
  useLayoutEffect(() => {
    const el = lista.current
    if (el && grudarNoFim.current) el.scrollTop = el.scrollHeight
  }, [ultima])

  const restantes = TEXTO_MAX - texto.length
  const semMensagens = confirmadas.length === 0 && pendentes.length === 0

  return (
    <Conversa>
      {conversa.data && cabecalho?.(conversa.data.pages[0])}

      <Lista ref={lista} onScroll={aoRolar} role="log" aria-label={props.rotuloDaLista}>
        {conversa.isPending ? (
          <Carregando role="status">Carregando a conversa…</Carregando>
        ) : conversa.isError && !conversa.data ? (
          <ErrorState>
            Não foi possível carregar a conversa.{' '}
            <TentarDeNovo type="button" onClick={() => void conversa.refetch()}>
              Tentar de novo
            </TentarDeNovo>
          </ErrorState>
        ) : (
          <>
            {conversa.hasNextPage && (
              <Anteriores type="button" onClick={carregarAnteriores} disabled={conversa.isFetchingNextPage}>
                {conversa.isFetchingNextPage ? 'Carregando…' : 'Ver mensagens anteriores'}
              </Anteriores>
            )}

            {semMensagens && vazio}

            {confirmadas.map(m => (
              <Balao key={m.id} $doMeuLado={doMeuLado(m)}>
                <Autor>{autor(m)}</Autor>
                <Texto>{m.texto}</Texto>
                {detalhe?.(m) && <Detalhe>{detalhe(m)}</Detalhe>}
                <Rodape>
                  <time dateTime={m.criadaEm}>{horaDaMensagem(m.criadaEm)}</time>
                </Rodape>
              </Balao>
            ))}

            {pendentes.map(p => (
              <Balao key={p.idLocal} $doMeuLado $falhou={p.estado === 'falhou'}>
                <Autor>Você</Autor>
                <Texto>{p.texto}</Texto>
                <Rodape>
                  {p.estado === 'enviando' ? (
                    'Enviando…'
                  ) : (
                    <>
                      <span role="alert">Não enviada{p.erro ? `: ${p.erro}` : '.'}</span>
                      <TentarDeNovo type="button" onClick={() => void mandar(p)}>
                        <RotateCw size={13} aria-hidden="true" />
                        Tentar de novo
                      </TentarDeNovo>
                    </>
                  )}
                </Rodape>
              </Balao>
            ))}
          </>
        )}
      </Lista>

      <Composer onSubmit={enviar}>
        <textarea
          aria-label={props.rotuloDoCampo}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={aoTeclar}
          maxLength={TEXTO_MAX}
          rows={3}
          placeholder={props.placeholder}
        />
        <Acoes>
          {restantes <= CONTADOR_A_PARTIR_DE ? (
            <Contador aria-live="polite">{restantes} caracteres restantes</Contador>
          ) : (
            <span />
          )}
          <BotaoEnviar type="submit" disabled={!texto.trim()}>
            <Send size={16} aria-hidden="true" />
            Enviar
          </BotaoEnviar>
        </Acoes>
      </Composer>
    </Conversa>
  )
}
