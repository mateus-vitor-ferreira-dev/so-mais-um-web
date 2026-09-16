import styled from 'styled-components'
import { ALVO_DE_TOQUE, ate, telaDeToque } from '../../styles/telas'

export const Wrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`

export const StyledInput = styled.input<{ $error?: boolean; }>`
  width: 100%;
  box-sizing: border-box;
  height: 40px;
  padding: 0 40px 0 12px;
  border: 1.5px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.primary};
  }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    height: ${ALVO_DE_TOQUE};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
  ${telaDeToque} { padding-right: ${ALVO_DE_TOQUE}; }
`

export const ToggleBtn = styled.button`
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: color 0.15s;

  &:hover:not(:disabled) { color: ${({ theme }) => theme.colors.textSecondary}; }
  &:disabled { opacity: 0.35; cursor: default; }

  /* O olho de mostrar a senha tinha 16px: em tela de toque, ele ocupa a ponta do campo inteira. */
  ${telaDeToque} {
    right: 0;
    width: ${ALVO_DE_TOQUE};
    height: ${ALVO_DE_TOQUE};
  }
`
