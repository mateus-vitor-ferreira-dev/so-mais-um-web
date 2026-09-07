import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import * as placeRequestsService from '../services/placeRequests'
import { chaves } from '../lib/queryClient'

/**
 * De quem são as solicitações contadas.
 *
 * `todas` é a fila do admin — tudo que qualquer dono mandou e ninguém
 * despachou. `minhas` é a do dono, que só vê o que ele próprio pediu.
 */
export type EscopoDeSolicitacoes = 'todas' | 'minhas'

const BUSCA = {
  todas:  () => placeRequestsService.listAll('PENDING'),
  minhas: () => placeRequestsService.listMine('PENDING'),
}

/**
 * Quantas solicitações estão pendentes, para o contador do menu lateral.
 *
 * **Quem chama é quem desenha o menu**, e essa é a correção da #356. Antes a
 * contagem era publicada pela página de destino (`useNavBadge`), então o
 * número só existia depois de a pessoa já ter ido olhar: o contador avisava
 * quem não precisava ser avisado, e sumia a cada recarga porque morava num
 * `useState` do layout.
 *
 * Uma requisição por sessão, não uma por tela: as duas montagens do menu
 * dividem a mesma entrada de cache, e o `staleTime` padrão de um minuto cobre
 * a navegação de ida e volta dentro do painel. O número precisa mudar quando o
 * admin despacha algo, e isso vem por invalidação explícita — ver
 * `useInvalidarSolicitacoesPendentes`.
 *
 * Falha da API devolve zero, e zero não desenha nada. É de propósito: o menu é
 * moldura, e um erro nele não pode custar a tela que a pessoa foi abrir.
 */
export function useSolicitacoesPendentes(escopo: EscopoDeSolicitacoes): number {
  const { data } = useQuery({
    queryKey: chaves.solicitacoesPendentes(escopo),
    queryFn: async () => {
      const res = await BUSCA[escopo]()
      return res.data.data.length
    },
    retry: false,
  })

  return data ?? 0
}

/**
 * Devolve a função que faz o contador do menu recontar.
 *
 * Aprovar, rejeitar ou abrir uma solicitação muda a fila, e o menu está na
 * tela inteira — sem isto o número fica velho justamente na hora em que alguém
 * está olhando para ele.
 */
export function useInvalidarSolicitacoesPendentes(escopo: EscopoDeSolicitacoes) {
  const queryClient = useQueryClient()
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: chaves.solicitacoesPendentes(escopo) }),
    [queryClient, escopo],
  )
}
