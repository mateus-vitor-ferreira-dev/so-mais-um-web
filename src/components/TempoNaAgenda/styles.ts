import styled from 'styled-components'
import { ALVO_DE_TOQUE, ate } from '../../styles/telas'

export const Secao = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
  padding: 24px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  /* A faixa do tempo de cada quadra já é um cartão dentro deste: com 24px aqui,
     sobravam cinco horas à vista numa tela de 360. */
  ${ate.celular} {
    padding: 16px;
  }
`

export const Topo = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
`

export const Titulo = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Explicacao = styled.p`
  margin: 4px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Controles = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

export const Campo = styled.label`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};

  select,
  input {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.bgInput};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    max-width: 100%;
  }

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    select,
    input {
      min-height: ${ALVO_DE_TOQUE};
      font-size: ${({ theme }) => theme.fontSizes.md};
    }
  }
`

export const Aviso = styled.p`
  margin: 0;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warningText};
  background: ${({ theme }) => theme.colors.warningLight};
`

export const Quadras = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;

  ${ate.celular} {
    grid-template-columns: minmax(0, 1fr);
  }
`
