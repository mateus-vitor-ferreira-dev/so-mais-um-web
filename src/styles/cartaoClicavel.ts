import styled, { css } from 'styled-components'

/**
 * O hover e o foco de todo cartão que abre alguma coisa (web#493).
 *
 * ## Por que existe
 *
 * Cada cartão tinha o seu: o de partida subia e ganhava borda verde-clara, o de
 * torneio subia sem borda, o de time só trocava a borda, e o de partida do time
 * não fazia nada. Pior era o teclado: o cartão de partida e o de torneio abriam
 * com clique num `<article>`, e quem navega por Tab passava direto por eles.
 *
 * ## Como usar
 *
 * - O cartão inteiro leva `${cartaoClicavel}` e o `onClick`.
 * - Dentro dele, o título vira um `<AlvoDoCartao>`: é o botão que o Tab
 *   alcança. Ele não tem `onClick` próprio; o clique sobe até o cartão, então
 *   Enter e clique fazem a mesma coisa, uma vez só.
 * - O anel de foco aparece **no cartão**, e não só no título, pelo `:has`.
 *   Foco nos outros botões de dentro (entrar, ver no mapa) não acende o cartão.
 *
 * Cartão que já é um `<a>` por inteiro (Meus Times) usa só o hover.
 */
export const hoverDeCartao = css`
  transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.md};
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover { transform: none; }
  }
`

export const cartaoClicavel = css`
  cursor: pointer;
  ${hoverDeCartao}

  &:has(.alvo-do-cartao:focus-visible) {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

export const AlvoDoCartao = styled.button.attrs({ type: 'button', className: 'alvo-do-cartao' })`
  all: unset;
  cursor: pointer;
  overflow-wrap: anywhere;

  /* Onde o navegador entende :has, o anel é do cartão. Onde não entende, fica
     o do botão: melhor um anel pequeno que nenhum. */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  @supports selector(:has(*)) {
    &:focus-visible { outline: none; }
  }
`
