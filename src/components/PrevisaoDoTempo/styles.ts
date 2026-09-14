import styled from 'styled-components'
import type { RiscoDoTempo } from '../../types/api'

export const Bloco = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
`

export const Titulo = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`

export const Frase = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Neutro = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Risco = styled.p<{ $risco: RiscoDoTempo }>`
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $risco }) => ($risco === 'ALTO' ? theme.colors.error : theme.colors.warningText)};
  background: ${({ theme, $risco }) => ($risco === 'ALTO' ? theme.colors.errorLight : theme.colors.warningLight)};
`
