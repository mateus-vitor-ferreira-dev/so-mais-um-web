import styled from 'styled-components'
import { ate } from '../../styles/telas'

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 18px 20px 18px 24px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${ate.tablet} {
    padding: 14px 14px 14px 18px;
  }
`

export const Accent = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 14px 0 0 14px;
`

export const Label = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 6px;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  /* Na grade de duas colunas o rótulo quebra linha em vez de ser cortado pelo
     overflow do cartão ("USUÁRIOS COMUNS" saía "USUÁRIC", web#511). */
  ${ate.tablet} {
    letter-spacing: 0.02em;
    overflow-wrap: anywhere;
    hyphens: auto;
  }
`

export const Value = styled.p`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  line-height: 1;

  ${ate.tablet} {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    overflow-wrap: anywhere;
  }
`
