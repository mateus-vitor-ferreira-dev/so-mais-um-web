import api from './api'
import type { ApiEnvelope, ConversaDoDono, ConversaNaCaixa, ConversaParaEquipe, MensagemDeSuporte } from '../types/api'

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

/**
 * O outro lado: a caixa da equipe (web#473). Só `ADMIN`; a conversa é escolhida
 * pelo id, porque a equipe atende todos os donos.
 */
export const suporteDaEquipe = {
  /** As conversas, com as não lidas primeiro. */
  caixa: (): Promise<ConversaNaCaixa[]> =>
    api.get<ApiEnvelope<ConversaNaCaixa[]>>('/admin/suporte').then((r) => r.data.data),

  conversa: (conversaId: string, antes?: string): Promise<ConversaParaEquipe> =>
    api
      .get<ApiEnvelope<ConversaParaEquipe>>(`/admin/suporte/${conversaId}`, { params: antes ? { antes } : undefined })
      .then((r) => r.data.data),

  enviar: (conversaId: string, texto: string): Promise<MensagemDeSuporte> =>
    api
      .post<ApiEnvelope<MensagemDeSuporte>>(`/admin/suporte/${conversaId}/mensagens`, { texto })
      .then((r) => r.data.data),

  /** A leitura da equipe vale para todos os admins, e apaga o aviso do sino de cada um. */
  marcarLida: (conversaId: string): Promise<void> =>
    api.patch(`/admin/suporte/${conversaId}/lida`).then(() => undefined),
}
