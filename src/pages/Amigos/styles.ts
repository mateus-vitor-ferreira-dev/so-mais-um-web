import styled from 'styled-components'
import { ALVO_DE_TOQUE, ate } from '../../styles/telas'

/* Largura, respiro e alinhamento são do layout (web#493): a página não
   repete o padding do conteúdo nem se centraliza por conta própria. */
export const Container = styled.div`
  max-width: 780px;
`

export const Abas = styled.div`
  display: flex;
  gap: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  overflow-x: auto;
  ${ate.celular} { gap: 0; }
`

export const Aba = styled.button<{ $ativa: boolean }>`
  flex-shrink: 0;
  padding: 10px 14px;
  border: 0;
  border-bottom: 2px solid
    ${({ theme, $ativa }) => ($ativa ? theme.colors.primary : 'transparent')};
  background: none;
  color: ${({ theme, $ativa }) =>
    $ativa ? theme.colors.textPrimary : theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, $ativa }) =>
    $ativa ? theme.fontWeights.semibold : theme.fontWeights.regular};
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; }
  ${ate.celular} { flex: 1 0 auto; padding-inline: ${({ theme }) => theme.spacing[2]}; }
`

export const Explicacao = styled.p`
  margin: 16px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`
