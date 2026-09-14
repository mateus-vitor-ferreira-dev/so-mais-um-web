import styled from 'styled-components'

export const Bloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
`

export const Titulo = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`

export const Dias = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Dia = styled.li`
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const Data = styled.span`
  min-width: 72px;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-variant-numeric: tabular-nums;
`

export const Leitura = styled.span`
  display: inline-flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Neutro = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Risco = styled.span`
  padding: 1px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.warningText};
  background: ${({ theme }) => theme.colors.warningLight};
`
