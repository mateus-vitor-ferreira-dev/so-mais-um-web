/**
 * Números que não são dinheiro (web#492). Dinheiro é o `formatCurrency.ts`.
 *
 * A nota média saía com ponto — "4.5" no menu, no perfil, nas avaliações e no
 * requisito de nota —, porque era `toFixed(1)`, que não sabe de português.
 */

/** `4,5` — nota de estrelas, sempre com uma casa. */
export const formatarNota = (valor: number | string) =>
  Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** `1.234,5` — número solto, como a distância em km. */
export const formatarNumero = (valor: number) => valor.toLocaleString('pt-BR')
