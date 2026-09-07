import api from './api'
import type { ApiEnvelope, AulaDoProfessor, TurmaDoProfessor } from '../types/api'

const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

/**
 * A área do professor (api#451, api#484).
 *
 * As três rotas moram em `/me`, e não em `/places/:placeId`: dar aula em duas
 * academias é o caso comum, e uma rota por espaço obrigaria a escolher o espaço
 * antes de ver qualquer coisa. O professor pensa em "minha próxima aula", que
 * pode ser em qualquer uma delas.
 *
 * A porta é o **vínculo**, não o papel: quem não dá aula em lugar nenhum leva
 * 403 — e não lista vazia, que seria indistinguível de "ainda não tenho turma".
 *
 * **`GET /me/turmas/:turmaId` existe na api e não está aqui.** É o detalhe da
 * turma, e é a única rota do professor que devolve o **contato do aluno**.
 * Trazê-la exigiria decidir uma pergunta que a api#451 deixou aberta — *"o que
 * o professor vê do aluno; ver telefone e histórico é útil e é dado de outra
 * pessoa"* — e essa decisão não se toma de passagem, ao montar uma tela de
 * agenda. Quando alguém a tomar, é uma linha aqui.
 */
export const professorService = {
  /** As turmas ativas dele, em todos os espaços em que tem vínculo. */
  minhasTurmas: () =>
    api.get<ApiEnvelope<TurmaDoProfessor[]>>('/me/turmas').then(desembrulhar),

  /**
   * A agenda, numa janela.
   *
   * `de`/`ate` em ISO. A api tem padrão e teto próprios (56 dias), e recusa
   * janela invertida — o front manda a janela que a tela mostra e deixa o
   * limite onde ele é regra.
   */
  minhasAulas: (de: string, ate: string) =>
    api.get<ApiEnvelope<AulaDoProfessor[]>>('/me/aulas', { params: { de, ate } }).then(desembrulhar),
}
