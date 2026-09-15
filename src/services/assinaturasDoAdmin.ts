import { AxiosError } from 'axios'
import api from './api'
import type { ApiEnvelope, AssinaturaDoAdmin, ConviteDeCortesia, ResultadoDaCortesia } from '../types/api'

/**
 * As assinaturas, do ponto de vista do admin (api#537).
 *
 * ## Registro, e não cobrança
 *
 * Enquanto não há CNPJ não há Stripe, e a cobrança acontece por fora: Pix
 * combinado no WhatsApp, recebido no CPF. Nada aqui emite cobrança, gera QR ou
 * concilia — alguém recebeu um Pix e está afirmando que recebeu; estas rotas
 * gravam a afirmação, com o nome de quem afirmou.
 *
 * É a mesma forma da mensalidade do aluno (decisão 1 do épico api#444): a
 * plataforma anota o que aconteceu com o dinheiro, não o move.
 *
 * ## Só a manual se toca
 *
 * `renovar` e `encerrar` devolvem 422 `SUBSCRIPTION_IS_FROM_STRIPE` numa
 * assinatura de origem Stripe. A tela não deve chegar a tentar — mas a api
 * recusa de qualquer jeito, porque a regra é dela.
 */
const desembrulhar = <T>(r: { data: ApiEnvelope<T> }): T => r.data.data

export const assinaturasDoAdmin = {
  listar: () =>
    api.get<ApiEnvelope<AssinaturaDoAdmin[]>>('/admin/subscriptions').then(desembrulhar),

  /**
   * Registra uma assinatura paga por fora.
   *
   * `validoAte` é obrigatório e precisa estar no futuro — a api recusa data
   * passada, e com razão: seria registrar um pagamento que já nasce vencido, e
   * o dono levaria 402 na hora.
   */
  registrar: (dados: { userId: string; planId: string; validoAte: string }) =>
    api.post('/admin/subscriptions', dados).then((r) => r.data.data),

  /**
   * Concede um mês de teste (api#552).
   *
   * **Rota própria, e não a de registrar com um campo a mais.** As duas criam a
   * mesma linha e a diferença entre elas é uma palavra — mas registrar afirma
   * que entrou dinheiro e conceder afirma o contrário, e as consequências são
   * opostas: uma soma na Receita Mensal, a outra não pode.
   *
   * Recusa a segunda concessão ao mesmo dono com `409 CORTESIA_JA_CONCEDIDA`, e
   * a mensagem da api já traz a data da primeira — é ela que a tela mostra, em
   * vez de inventar um texto que não saberia a data.
   */
  conceder: (
    dados: ({ userId: string } | { email: string }) & { planId: string; validoAte: string },
  ): Promise<ResultadoDaCortesia> =>
    api.post<ApiEnvelope<ResultadoDaCortesia>>('/admin/subscriptions/cortesia', dados).then(desembrulhar),

  /**
   * As cortesias por e-mail esperando o cadastro (api#597).
   *
   * **`null` quando a api ainda não tem a rota.** É a detecção que deixa a web
   * ir para a produção antes da api: com `null`, a tela continua concedendo pela
   * busca de dono, como antes. Só o 404 conta como "api antiga" — outro erro é
   * erro, e a tela diz que não carregou.
   */
  convitesPendentes: (): Promise<ConviteDeCortesia[] | null> =>
    api
      .get<ApiEnvelope<ConviteDeCortesia[]>>('/admin/subscriptions/cortesia/convites')
      .then(desembrulhar)
      .catch((erro: unknown) => {
        if (erro instanceof AxiosError && erro.response?.status === 404) return null
        throw erro
      }),

  /** Estende a validade. O plano não muda: trocar de degrau é outra decisão. */
  renovar: (id: string, validoAte: string) =>
    api.patch(`/admin/subscriptions/${id}`, { validoAte }).then((r) => r.data.data),

  /**
   * Encerra a assinatura manual.
   *
   * Apesar do `DELETE`, não apaga nada: a api vira o status para `canceled` e
   * mantém a linha. O histórico de que aquele dono pagou por N meses é a única
   * memória que existe desse dinheiro — ele não passou por gateway nenhum.
   */
  encerrar: (id: string) => api.delete(`/admin/subscriptions/${id}`).then((r) => r.data.data),
}
