import type { Notification, UserRole } from '../types/api'

/**
 * Para onde leva o clique numa notificação do sino, ou `null` quando ela só
 * informa (web#472).
 *
 * Até aqui o clique só marcava como lida, e nenhum tipo levava a lugar nenhum.
 * `SUPPORT_MESSAGE` é o primeiro, e é por isso que o "para onde cada tipo leva"
 * nasce como uma função só: o próximo tipo entra como mais um `case`, e não como
 * mais um `if` espalhado no sino.
 *
 * O papel entra porque o mesmo tipo leva a lugares diferentes. A resposta da
 * equipe leva o dono à conversa dele; o aviso de mensagem nova leva o admin à
 * caixa do suporte — esse caminho é da web#473.
 */
export function destinoDaNotificacao(
  notificacao: Pick<Notification, 'type' | 'data'>,
  papel: UserRole | undefined,
): string | null {
  switch (notificacao.type) {
    case 'SUPPORT_MESSAGE':
      return papel === 'OWNER' ? '/owner/suporte' : null
    default:
      return null
  }
}
