/**
 * Contraste entre duas cores, pela fórmula da WCAG 2.
 *
 * Existe porque cor de tema é o tipo de coisa que ninguém confere de olho: um
 * cinza claro demais parece "discreto" na tela do dia e é ilegível na de
 * outra pessoa. A #435 achou o `textMuted` em 2,43:1 — 54% do mínimo — e ele
 * estava assim desde que o tema existe, carregando o texto que aparece quando
 * uma lista está vazia.
 */

/** Mínimo para texto normal. Texto grande (≥24px, ou ≥18,66px em negrito) pede 3. */
export const MINIMO_TEXTO = 4.5

/** Mínimo para elemento não-texto: ícone, borda de campo, traço de foco. */
export const MINIMO_NAO_TEXTO = 3

function canalLinear(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** Luminância relativa de um `#rrggbb`. */
export function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  return 0.2126 * canalLinear(r) + 0.7152 * canalLinear(g) + 0.0722 * canalLinear(b)
}

/**
 * A razão de contraste entre duas cores, de 1 (idênticas) a 21 (preto e branco).
 *
 * Arredondada em duas casas: a mensagem de falha de um teste precisa ser
 * comparável com o que um medidor de contraste mostra, e não com um float de
 * dezessete dígitos.
 */
export function contraste(a: string, b: string): number {
  const [la, lb] = [luminancia(a), luminancia(b)]
  const razao = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
  return Math.round(razao * 100) / 100
}
