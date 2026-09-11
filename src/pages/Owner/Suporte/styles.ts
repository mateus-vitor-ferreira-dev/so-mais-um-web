import styled from 'styled-components'

export const Pagina = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[3]};
  max-width: 820px;
`

/** O que esperar do atendimento: fixo, no topo, sem cara de alerta. */
export const Horario = styled.p`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  margin: 0;
  padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`
