import styled from 'styled-components'
import type { RiscoDoTempo } from '../../types/api'

export const Faixa = styled.ul`
  display: flex;
  gap: 4px;
  margin: 0;
  padding: 0 0 4px;
  list-style: none;
  overflow-x: auto;
`

/**
 * A borda carrega o risco, e o fundo continua neutro. Fundo vermelho em seis
 * horas seguidas de uma tarde de chuva viraria uma mancha, e a temperatura em
 * cima dele deixaria de se ler.
 */
export const Hora = styled.li<{ $risco: RiscoDoTempo }>`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 48px;
  padding: 6px 4px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid
    ${({ theme, $risco }) =>
      $risco === 'ALTO' ? theme.colors.error : $risco === 'ATENCAO' ? theme.colors.warning : theme.colors.border};
  box-shadow: ${({ theme, $risco }) => ($risco === 'ALTO' ? `inset 0 0 0 1px ${theme.colors.error}` : 'none')};
  font-variant-numeric: tabular-nums;
`

export const Rotulo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Icone = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: 1;
`

export const Temperatura = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Chuva = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`
