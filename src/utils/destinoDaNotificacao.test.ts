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

describe('destinoDaNotificacao — aviso de tempo (web#476)', () => {
  it('o aviso da partida abre a partida', () => {
    expect(
      destinoDaNotificacao({ type: 'WEATHER_ALERT', data: { atividade: 'PARTIDA', matchId: 'm1' } }, 'PLAYER'),
    ).toBe('/partida/m1')
  })

  it('o aviso do day use abre as entradas dele, que é a tela do dono', () => {
    expect(
      destinoDaNotificacao({ type: 'WEATHER_ALERT', data: { atividade: 'DAY_USE', dayUseId: 'd1' } }, 'OWNER'),
    ).toBe('/owner/day-uses/d1/entradas')
  })

  it('o aviso do jogo de torneio abre o torneio', () => {
    expect(
      destinoDaNotificacao(
        { type: 'WEATHER_ALERT', data: { atividade: 'JOGO_DE_TORNEIO', tournamentId: 't1', tournamentMatchId: 'j1' } },
        'PLAYER',
      ),
    ).toBe('/torneios/t1')
  })

  it('sem a atividade ou sem o id, só informa', () => {
    expect(destinoDaNotificacao({ type: 'WEATHER_ALERT', data: null }, 'PLAYER')).toBeNull()
    expect(destinoDaNotificacao({ type: 'WEATHER_ALERT', data: { atividade: 'PARTIDA' } }, 'PLAYER')).toBeNull()
  })
})
