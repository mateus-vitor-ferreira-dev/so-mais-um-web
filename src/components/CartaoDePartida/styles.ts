import styled from 'styled-components'
import { cartaoClicavel } from '../../styles/cartaoClicavel'

export const Cartao = styled.article`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[5]};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  min-width: 0;
  ${cartaoClicavel}
`

export const Cabecalho = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
`

export const Esporte = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};
  min-width: 0;
`

export const IconeDoEsporte = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primarySubtle};
  font-size: 20px;
`

export const NomeDoEsporte = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

/** Numa linha só: dia e hora quebrados em dois perdem a leitura de relance. */
export const Quando = styled.p`
  margin: 0;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-variant-numeric: tabular-nums;

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }
`

export const Selos = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  flex-shrink: 1;
  min-width: 0;
`

export const Local = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 0;
  overflow-wrap: anywhere;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.primary};
  }

  .quadra {
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  small {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const LinkDoMapa = styled.a`
  align-self: flex-start;
  margin-left: 20px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: none;

  &:hover { text-decoration: underline; }
`

export const Extra = styled.div`
  margin-top: ${({ theme }) => theme.spacing[1]};
`

export const Barra = styled.div<{ $progresso: number; $lotada: boolean }>`
  margin-top: ${({ theme }) => theme.spacing[2]};
  width: 100%;
  height: 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;

  div {
    height: 100%;
    width: ${({ $progresso }) => $progresso}%;
    background: ${({ theme, $lotada }) => ($lotada ? theme.colors.warning : theme.colors.primary)};
    transition: width 0.3s ease;
  }
`

export const Vagas = styled.div`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Preco = styled.p`
  margin: ${({ theme }) => theme.spacing[1]} 0 0;
  margin-top: auto;
  padding-top: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Rodape = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-top: ${({ theme }) => theme.spacing[2]};
`
