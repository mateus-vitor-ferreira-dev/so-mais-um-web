import api from './api'
import type { ApiEnvelope, ConversaDoDono, MensagemDeSuporte } from '../types/api'

/**
 * A conversa de suporte do dono logado (api#571).
 *
 * As rotas não recebem id de conversa: a conversa é sempre a de quem chama.
 * Nenhuma passa pelo gate de assinatura — o dono vencido é quem mais precisa
 * falar com a gente.
 */
export const suporteService = {
  /** Uma página da conversa. `antes` é o `maisAntigas` da página anterior. */
  conversa: (antes?: string): Promise<ConversaDoDono> =>
    api
      .get<ApiEnvelope<ConversaDoDono>>('/owner/suporte', { params: antes ? { antes } : undefined })
      .then((r) => r.data.data),

  enviar: (dados: { texto: string; tela?: string }): Promise<MensagemDeSuporte> =>
    api.post<ApiEnvelope<MensagemDeSuporte>>('/owner/suporte/mensagens', dados).then((r) => r.data.data),

  /** Zera as não lidas do dono e apaga o aviso do sino, do lado da api. */
  marcarLida: (): Promise<void> => api.patch('/owner/suporte/lida').then(() => undefined),
}
