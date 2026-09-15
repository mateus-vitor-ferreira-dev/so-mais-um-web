import styled, { css } from 'styled-components'

const LARGURA_DO_ESMAECIDO = '28px'

/**
 * O esmaecido pinta a cor do fundo por cima do conteúdo. O padrão é o fundo de
 * cartão; quem põe a faixa sobre outro fundo declara `--fundo-da-rolagem`.
 */

export const Faixa = styled.div<{ $antes: boolean; $depois: boolean }>`
  position: relative;
  min-width: 0;
  max-width: 100%;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: ${LARGURA_DO_ESMAECIDO};
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 1;
  }
  &::before {
    left: 0;
    background: linear-gradient(to right, var(--fundo-da-rolagem, ${({ theme }) => theme.colors.bgCard}), transparent);
  }
  &::after {
    right: 0;
    background: linear-gradient(to left, var(--fundo-da-rolagem, ${({ theme }) => theme.colors.bgCard}), transparent);
  }
  ${({ $antes }) => $antes && css`&::before { opacity: 1; }`}
  ${({ $depois }) => $depois && css`&::after { opacity: 1; }`}
`

export const Trilho = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`
