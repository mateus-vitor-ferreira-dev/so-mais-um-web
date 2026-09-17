import styled from 'styled-components'
import type { TomDoPapel } from '../../constants/papeis'

export const Badge = styled.span<{ $fundo: TomDoPapel['fundo']; $texto: TomDoPapel['texto'] }>`
  background: ${({ theme, $fundo }) => theme.colors[$fundo]};
  color: ${({ theme, $texto }) => theme.colors[$texto]};
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`
