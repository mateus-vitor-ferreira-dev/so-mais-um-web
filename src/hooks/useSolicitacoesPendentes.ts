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

/**
 * Como contar em cada escopo.
 *
 * A fila do admin é paginada (api#618): contar o tamanho da lista pararia no
 * tamanho da página. Por isso ela pede uma página de um só e lê o `total`, que
 * a api conta com o filtro. A do dono segue inteira — é o punhado dele.
 */
const CONTAR = {
  todas: async () => {
    const corpo = await placeRequestsService.listAll('PENDING', { limite: 1 })
    return corpo.pagina?.total ?? corpo.data.length
  },
  minhas: async () => (await placeRequestsService.listMine('PENDING')).data.data.length,
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
    queryFn: () => CONTAR[escopo](),
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
