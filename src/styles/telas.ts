import { css } from 'styled-components'

/**
 * As larguras de corte do app, num lugar só (web#511).
 *
 * Até aqui cada tela escolhia a sua: o código tinha mais de vinte números
 * diferentes em `@media` (480, 640, 768, 560, 900, 420, 520, 440…), e duas
 * telas vizinhas mudavam de forma em larguras diferentes. Três degraus bastam:
 *
 * - **celular** (até 480): uma coluna, ações empilhadas;
 * - **tablet** (até 768): a barra lateral some, tabela vira cartão, grades
 *   de quatro viram de duas;
 * - **notebook** (até 1024): o que só cabe em tela larga se reorganiza.
 *
 * O `tablet` é o mesmo 768 em que a barra lateral do `DashboardLayout` já
 * virava gaveta, e é por isso que ele é o degrau das tabelas: abaixo dele o
 * conteúdo tem a tela inteira, e ainda assim não cabe uma tabela de seis colunas.
 */
export const LARGURAS = {
  celular: 480,
  tablet: 768,
  notebook: 1024,
} as const

export type Degrau = keyof typeof LARGURAS

/**
 * As media queries, prontas para interpolar: `${ate.tablet} { ... }`.
 *
 * Só `max-width`, como o resto do app: o CSS base é o de tela larga, e cada
 * degrau abaixo ajusta. Misturar `min-width` numa base `max-width` é como duas
 * regras passam a valer ao mesmo tempo na borda.
 */
export const ate = {
  celular: `@media (max-width: ${LARGURAS.celular}px)`,
  tablet: `@media (max-width: ${LARGURAS.tablet}px)`,
  notebook: `@media (max-width: ${LARGURAS.notebook}px)`,
} as const satisfies Record<Degrau, string>

/** Tela de toque, qualquer largura: o que importa para o tamanho do alvo é o dedo, e não a tela. */
export const telaDeToque = '@media (pointer: coarse)'

/**
 * O menor alvo de toque (WCAG 2.5.8 recomenda 24px; as diretrizes da Apple e do
 * Material, 44–48px). 44px é o que cabe na barra do app sem aumentá-la.
 */
export const ALVO_DE_TOQUE = '44px'

/** O mínimo com mouse: 24px, o que a WCAG 2.2 (2.5.8) pede para ponteiro (#511, computador). */
export const ALVO_DE_PONTEIRO = '24px'

/**
 * A largura do texto corrido: ~75 caracteres por linha em Inter, o teto que a
 * skill de UI/UX pede (65–75). Em `ch` e não em px, para acompanhar o tamanho da
 * fonte. 60ch, e não 75: o `ch` é a largura do "0", mais largo que a letra média.
 */
export const LARGURA_DE_LEITURA = '60ch'

/**
 * Garante o alvo mínimo: 44px em tela de toque e 24px com mouse.
 *
 * Pelo `min-*`, e não por `height`: o botão que já é maior continua como está,
 * e o ícone de 32px ganha área clicável sem o layout do computador mudar. Os
 * 24px com mouse entraram na auditoria de computador da #511: o "Voltar" de
 * texto tinha 16px de altura.
 */
export const alvoDeToque = css`
  min-height: ${ALVO_DE_PONTEIRO};
  min-width: ${ALVO_DE_PONTEIRO};

  ${telaDeToque} {
    min-height: ${ALVO_DE_TOQUE};
    min-width: ${ALVO_DE_TOQUE};
  }
`
