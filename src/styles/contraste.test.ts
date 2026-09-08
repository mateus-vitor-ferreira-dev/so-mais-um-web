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
 * Cores semânticas que o app usa como **texto**, e sobre o quê.
 *
 * Elas entraram aqui na #436, saindo de uma lista de dívida conhecida. Em nível
 * 500 — o tom vivo — são cor de preenchimento, não de leitura: sobre o fundo
 * claro davam 2,05 a 3,59, e o branco sobre o verde do botão primário dava
 * 2,28, que era metade do mínimo no elemento mais clicado do produto.
 */
const SEMANTICAS_COMO_TEXTO = ['primary', 'primaryDark', 'success', 'warning', 'error', 'info'] as const

/**
 * Texto sobre superfície **colorida** — o par não passa por nenhuma das
 * superfícies neutras, então precisa ser conferido nomeadamente.
 */
const SOBRE_COR: { fg: string; bg: string; onde: string }[] = [
  { fg: 'textOnPrimary', bg: 'primary', onde: 'botão primário' },
  { fg: 'primaryDark', bg: 'primaryLight', onde: 'selos verdes, como o CaptainBadge' },
  { fg: 'warningText', bg: 'warningLight', onde: 'selo de aviso' },
  { fg: 'error', bg: 'errorLight', onde: 'texto de erro na faixa' },
  { fg: 'textPrimary', bg: 'errorLight', onde: 'ErrorState' },
  { fg: 'accent', bg: 'accentLight', onde: 'selo de cortesia, no painel de assinaturas' },
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

describe('contraste das cores semânticas', () => {
  it.each(TEMAS)('$nome: cor semântica usada como texto alcança o mínimo', ({ tema }) => {
    const reprovados: string[] = []

    for (const cor of SEMANTICAS_COMO_TEXTO) {
      for (const fundo of SUPERFICIES) {
        const razao = contraste(tema.colors[cor], tema.colors[fundo])
        if (razao < MINIMO_TEXTO) {
          reprovados.push(
            `${cor} (${tema.colors[cor]}) sobre ${fundo} (${tema.colors[fundo]}): ` +
              `${razao} — mínimo ${MINIMO_TEXTO}`,
          )
        }
      }
    }

    expect(reprovados, reprovados.join('\n')).toEqual([])
  })

  it.each(TEMAS)('$nome: texto sobre superfície colorida alcança o mínimo', ({ tema }) => {
    const reprovados: string[] = []

    for (const { fg, bg, onde } of SOBRE_COR) {
      const frente = tema.colors[fg as keyof typeof tema.colors]
      const fundo = tema.colors[bg as keyof typeof tema.colors]
      const razao = contraste(frente, fundo)

      if (razao < MINIMO_TEXTO) {
        reprovados.push(`${onde} — ${fg} (${frente}) sobre ${bg} (${fundo}): ${razao}`)
      }
    }

    expect(reprovados, reprovados.join('\n')).toEqual([])
  })

  /**
   * O botão primário é o caso que a #436 nasceu para consertar, e ele tem uma
   * particularidade: a correção é **oposta** nos dois temas. No claro o verde
   * escureceu para o branco caber em cima; no escuro o verde ficou claro e quem
   * mudou foi o texto, que virou quase preto.
   *
   * Sem este teste, alguém "uniformizando" o `textOnPrimary` de volta para
   * branco nos dois temas reproduziria o defeito só no escuro — onde é mais
   * difícil de notar.
   */
  it('o texto do botão é claro num tema e escuro no outro, de propósito', () => {
    expect(lightTheme.colors.textOnPrimary).not.toBe(darkTheme.colors.textOnPrimary)
    expect(contraste(lightTheme.colors.textOnPrimary, lightTheme.colors.primary))
      .toBeGreaterThanOrEqual(MINIMO_TEXTO)
    expect(contraste(darkTheme.colors.textOnPrimary, darkTheme.colors.primary))
      .toBeGreaterThanOrEqual(MINIMO_TEXTO)
  })
})
