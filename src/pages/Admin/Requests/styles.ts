import styled, { css } from 'styled-components'
import type { PlaceRequestStatus } from '../../../types/api'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../../styles/telas'

/**
 * As cores de cada status, pelos tokens do tema. Os hexadecimais de antes eram
 * só os do tema claro: no escuro, o selo e a faixa do cartão ficavam claros demais.
 */
const TOM: Record<PlaceRequestStatus, ReturnType<typeof css>> = {
  PENDING:  css`background: ${({ theme }) => theme.colors.warningLight}; color: ${({ theme }) => theme.colors.warningText};`,
  APPROVED: css`background: ${({ theme }) => theme.colors.successLight}; color: ${({ theme }) => theme.colors.success};`,
  REJECTED: css`background: ${({ theme }) => theme.colors.errorLight};   color: ${({ theme }) => theme.colors.error};`,
}
const FAIXA: Record<PlaceRequestStatus, ReturnType<typeof css>> = {
  PENDING:  css`background: ${({ theme }) => theme.colors.warning};`,
  APPROVED: css`background: ${({ theme }) => theme.colors.success};`,
  REJECTED: css`background: ${({ theme }) => theme.colors.error};`,
}

export const Tabs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;

  /* Duas abas por linha no celular. Numa linha só, "Rejeitadas" saía da tela. */
  ${ate.celular} {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`

export const Tab = styled.button<{ active?: boolean; }>`
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  border: 1px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.bgCard};
  color: ${({ theme, active }) => active ? theme.colors.textOnPrimary : theme.colors.textSecondary};
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme, active }) => active ? theme.colors.textOnPrimary : theme.colors.primary};
  }

  ${alvoDeToque}
`

export const RequestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

export const RequestCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 18px 20px 18px 24px;
  position: relative;
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${ate.celular} {
    padding: 16px 16px 16px 20px;
  }
`

export const RequestAccent = styled.div<{ $status: PlaceRequestStatus }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  ${({ $status }) => FAIXA[$status]}
`

export const RequestHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 8px;

  /* O nome e o e-mail encolhem e quebram; o selo fica inteiro ao lado. */
  & > div { min-width: 0; }
`

export const RequestTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 4px;
`

export const RequestMeta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
  overflow-wrap: anywhere;

  strong {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

export const RequestDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 12px;
  line-height: 1.5;
`

export const RequestFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
`

export const RequestSentAt = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const StatusBadge = styled.span<{ $status: PlaceRequestStatus }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  ${({ $status }) => TOM[$status]}
  white-space: nowrap;
  flex-shrink: 0;
`

export const ActionGroup = styled.div`
  display: flex;
  gap: 8px;

  /* No celular, Aprovar e Rejeitar dividem a largura do cartão. */
  ${ate.celular} {
    flex-basis: 100%;
    & > button { flex: 1 1 0; }
  }
`

export const ApproveBtn = styled.button`
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.success};
  background: ${({ theme }) => theme.colors.successLight};
  color: ${({ theme }) => theme.colors.success};
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.success};
    color: ${({ theme }) => theme.colors.textOnPrimary};
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${alvoDeToque}
`

export const RejectBtn = styled.button`
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  transition: all 0.15s;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.textOnPrimary};
  }

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${alvoDeToque}
`


export const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 16px;
`

// ── Reject Modal ──────────────────────────────────────────────────────────────

export const RejectModal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  /* A margem do modal no celular: sem ela a caixa encosta nas bordas da tela. */
  padding: 16px;
`

export const ModalOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
`

export const ModalBox = styled.div`
  position: relative;
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: ${({ theme }) => theme.shadows.lg};

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0 0 12px;
  }

  ${ate.celular} {
    padding: 22px 20px;
  }
`

export const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 12px;
`

export const ReasonInput = styled.textarea`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.bgInput};

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;

  /* No celular os botões crescem até a largura e, se não couberem lado a lado,
     empilham: dividido ao meio, "Confirmar Rejeição" quebrava em duas linhas. */
  ${ate.celular} {
    flex-wrap: wrap;
    & > button { flex: 1 1 auto; white-space: nowrap; min-height: ${ALVO_DE_TOQUE}; }
  }
`

export const CancelBtn = styled.button`
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgApp};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
`

export const ConfirmBtn = styled.button`
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: none;
  background: ${({ theme }) => theme.colors.error};
  /* O par do tema: no escuro o vermelho é claro, e texto branco nele não se lê. */
  color: ${({ theme }) => theme.colors.textOnPrimary};
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`
