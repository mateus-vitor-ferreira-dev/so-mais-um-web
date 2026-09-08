import api from './api'
import type { ApiEnvelope, Aula, ChamadaDaAula } from '../types/api'

const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

/**
 * A agenda de aulas e a chamada de cada uma (api#476).
 *
 * ## As únicas rotas da escolinha **fora** do portão do plano
 *
 * A api#531 portou turma, matrícula e mensalidade sob `ESCOLINHA` e deixou
 * `aula.routes` e `chamada.routes` de fora, de propósito: o plano decide o que
 * o dono pode montar, não decide que o que já está montado deixe de funcionar.
 * A oferta comercial é paga; a operação da semana que já foi vendida, não.
 *
 * A agenda precisou ficar junto da chamada — a tela lista as aulas do dia antes
 * de abrir a chamada, e portá-la deixaria a exceção alcançável só por quem
 * soubesse o `aulaId` de cor.
 *
 * Por isso **não** há `PlanGate` na rota da chamada, e há em todas as outras
 * telas da escolinha. Ver `routes/arvore.tsx`.
 */
export const aulasService = {
  listar: (placeId: string, turmaId: string, de: string, ate: string) =>
    api.get<ApiEnvelope<Aula[]>>('/places/' + placeId + '/aulas', { params: { turmaId, de, ate } }).then(desembrulhar),
  chamada: (placeId: string, aulaId: string) =>
    api.get<ApiEnvelope<ChamadaDaAula>>(`/places/${placeId}/aulas/${aulaId}/chamada`).then(desembrulhar),
  registrar: (placeId: string, aulaId: string, marcacoes: Array<{ matriculaId: string; presente: boolean }>) =>
    api.put<ApiEnvelope<ChamadaDaAula>>(`/places/${placeId}/aulas/${aulaId}/chamada`, { marcacoes }).then(desembrulhar),
}
