import styled from 'styled-components'

export const Container = styled.div`
  max-width: 900px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing[6]} ${({ theme }) => theme.spacing[4]};
`

export const Titulo = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing[1]};
`

export const Subtitulo = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin: 0 0 ${({ theme }) => theme.spacing[6]};
`

export const Secao = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[8]};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin: 0 0 ${({ theme }) => theme.spacing[3]};
  }
`

export const Dia = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: capitalize;
  margin: ${({ theme }) => theme.spacing[5]} 0 ${({ theme }) => theme.spacing[2]};

  &:first-of-type { margin-top: 0; }
`

export const CartaoDaAula = styled.article<{ $cancelada: boolean }>`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};

  /* Cancelada aparece riscada, e não some: ausência não se distingue de
     defeito, e o professor precisa saber que a aula existia. */
  opacity: ${({ $cancelada }) => ($cancelada ? 0.6 : 1)};
`

export const LinhaDaAula = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  flex-wrap: wrap;
`

export const Horario = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-variant-numeric: tabular-nums;
`

export const Onde = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing[1]};

  svg { flex-shrink: 0; color: ${({ theme }) => theme.colors.textMuted}; }
`

export const Selo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 2px ${({ theme }) => theme.spacing[2]};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
`

export const Botao = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

export const BotaoSecundario = styled(Botao)`
  background: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
`

export const Chamada = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
  padding-top: ${({ theme }) => theme.spacing[4]};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`

export const Aluno = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => theme.spacing[2]} 0;
  flex-wrap: wrap;

  & + & { border-top: 1px solid ${({ theme }) => theme.colors.borderLight}; }

  .nome { color: ${({ theme }) => theme.colors.textPrimary}; font-size: ${({ theme }) => theme.fontSizes.sm}; }
  .pendente { color: ${({ theme }) => theme.colors.textSecondary}; font-size: ${({ theme }) => theme.fontSizes.xs}; }
`

export const Opcoes = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[3]};

  label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    cursor: pointer;
  }
`

export const CartaoDaTurma = styled.article`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};

  .titulo {
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`
