import api from './api'
import type { ApiEnvelope, LeituraDoTempo, PrevisaoDoEspaco, PrevisaoDoTorneio } from '../types/api'

/**
 * A leitura do tempo (api#583, épico api#580).
 *
 * Toda rota de previsão é pedida **depois** da página, e nunca dentro dela: com
 * a Google fora do ar — ou a chave da Weather API ainda não configurada — estas
 * respondem 503, e a tela que as usa tem de continuar funcionando sem elas.
 */
export const previsaoService = {
  /**
   * A regra de acesso é a do detalhe da partida: quem não vê a partida privada
   * não vê a previsão dela, e o `?convite=` vale igual.
   */
  daPartida: (eventId: string, convite?: string): Promise<LeituraDoTempo> =>
    api
      .get<ApiEnvelope<LeituraDoTempo>>(`/events/${eventId}/previsao`, { params: convite ? { convite } : undefined })
      .then((r) => r.data.data),

  doDayUse: (dayUseId: string): Promise<LeituraDoTempo> =>
    api.get<ApiEnvelope<LeituraDoTempo>>(`/day-uses/${dayUseId}/previsao`).then((r) => r.data.data),

  doTorneio: (tournamentId: string): Promise<PrevisaoDoTorneio> =>
    api.get<ApiEnvelope<PrevisaoDoTorneio>>(`/tournaments/${tournamentId}/previsao`).then((r) => r.data.data),

  /** O dia `AAAA-MM-DD` da agenda do dono, com a leitura de cada quadra. Só dono ou admin. */
  doEspaco: (placeId: string, data: string): Promise<PrevisaoDoEspaco> =>
    api
      .get<ApiEnvelope<PrevisaoDoEspaco>>(`/places/${placeId}/previsao`, { params: { data } })
      .then((r) => r.data.data),
}
