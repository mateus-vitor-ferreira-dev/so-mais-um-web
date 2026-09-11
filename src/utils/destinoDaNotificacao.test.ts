import { describe, it, expect } from 'vitest'
import { destinoDaNotificacao } from './destinoDaNotificacao'

describe('destinoDaNotificacao (web#472)', () => {
  it('a resposta da equipe leva o dono à conversa de suporte', () => {
    expect(destinoDaNotificacao({ type: 'SUPPORT_MESSAGE', data: { conversaId: 'c1' } }, 'OWNER')).toBe('/owner/suporte')
  })

  it('o aviso de mensagem nova leva o admin à conversa certa (web#473)', () => {
    expect(destinoDaNotificacao({ type: 'SUPPORT_MESSAGE', data: { conversaId: 'c1' } }, 'ADMIN')).toBe('/admin/suporte/c1')
  })

  it('sem o id da conversa, leva o admin à caixa', () => {
    expect(destinoDaNotificacao({ type: 'SUPPORT_MESSAGE', data: null }, 'ADMIN')).toBe('/admin/suporte')
  })

  it('para o jogador, não leva a lugar nenhum', () => {
    expect(destinoDaNotificacao({ type: 'SUPPORT_MESSAGE', data: { conversaId: 'c1' } }, 'PLAYER')).toBeNull()
  })

  it('os outros tipos continuam só informando', () => {
    expect(destinoDaNotificacao({ type: 'PLAYER_JOINED', data: { matchId: 'm1' } }, 'OWNER')).toBeNull()
  })
})
