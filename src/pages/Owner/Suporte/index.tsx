import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent, UIEvent } from 'react'
import { useLocation } from 'react-router-dom'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { Clock, LifeBuoy, RotateCw, Send } from 'lucide-react'
import { usePageHeader } from '../../../components/DashboardLayout/pageHeader'
import EmptyState from '../../../components/EmptyState'
import ErrorState from '../../../components/ErrorState'
import { chaves } from '../../../lib/queryClient'
import { suporteService } from '../../../services/suporte'
import { useEventoDoStream, useReconexaoDoStream } from '../../../hooks/useEventoDoStream'
import { mensagemDeErro } from '../../../utils/apiError'
import { CONTADOR_A_PARTIR_DE, HORARIO_DE_ATENDIMENTO, TEXTO_MAX, telaDeOrigem } from '../../../constants/suporte'
import type { ConversaDoDono, EventoDeSuporte, MensagemDeSuporte } from '../../../types/api'
import {
  Pagina, Horario, Conversa, Lista, Anteriores, Carregando, Balao, Autor, Texto, Rodape,
  TentarDeNovo, Composer, Acoes, Contador, BotaoEnviar,
} from './styles'

/**
 * A conversa do dono com a equipe do Só+1 (web#472, épico api#570).
 *
 * Três regras sustentam a tela:
 *
 * - **o que o dono escreveu nunca some.** A mensagem aparece na hora como
 *   "enviando"; se a api falhar, fica marcada, com "tentar de novo". Um chat
 *   que engole texto é o pior jeito de pedir ajuda;
 * - **o banco é a verdade, o stream é a campainha.** A resposta da equipe entra
 *   pelo evento `suporte`, e depois de uma reconexão a conversa é relida — o que
 *   chegou durante a queda não se perde;
 * - **o eco não duplica.** O evento chega também com o que o próprio dono mandou
 *   (a outra aba precisa ver), e tudo é deduplicado pelo `id`.
 */

interface Pendente {
  idLocal: string
  texto: string
  tela?: string
  estado: 'enviando' | 'falhou'
  erro?: string
}

type Paginas = InfiniteData<ConversaDoDono, string | undefined>

/** A mensagem entra no fim da página mais nova — a menos que já esteja em alguma. */
function comMensagem(dados: Paginas, mensagem: MensagemDeSuporte): Paginas {
  if (dados.pages.some(p => p.mensagens.some(m => m.id === mensagem.id))) return dados
  const [maisNova, ...anteriores] = dados.pages
  return { ...dados, pages: [{ ...maisNova, mensagens: [...maisNova.mensagens, mensagem] }, ...anteriores] }
}

