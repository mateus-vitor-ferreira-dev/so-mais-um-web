import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { suporteDaEquipe } from '../services/suporte'
import { chaves } from '../lib/queryClient'
import { useEventoDoStream, useReconexaoDoStream } from './useEventoDoStream'
import type { ConversaNaCaixa } from '../types/api'

/** Uma por dono: a conversa é única por dono, então contar conversas é contar quem escreveu. */
const comMensagemNaoLida = (caixa: ConversaNaCaixa[]) => caixa.filter((c) => c.naoLidas > 0).length

/**
 * Quantos donos escreveram no suporte e ainda não foram lidos, para o contador
 * do menu do admin (web#508).
 *
 * Conta **conversas**, e não mensagens: o dono que manda cinco mensagens seguidas
 * soma um, e um segundo dono escrevendo soma outro. É a mesma leitura do
 * contador de Solicitações — quantos esperam alguém da equipe.
 *
 * **Mesma chave da caixa do suporte.** O menu e a tela de Suporte dividem a
 * requisição, e quando a tela relê a caixa (ao abrir uma conversa, ao
 * responder) o contador anda junto, sem invalidação própria.
 *
 * **Anda sozinho, em tempo real.** O evento `suporte` do stream chega a todo
 * admin a cada mensagem, dos dois lados: a do dono acende o contador, e a
 * resposta de outro admin o apaga. Depois de uma queda da conexão a caixa é
 * relida, porque o que chegou durante a queda não passou pelo evento.
 *
 * Falha da api devolve zero, como no contador de solicitações: o menu é
 * moldura, e um erro nele não pode custar a tela que a pessoa foi abrir.
 */
export function useConversasDeSuporteNaoLidas(): number {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: chaves.caixaDoSuporte(),
    queryFn: suporteDaEquipe.caixa,
    select: comMensagemNaoLida,
    retry: false,
  })

  const recarregar = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: chaves.caixaDoSuporte() })
  }, [queryClient])

  useEventoDoStream('suporte', recarregar)
  useReconexaoDoStream(recarregar)

  return data ?? 0
}
