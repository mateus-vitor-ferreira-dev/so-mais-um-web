/**
 * O contraste dos temas, medido a cada suíte (#435).
 *
 * ## Por que isto é teste, e não uma medição de uma vez
 *
 * A #435 mediu o `textMuted` em 2,43:1 e corrigiu. Sem conferência executável,
 * o próximo token entra do mesmo jeito: cor de tema é escolhida olhando a tela
 * de quem escolhe, e "está discreto" é indistinguível de "está ilegível" a olho
 * nu. Foi assim que o valor antigo sobreviveu desde a criação do tema, dentro
 * de 108 usos.
 *
 * ## O que é medido, e contra o quê
 *
 * A escala de texto contra as três superfícies em que o app a desenha. O pior
 * caso é o que vale: um token que passa no cartão branco e reprova no fundo da
 * área do jogador está reprovado.
 */
import { describe, it, expect } from 'vitest'
import { lightTheme, darkTheme } from './theme'
import { contraste, MINIMO_TEXTO, MINIMO_NAO_TEXTO } from './contraste'

const TEMAS = [
  { nome: 'claro', tema: lightTheme },
  { nome: 'escuro', tema: darkTheme },
] as const

/** As superfícies em que texto é desenhado. */
const SUPERFICIES = ['bgApp', 'bgPage', 'bgCard'] as const

/** Os três níveis da escala de texto. */
const ESCALA = ['textPrimary', 'textSecondary', 'textMuted'] as const

/**
 * Pares de texto sobre superfície **colorida** que hoje reprovam, e que esta
 * issue não corrige.
 *
 * Não é tolerância: é dívida nomeada. Os dois mexem em cor de marca — o verde
 * do produto e o vermelho de erro —, e trocá-las é decisão de produto que não
 * cabia na #435, cujo assunto era a escala neutra de texto. Ver web#436.
 *
 * O teste abaixo garante que esta lista não apodreça: par que passar a
 * alcançar o mínimo tem de sair daqui.
 */
const DIVIDA_CONHECIDA: { fg: string; bg: string; motivo: string }[] = [
  { fg: 'textOnPrimary', bg: 'primary', motivo: 'branco sobre o verde da marca — botão primário (web#436)' },
  { fg: 'error', bg: 'errorLight', motivo: 'vermelho sobre o próprio fundo claro dele (web#436)' },
]

describe('contraste da escala de texto', () => {
  it.each(TEMAS)('$nome: todo nível de texto alcança o mínimo em toda superfície', ({ tema }) => {
    const reprovados: string[] = []

    for (const texto of ESCALA) {
      for (const fundo of SUPERFICIES) {
        const razao = contraste(tema.colors[texto], tema.colors[fundo])
        if (razao < MINIMO_TEXTO) {
          reprovados.push(
            `${texto} (${tema.colors[texto]}) sobre ${fundo} (${tema.colors[fundo]}): ` +
              `${razao} — mínimo ${MINIMO_TEXTO}`,
          )
        }
      }
    }

    expect(reprovados, reprovados.join('\n')).toEqual([])
  })

  /**
   * O `textMuted` também pinta ícone e placeholder — oito lugares. Ele já é
   * cobrido pela regra de texto acima, que é mais dura; este teste existe para
   * o dia em que alguém decidir aliviá-lo por ser "só decoração", e descobrir
   * aqui que mesmo assim há um piso.
   */
  it.each(TEMAS)('$nome: o textMuted serve de ícone sem cair abaixo do piso não-texto', ({ tema }) => {
    for (const fundo of SUPERFICIES) {
      expect(
        contraste(tema.colors.textMuted, tema.colors[fundo]),
        `textMuted sobre ${fundo}`,
      ).toBeGreaterThanOrEqual(MINIMO_NAO_TEXTO)
    }
  })

  it('a hierarquia dos três níveis continua visível', () => {
    // Três tokens que passam mas são indistinguíveis entre si são três tokens
    // usados ao acaso — que é como a dívida da #315 começou.
    for (const { nome, tema } of TEMAS) {
      const entreNiveis = contraste(tema.colors.textSecondary, tema.colors.textMuted)
      expect(entreNiveis, `${nome}: secondary x muted`).toBeGreaterThan(1.15)
    }
  })
})

describe('dívida de contraste conhecida', () => {
  it('cada par listado ainda reprova — lista que guarda item resolvido é lista que ninguém lê', () => {
    for (const { fg, bg, motivo } of DIVIDA_CONHECIDA) {
      const pior = Math.min(
        ...TEMAS.map(({ tema }) => contraste(
          tema.colors[fg as keyof typeof tema.colors],
          tema.colors[bg as keyof typeof tema.colors],
        )),
      )

      expect(pior, `${fg}/${bg} já alcança ${MINIMO_TEXTO}: tire da lista. ${motivo}`)
        .toBeLessThan(MINIMO_TEXTO)
    }
  })
})
