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
 * conversa certa na caixa do suporte (web#473), pelo `conversaId` do `data`.
 */
export function destinoDaNotificacao(
  notificacao: Pick<Notification, 'type' | 'data'>,
  papel: UserRole | undefined,
): string | null {
  switch (notificacao.type) {
    case 'SUPPORT_MESSAGE':
      if (papel === 'OWNER') return '/owner/suporte'
      if (papel === 'ADMIN') {
        const conversaId = notificacao.data?.conversaId
        return conversaId ? `/admin/suporte/${conversaId}` : '/admin/suporte'
      }
      return null
    default:
      return null
  }
}
