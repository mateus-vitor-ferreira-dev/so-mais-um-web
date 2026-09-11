import { describe, it, expect } from 'vitest'
import { destinoDaNotificacao } from './destinoDaNotificacao'

describe('destinoDaNotificacao (web#472)', () => {
  it('a resposta da equipe leva o dono à conversa de suporte', () => {
    expect(destinoDaNotificacao({ type: 'SUPPORT_MESSAGE', data: { conversaId: 'c1' } }, 'OWNER')).toBe('/owner/suporte')
  })

  it('para o admin, ainda não leva a lugar nenhum — o caminho dele é da web#473', () => {
    expect(destinoDaNotificacao({ type: 'SUPPORT_MESSAGE', data: { conversaId: 'c1' } }, 'ADMIN')).toBeNull()
  })

  it('os outros tipos continuam só informando', () => {
    expect(destinoDaNotificacao({ type: 'PLAYER_JOINED', data: { matchId: 'm1' } }, 'OWNER')).toBeNull()
  })
})
