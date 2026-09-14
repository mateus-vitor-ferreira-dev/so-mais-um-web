const formatador = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Centavos (como a API guarda o preço do plano) para "R$ 79,90". */
export function formatarPrecoCentavos(centavos: number): string {
  return formatador.format(centavos / 100)
}

/**
 * Reais para "R$ 22,50" — o valor como o app escreve dinheiro (web#491).
 *
 * Aceita string porque o `Decimal` do Prisma chega assim no JSON. Até aqui cada
 * tela fazia a própria conta: "R$ 20.00" com ponto no Quero Jogar, "R$ 23" no
 * Início — que arredondava R$ 22,50 para cima e mostrava um preço que ninguém
 * cobra. Valor que não é número vira "R$ 0,00", e não "R$ NaN".
 */
export function formatarReais(valor: number | string | null | undefined): string {
  const numero = Number(valor)
  return formatador.format(Number.isFinite(numero) ? numero : 0)
}

/** O valor por pessoa de uma partida: o total dividido pelas vagas. Sem vagas, zero. */
export function valorPorPessoa(total: number | string | null | undefined, vagas: number | null | undefined): string {
  const quantas = Number(vagas)
  return formatarReais(quantas > 0 ? Number(total) / quantas : 0)
}

/** `120,00` — o valor sem o "R$", para quando a frase já tem o símbolo. */
export function formatarValor(valor: number | string): string {
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** `R$ 250` ou `R$ 58,33`: centavo só quando existe — o preço de uma cotação. */
export function formatarReaisCurtos(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(valor) ? 0 : 2, maximumFractionDigits: 2 })}`
}
