/**
 * Como o app escreve data e hora — num lugar só (web#492).
 *
 * Até aqui eram 50 chamadas a `toLocaleDateString` e `toLocaleTimeString`
 * espalhadas por 40 arquivos, cada uma com as próprias opções. O mesmo dia saía
 * "15/09/2026" num cartão e "ter., 15 de set" no outro, e o `Historico` pedia a
 * hora no idioma do navegador (`[]`), e não em português.
 *
 * Cada função abaixo é **um formato com nome**. Quem precisa de uma data
 * escolhe o formato pelo nome, e o `datas.test.ts` varre `src/` e reprova a
 * data formatada à mão fora daqui.
 *
 * Todas usam o relógio de quem está olhando, como as chamadas que substituíram.
 * A exceção é quem passa `fuso`, como a caixa do suporte, que mostra o dia de
 * Lavras para a equipe.
 */

type Instante = string | number | Date

const emData = (valor: Instante) => (valor instanceof Date ? valor : new Date(valor))

const formatar = (valor: Instante, opcoes: Intl.DateTimeFormatOptions) =>
  emData(valor).toLocaleString('pt-BR', opcoes)

/** `15/09/2026` — registro, tabela, "enviada em". */
export const dataCurta = (valor: Instante, fuso?: string) =>
  formatar(valor, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: fuso })

/** `15/09` — quando o ano é óbvio. */
export const diaEMes = (valor: Instante) => formatar(valor, { day: '2-digit', month: '2-digit' })

/** `15 de setembro de 2026` — convite, prazo. */
export const dataPorExtenso = (valor: Instante) =>
  formatar(valor, { day: '2-digit', month: 'long', year: 'numeric' })

/** `terça-feira, 15 de setembro de 2026` — o detalhe da partida. */
export const dataCompletaPorExtenso = (valor: Instante) =>
  formatar(valor, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

/** `ter., 15/09` — lista de day use. */
export const diaDaSemanaEData = (valor: Instante) =>
  formatar(valor, { weekday: 'short', day: '2-digit', month: '2-digit' })

/** `ter., 15 de set` — cartão do Início. Sem o ponto do mês abreviado no fim. */
export const diaDaSemanaEMes = (valor: Instante) =>
  formatar(valor, { weekday: 'short', day: '2-digit', month: 'short' }).replace(/\.$/, '')

/** `ter., 19:00` — o ponto do mapa. */
export const diaDaSemanaEHora = (valor: Instante) =>
  formatar(valor, { weekday: 'short', hour: '2-digit', minute: '2-digit' })

/** `19:00`. */
export const hora = (valor: Instante) => formatar(valor, { hour: '2-digit', minute: '2-digit' })

/** `15/09, 19:00` — cartão pequeno, sem ano. */
export const diaMesEHora = (valor: Instante) =>
  formatar(valor, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

/** `15/09/2026, 19:00` — histórico com hora. */
export const dataEHora = (valor: Instante) =>
  formatar(valor, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
