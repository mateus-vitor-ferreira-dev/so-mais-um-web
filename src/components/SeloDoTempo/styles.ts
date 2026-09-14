import styled from 'styled-components'
import type { RiscoDoTempo } from '../../types/api'

export const Selo = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-variant-numeric: tabular-nums;
`

export const Risco = styled.span<{ $risco: RiscoDoTempo }>`
  display: inline-flex;
  padding: 1px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $risco }) => ($risco === 'ALTO' ? theme.colors.error : theme.colors.warningText)};
  background: ${({ theme, $risco }) => ($risco === 'ALTO' ? theme.colors.errorLight : theme.colors.warningLight)};
`
