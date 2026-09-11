import styled, { css } from 'styled-components'
import { Link, NavLink } from 'react-router-dom'

/** Abaixo disto, a lista e a conversa aparecem uma de cada vez. */
const CELULAR = '760px'

export const Layout = styled.div<{ $comConversa: boolean }>`
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing[4]};
  align-items: start;

  @media (max-width: ${CELULAR}) {
    grid-template-columns: minmax(0, 1fr);

    /* Uma de cada vez: com conversa aberta, some a lista; sem, some o painel. */
    ${({ $comConversa }) =>
      $comConversa
        ? css`
            & > :first-child {
              display: none;
            }
          `
        : css`
            & > :last-child {
              display: none;
            }
          `}
  }
`

export const Caixa = styled.nav`
  display: flex;
  flex-direction: column;
  max-height: calc(100dvh - 180px);
  overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const Carregando = styled.p`
  margin: ${({ theme }) => theme.spacing[4]};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const ItemDaCaixa = styled(NavLink)<{ $naoLida: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2px ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[3]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.bgPage};
  }

  &.active {
    background: ${({ theme }) => theme.colors.primarySubtle};
  }

  ${({ $naoLida, theme }) =>
    $naoLida &&
    css`
      & > span:first-child {
        font-weight: ${theme.fontWeights.bold};
      }
    `}
`

export const NomeDoDono = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

export const Quando = styled.time`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Trecho = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const NaoLidas = styled.span`
  justify-self: end;
  min-width: 20px;
  padding: 0 6px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  text-align: center;
  line-height: 20px;
`

export const Painel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  min-width: 0;
`

export const Escolha = styled.p`
  margin: auto;
  padding: ${({ theme }) => theme.spacing[6]};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`

/** Só no celular: no desktop a lista já está ao lado. */
export const Voltar = styled(Link)`
  display: none;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[1]};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  text-decoration: none;

  @media (max-width: ${CELULAR}) {
    display: inline-flex;
  }
`

export const Dono = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 2px ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

export const DonoNome = styled.strong`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.md};
`

export const DonoEmail = styled.a`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const DonoLinha = styled.span`
  flex-basis: 100%;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`

export const Situacao = styled.strong<{ $tom: 'ok' | 'erro' | 'neutro' }>`
  color: ${({ theme, $tom }) =>
    $tom === 'ok' ? theme.colors.success : $tom === 'erro' ? theme.colors.error : theme.colors.textSecondary};
`
