import { useQueries, useQuery } from '@tanstack/react-query'
import { chaves } from '../lib/queryClient'
import { previsaoService } from '../services/previsao'

/**
 * A leitura do tempo de uma partida, de um day use ou de um torneio (web#476).
 *
 * ## Separada da página, sempre
 *
 * A previsão é pedida **depois** do detalhe, e nunca junto dele: com a Google
 * fora do ar — ou a chave da Weather API sem configurar —, a api responde 503,
 * e a página tem de abrir e funcionar do mesmo jeito. Quem consome mostra
 * "previsão indisponível" e segue.
 *
 * ## As opções
 *
 * - **Dez minutos de frescor.** A api guarda a previsão por hora durante uma
 *   hora (é o contrato da Weather API); perguntar antes disso devolve o mesmo cache.
 * - **Sem nova tentativa.** O 503 é a chave que falta ou a Google fora do ar, e
 *   repetir só atrasa o aviso. O 429 do limite por IP, pior ainda: repetir o agrava.
 */
const OPCOES = { staleTime: 10 * 60_000, retry: false } as const

export function usePrevisaoDaPartida(eventId: string | undefined, convite?: string) {
  return useQuery({
    queryKey: chaves.previsaoDaPartida(eventId ?? '', convite ?? ''),
    queryFn: () => previsaoService.daPartida(eventId!, convite),
    enabled: Boolean(eventId),
    ...OPCOES,
  })
}

export function usePrevisaoDoTorneio(tournamentId: string | undefined) {
  return useQuery({
    queryKey: chaves.previsaoDoTorneio(tournamentId ?? ''),
    queryFn: () => previsaoService.doTorneio(tournamentId!),
    enabled: Boolean(tournamentId),
    ...OPCOES,
  })
}

/**
 * Quantos cartões de day use pedem previsão numa lista.
 *
 * A api limita as rotas públicas de previsão a 30 por minuto por IP, e a busca
 * de day use pode trazer uma página cheia. Os primeiros cartões são os que a
 * pessoa vê sem rolar; os outros ficam sem o selo, e a página continua igual.
 */
export const DAY_USES_COM_PREVISAO = 12

/** A leitura de cada day use da lista, na ordem dos ids — só dos primeiros. */
export function usePrevisaoDosDayUses(dayUseIds: string[]) {
  return useQueries({
    queries: dayUseIds.slice(0, DAY_USES_COM_PREVISAO).map((id) => ({
      queryKey: chaves.previsaoDoDayUse(id),
      queryFn: () => previsaoService.doDayUse(id),
      ...OPCOES,
    })),
  })
}
