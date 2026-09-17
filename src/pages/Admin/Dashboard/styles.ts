import styled from 'styled-components'
import { TabelaResponsiva } from '../../../components/TabelaResponsiva'
import { GradeDeNumeros } from '../../../components/GradeDeNumeros'
import { alvoDeToque, ate } from '../../../styles/telas'

export const Container = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
  max-width: 1400px;
  margin: 0 auto;

  /* No celular o \`Content\` do layout já dá a margem: somadas, as duas
     deixavam 40px de cada lado numa tela de 360. */
  ${ate.tablet} {
    padding: 0;
  }
`

export const Header = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
  h1 {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: bold;
  }
  p {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-top: 4px;
  }
`

/**
 * Os quatro números do topo: a grade comum do app (web#511). O \`auto-fit\` de
 * antes empilhava um por linha no celular, e só os números ocupavam a primeira tela.
 */
export const KpiGrid = GradeDeNumeros

export const KpiCard = styled.div<{ $borderColor?: string; }>`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-left: 4px solid ${({ $borderColor }) => $borderColor};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[5]};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  h2 {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
    font-weight: bold;
    margin-bottom: 8px;
  }
  p {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: bold;
  }

  /* Meia tela por cartão: "R$ 1919,20" em 30px não cabia em 150px. */
  ${ate.tablet} {
    padding: ${({ theme }) => theme.spacing[4]};
    min-width: 0;
    p {
      font-size: ${({ theme }) => theme.fontSizes.xl};
      overflow-wrap: anywhere;
    }
  }
`

export const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  h2 {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

/**
 * As tabelas de contratos e pagamentos: a \`TabelaResponsiva\` do app (web#511).
 * No celular cada contrato vira um cartão; antes a tabela tinha 641px, e o
 * valor, o status e o "Ver Detalhes" ficavam fora de uma tela de 390.
 */
export const Table = styled(TabelaResponsiva)`
  box-shadow: ${({ theme }) => theme.shadows.sm};

  td { vertical-align: middle; color: ${({ theme }) => theme.colors.textPrimary}; }
  td.vazio { text-align: center; }
  /* "Só+1 Premium" numa linha só, e não "Só+1" em cima de "Premium". */
  td.plano, td.valor { white-space: nowrap; }

  ${ate.tablet} {
    box-shadow: none;
    td[data-rotulo] > * { justify-self: start; }
    td.vazio { text-align: left; color: ${({ theme }) => theme.colors.textSecondary}; }
  }
`

export const Badge = styled.span<{ $status?: string; }>`
  display: inline-block;
  white-space: nowrap;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: bold;
  background: ${({ $status, theme }) =>
    $status === 'Ativo' || $status === 'Pago'
      ? theme.colors.successLight
      : $status === 'Pendente'
        ? theme.colors.warningLight
        : theme.colors.errorLight};
  color: ${({ $status, theme }) =>
    $status === 'Ativo' || $status === 'Pago'
      ? theme.colors.success
      : $status === 'Pendente'
        ? theme.colors.warningText
        : theme.colors.error};
`

/**
 * O selo do status do contrato, na tabela e no detalhe, pelos tokens do tema.
 *
 * Um só para os dois lugares: a tabela usava o \`Badge\` com "ativo ou o resto",
 * e "Cancelada" saía amarela, como um pendente. No detalhe, as cores fixas eram
 * as do tema claro, e no escuro o selo virava uma mancha clara.
 */
export const SeloDeStatus = styled.span<{ $status: string }>`
  display: inline-block;
  white-space: nowrap;
  padding: 3px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  background: ${({ $status, theme }) =>
    $status === 'active' ? theme.colors.successLight
      : $status === 'trialing' ? theme.colors.infoLight
        : $status === 'past_due' ? theme.colors.errorLight
          : theme.colors.borderLight};
  /* Trial e neutro com texto de leitura, e não o tom do selo: no claro, \`info\`
     sobre \`infoLight\` dá 4,24:1 e \`textMuted\` sobre \`borderLight\`, 4,33:1,
     os dois abaixo dos 4,5:1. O fundo continua dizendo qual é o status. */
  color: ${({ $status, theme }) =>
    $status === 'active' ? theme.colors.success
      : $status === 'trialing' ? theme.colors.textPrimary
        : $status === 'past_due' ? theme.colors.error
          : theme.colors.textSecondary};
`

export const DetailModal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  /* A margem do modal no celular: sem ela a caixa encosta nas bordas da tela. */
  padding: 16px;
`

export const DetailOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
`

export const DetailBox = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  display: flex;
  flex-direction: column;
  gap: 14px;

  ${ate.celular} {
    padding: 20px;
  }
`

export const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`

export const DetailTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }

  ${alvoDeToque}
  ${ate.tablet} { margin-right: -12px; }
`

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  &:last-child { border-bottom: none; }
`

export const DetailLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
`

export const DetailValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;
  min-width: 0;
  /* O e-mail do dono inteiro, quebrado, e não passando da borda do modal. */
  overflow-wrap: anywhere;
`

export const ActionButton = styled.button`
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.primary};
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  transition: 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary};
  }

  ${alvoDeToque}
`
