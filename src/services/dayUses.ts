import api from './api'
import type {
  ApiEnvelope,
  BuscaDeDayUse,
  DayUse,
  DayUseInput,
  EntradaInput,
  EntradaNoDayUse,
  EntradasDoDayUse,
} from '../types/api'

/**
 * O day use de uma quadra, e quem está dentro dele (api#505).
 *
 * ## Tudo aqui é do dono
 *
 * A api guarda estas rotas com `isPlaceOwnerOrAdmin` e, desde a api#531,
 * também com `requireFuncionalidade("DAY_USE")`. Funcionalidade própria, e não
 * junto da escolinha: o day use vende sozinho — quadra que só aluga hora ganha
 * dinheiro com ele sem nunca abrir uma turma. A tela acompanha: há `PlanGate`
 * na rota (`routes/arvore.tsx`).
 *
 * ## `cancelar` é `DELETE`, e não apaga
 *
 * O verbo é o que o cliente espera para "cancelar"; o efeito é carimbar
 * `canceladoEm`. O day use guarda quem pagou quanto naquele dia, e apagá-lo
 * levaria o registro do dinheiro junto. Some da listagem padrão e volta com
 * `?incluirCancelados=true`.
 *
 * ## `removerEntrada` é `DELETE`, e APAGA
 *
 * O oposto do `tirarDaTurma` do `matriculas.ts`, e a diferença é o que cada
 * linha significa: a matrícula é um vínculo que a mensalidade referencia; a
 * entrada é um fato pontual e nada aponta para ela. Entrada errada não é
 * história, é digitação.
 *
 * Quem esteve e **não** pagou se registra com `pagoEm` nulo — não apagando.
 */
const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const dayUsesService = {
  /**
   * A busca **pública**, para o jogador (api#519).
   *
   * Rota própria, e não dentro do `searchEvents`: day use não tem organizador,
   * vagas nem rateio, e a api decidiu não misturar os dois numa união
   * discriminada. A junção acontece na tela.
   *
   * Não passa token de propósito — a api não usa `identify` aqui, porque day
   * use é sempre público e a sessão não mudaria a resposta.
   */
  buscar: (filtros: { city?: string; courtType?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams(
      Object.entries(filtros).flatMap(([k, v]) => (v === undefined || v === '' ? [] : [[k, String(v)]])),
    ).toString()
    return api.get<ApiEnvelope<BuscaDeDayUse>>(`/day-uses${query ? `?${query}` : ''}`).then(desembrulhar)
  },

  listar: (placeId: string, incluirCancelados = false) =>
    api
      .get<ApiEnvelope<DayUse[]>>(
        `/places/${placeId}/day-uses${incluirCancelados ? '?incluirCancelados=true' : ''}`,
      )
      .then(desembrulhar),

  /**
   * A que horas o espaço fecha no dia deste `inicio` — ou `null`.
   *
   * **`null` não é erro.** É o espaço sem expediente cadastrado para aquele dia
   * da semana, e é o que faz a tela pedir o horário à mão. O expediente é
   * recente (api#454) e a maior parte dos espaços ainda não o tem.
   */
  sugestaoDeFim: (placeId: string, inicio: string) =>
    api
      .get<ApiEnvelope<{ fim: string | null }>>(
        `/places/${placeId}/day-uses/sugestao-de-fim?inicio=${encodeURIComponent(inicio)}`,
      )
      .then(desembrulhar)
      .then((d) => d.fim),

  criar: (placeId: string, dados: DayUseInput) =>
    api.post<ApiEnvelope<DayUse>>(`/places/${placeId}/day-uses`, dados).then(desembrulhar),

  atualizar: (placeId: string, dayUseId: string, dados: Partial<Omit<DayUseInput, 'courtId'>>) =>
    api
      .patch<ApiEnvelope<DayUse>>(`/places/${placeId}/day-uses/${dayUseId}`, dados)
      .then(desembrulhar),

  cancelar: (placeId: string, dayUseId: string) =>
    api.delete<ApiEnvelope<DayUse>>(`/places/${placeId}/day-uses/${dayUseId}`).then(desembrulhar),

  entradas: (placeId: string, dayUseId: string) =>
    api
      .get<ApiEnvelope<EntradasDoDayUse>>(`/places/${placeId}/day-uses/${dayUseId}/entradas`)
      .then(desembrulhar),

  registrarEntrada: (placeId: string, dayUseId: string, dados: EntradaInput) =>
    api
      .post<ApiEnvelope<EntradaNoDayUse>>(`/places/${placeId}/day-uses/${dayUseId}/entradas`, dados)
      .then(desembrulhar),

  /**
   * Corrige nome e contato, e marca ou desmarca o pagamento.
   *
   * `faixa` e `valor` **não** entram: os dois congelaram na entrada, e a api
   * recusa recebê-los aqui de propósito. Entrada com a faixa errada se remove
   * e se lança de novo.
   */
  atualizarEntrada: (
    placeId: string,
    dayUseId: string,
    entradaId: string,
    dados: { nome?: string; contato?: string; pago?: boolean },
  ) =>
    api
      .patch<ApiEnvelope<EntradaNoDayUse>>(
        `/places/${placeId}/day-uses/${dayUseId}/entradas/${entradaId}`,
        dados,
      )
      .then(desembrulhar),

  removerEntrada: (placeId: string, dayUseId: string, entradaId: string) =>
    api.delete(`/places/${placeId}/day-uses/${dayUseId}/entradas/${entradaId}`).then(() => undefined),
}
