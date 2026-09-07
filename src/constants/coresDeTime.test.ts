/**
 * As regras da marca do time (#314).
 *
 * A decisão foi **iniciais com cor**. O que estes testes protegem são as duas
 * propriedades que fazem a marca marcar — e que somem calado:
 *
 * 1. **A cor derivada é estável.** Se ela mudar entre renderizações, sessões ou
 *    aparelhos, o time deixa de ser reconhecível e a marca passa a atrapalhar.
 *    É por isso que ela sai do nome, e não de um sorteio.
 * 2. **As iniciais distinguem.** "Time de Futsal" não pode virar "TD": as
 *    palavras de ligação aparecem em quase todo nome de time e não separam um
 *    do outro.
 */
import { describe, it, expect } from 'vitest'
import {
  CORES_DE_TIME, corDerivadaDoNome, corDoTime, iniciaisDoTime,
} from './coresDeTime'

describe('cor derivada do nome', () => {
  it('é a mesma toda vez — é o que faz a marca marcar', () => {
    const uma = corDerivadaDoNome('Os Boleiros')
    for (let i = 0; i < 50; i++) expect(corDerivadaDoNome('Os Boleiros')).toBe(uma)
  })

  it('sempre cai dentro da paleta', () => {
    const nomes = ['A', 'Os Boleiros', 'Fúria FC', '123', 'Time do Zé', '👟 Futsal']
    for (const nome of nomes) {
      expect(CORES_DE_TIME, nome).toContain(corDerivadaDoNome(nome))
    }
  })

  it('espalha entre as cores em vez de concentrar numa', () => {
    // Não precisa ser uniforme; precisa não ser constante. Uma derivação que
    // devolvesse sempre VERDE passaria nos dois testes acima e não marcaria nada.
    const nomes = Array.from({ length: 40 }, (_, i) => `Time ${i}`)
    const distintas = new Set(nomes.map(corDerivadaDoNome))

    expect(distintas.size).toBeGreaterThan(3)
  })
})

describe('cor efetiva do time', () => {
  it('a escolhida vence a derivada', () => {
    expect(corDoTime('Os Boleiros', 'ROXO')).toBe('ROXO')
  })

  it('sem escolha, usa a derivada do nome', () => {
    expect(corDoTime('Os Boleiros', null)).toBe(corDerivadaDoNome('Os Boleiros'))
  })

  it('cor que a api conheça e este cliente não cai na derivada, e não em nada', () => {
    // Uma cor nova na api chegaria aqui como string desconhecida. Desenhar um
    // quadrado transparente seria pior do que mostrar a cor do nome.
    const desconhecida = 'TURQUESA' as never

    expect(corDoTime('Os Boleiros', desconhecida)).toBe(corDerivadaDoNome('Os Boleiros'))
  })
})

describe('iniciais', () => {
  it('usa as duas primeiras palavras que contam', () => {
    expect(iniciaisDoTime('Fúria Azul')).toBe('FA')
    expect(iniciaisDoTime('Time de Futsal')).toBe('TF')
    expect(iniciaisDoTime('Os Donos da Bola')).toBe('DB')
  })

  it('artigo à frente é descartado: "Os Boleiros" vira B, e não OB', () => {
    // A consequência que surpreende, e que é a certa. Dois times chamados
    // "Os ..." teriam a mesma primeira letra — a colisão que a marca existe
    // para evitar. Uma letra só é marca legítima.
    expect(iniciaisDoTime('Os Boleiros')).toBe('B')
  })

  it('nome de uma palavra vira uma letra', () => {
    expect(iniciaisDoTime('Fúria')).toBe('F')
  })

  it('nome feito só de ligações ainda ganha marca', () => {
    // Preferir letra alguma a uma letra errada deixaria um quadrado vazio.
    expect(iniciaisDoTime('Os Da')).toBe('OD')
  })

  it('nome vazio não quebra a tela', () => {
    expect(iniciaisDoTime('   ')).toBe('?')
  })

  it('acento sobrevive, e vira maiúscula', () => {
    expect(iniciaisDoTime('Águias Unidas')).toBe('ÁU')
  })
})