/** Só a hora para hoje; data e hora para o resto. */
function quando(iso: string): string {
  const data = new Date(iso)
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (data.toDateString() === new Date().toDateString()) return hora
  return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${hora}`
}

let sequencia = 0
const novoIdLocal = () => `local-${++sequencia}`

/** Distância do fim, em px, abaixo da qual a lista acompanha as mensagens novas. */
const PERTO_DO_FIM = 80
/** Distância do topo, em px, a partir da qual as anteriores carregam sozinhas. */
const PERTO_DO_TOPO = 60

export default function OwnerSuporte() {
  usePageHeader('Suporte', 'Fale com a equipe do Só+1')

  const location = useLocation()
  const queryClient = useQueryClient()

  /**
   * De que tela o dono veio — o link do menu manda no `state`. Vai **só na
   * primeira mensagem desta visita**: nas seguintes a equipe já sabe.
   */
  const origem = useRef(telaDeOrigem((location.state as { de?: unknown } | null)?.de))

  const conversa = useInfiniteQuery({
    queryKey: chaves.suporteDoDono(),
    queryFn: ({ pageParam }) => suporteService.conversa(pageParam),
    initialPageParam: undefined as string | undefined,
    // "Próxima", para o react-query, é a página mais antiga: a conversa cresce
    // para cima quando o dono sobe a rolagem.
    getNextPageParam: (pagina) => pagina.maisAntigas ?? undefined,
  })

  const confirmadas = useMemo(
    () => (conversa.data ? [...conversa.data.pages].reverse().flatMap(p => p.mensagens) : []),
    [conversa.data],
  )

  const [pendentes, setPendentes] = useState<Pendente[]>([])
  const [texto, setTexto] = useState('')

  /** Põe a mensagem na conversa em cache. Sem cache ainda, relê. */
  const adicionar = useCallback((mensagem: MensagemDeSuporte) => {
    if (!queryClient.getQueryData(chaves.suporteDoDono())) {
      void queryClient.invalidateQueries({ queryKey: chaves.suporteDoDono() })
      return
    }
    queryClient.setQueryData<Paginas>(chaves.suporteDoDono(), dados => (dados ? comMensagem(dados, mensagem) : dados))
  }, [queryClient])

  const marcarLida = useCallback(() => {
    // Melhor esforço: não ter marcado como lida não justifica erro na tela.
    void suporteService.marcarLida().catch(() => {})
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
  /** Resposta que chegou com a aba escondida: fica para quando ela voltar. */
  const lerQuandoVoltar = useRef(false)

  useEventoDoStream<EventoDeSuporte>('suporte', ({ mensagem }) => {
    adicionar(mensagem)

    if (!mensagem.daEquipe) {
      // O eco do que esta aba mandou pode chegar antes da resposta do POST.
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
    void queryClient.invalidateQueries({ queryKey: chaves.suporteDoDono() })
  })

  // ── Envio ──────────────────────────────────────────────────────────────────
  const lista = useRef<HTMLDivElement>(null)
  const grudarNoFim = useRef(true)

  const mandar = useCallback(async (pendente: Pendente) => {
    setPendentes(prev => prev.map(p => (p.idLocal === pendente.idLocal ? { ...p, estado: 'enviando', erro: undefined } : p)))
    try {
      const mensagem = await suporteService.enviar(
        pendente.tela ? { texto: pendente.texto, tela: pendente.tela } : { texto: pendente.texto },
      )
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

    const pendente: Pendente = { idLocal: novoIdLocal(), texto: limpo, tela: origem.current, estado: 'enviando' }
    origem.current = undefined
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
  // para o topo e o dono perderia onde estava lendo.
  const totalDePaginas = conversa.data?.pages.length ?? 0
  useLayoutEffect(() => {
    const el = lista.current
    if (!el || alturaAntesDasAnteriores.current === null) return
    el.scrollTop += el.scrollHeight - alturaAntesDasAnteriores.current
    alturaAntesDasAnteriores.current = null
  }, [totalDePaginas])

  // Mensagem nova embaixo: acompanha, a menos que o dono esteja lendo o passado.
  const ultima = pendentes.at(-1)?.idLocal ?? confirmadas.at(-1)?.id
  useLayoutEffect(() => {
    const el = lista.current
    if (el && grudarNoFim.current) el.scrollTop = el.scrollHeight
  }, [ultima])

  const restantes = TEXTO_MAX - texto.length
  const vazia = confirmadas.length === 0 && pendentes.length === 0

  return (
    <Pagina>
      <Horario>
        <Clock size={16} aria-hidden="true" />
        {HORARIO_DE_ATENDIMENTO}
      </Horario>

      <Conversa>
        <Lista ref={lista} onScroll={aoRolar} role="log" aria-label="Conversa com a equipe do Só+1">
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

              {vazia && (
                <EmptyState icone={<LifeBuoy size={28} aria-hidden="true" />} titulo="Fale com a equipe do Só+1">
                  Escreva abaixo a sua dúvida ou o problema que encontrou. A resposta chega aqui
                  mesmo, e também no sino.
                </EmptyState>
              )}

              {confirmadas.map(m => (
                <Balao key={m.id} $daEquipe={m.daEquipe}>
                  <Autor>{m.daEquipe ? 'Equipe Só+1' : 'Você'}</Autor>
                  <Texto>{m.texto}</Texto>
                  <Rodape>
                    <time dateTime={m.criadaEm}>{quando(m.criadaEm)}</time>
                  </Rodape>
                </Balao>
              ))}

              {pendentes.map(p => (
                <Balao key={p.idLocal} $daEquipe={false} $falhou={p.estado === 'falhou'}>
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
            aria-label="Mensagem para a equipe"
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={aoTeclar}
            maxLength={TEXTO_MAX}
            rows={3}
            placeholder="Escreva sua mensagem. Enter envia; Shift+Enter quebra a linha."
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
    </Pagina>
  )
}
