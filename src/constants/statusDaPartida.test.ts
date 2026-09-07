/**
 * O vocabulário de status, e por que ele é um só (#315).
 *
 * Três páginas tinham o próprio mapa e os três discordavam — em gênero
 * (`Lotado` × `Lotada`) e, no `WAITING`, em palavra (`Aguardando` × `Aberta`).
 * Ninguém errou: não havia onde acertar.
 *
 * O teste que carrega este arquivo é o do gênero. É a divergência que volta
 * sozinha: quem escrever a próxima tela vai concordar com o substantivo que
 * tiver na cabeça, e "Partida · Lotado" passa por revisão sem ninguém notar.
 */
import { describe, it, expect } from 'vitest'
import { STATUS_DA_PARTIDA, rotuloDoStatus } from './statusDaPartida'

describe('status da partida', () => {
  it('concorda com "partida", que é a palavra do produto', () => {
    // "Criar Partida", "Minhas Partidas", "Nenhuma partida disponível" — o
    // substantivo é feminino em toda a interface.
    expect(STATUS_DA_PARTIDA.FULL.label).toBe('Lotada')
    expect(STATUS_DA_PARTIDA.FINISHED.label).toBe('Finalizada')
    expect(STATUS_DA_PARTIDA.CANCELLED.label).toBe('Cancelada')
  })

  it('WAITING é "Aguardando", e não "Aberta"', () => {
    /*
     * "Aberta" colidiria com o vocabulário de visibilidade — Pública, Por
     * link, Privada —, e seria lida como "qualquer um entra". Uma partida
     * WAITING pode ser privada e exigir convite: o status fala de vaga, não
     * de quem pode ocupá-la.
     */
    expect(STATUS_DA_PARTIDA.WAITING.label).toBe('Aguardando')
  })

  it('todo status tem rótulo, tom e bolinha — as três telas pedem coisas diferentes', () => {
    for (const [chave, rotulo] of Object.entries(STATUS_DA_PARTIDA)) {
      expect(rotulo.label, chave).toBeTruthy()
      expect(rotulo.tom, chave).toBeTruthy()
      expect(rotulo.emoji, chave).toBeTruthy()
    }
  })

  it('status que a api ainda não tinha não quebra a tela', () => {
    // A api pode ganhar um estado antes de o front saber dele. Melhor mostrar
    // o código cru do que derrubar a página inteira.
    const desconhecido = rotuloDoStatus('POSTPONED')

    expect(desconhecido.label).toBe('POSTPONED')
    expect(desconhecido.tom).toBe('fim')
  })
})
