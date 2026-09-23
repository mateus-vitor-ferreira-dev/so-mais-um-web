import styled, { css } from 'styled-components'
import { TabelaResponsiva } from '../../../components/TabelaResponsiva'
import { ALVO_DE_TOQUE, alvoDeToque, ate, telaDeToque } from '../../../styles/telas'

/**
 * A tabela de estabelecimentos: a \`TabelaResponsiva\` do app (web#511). No
 * celular cada estabelecimento vira um cartão, com abrir/fechar e o dono no pé;
 * antes a tabela tinha 775px, e as ações ficavam fora de uma tela de 390.
 */
export const Table = styled(TabelaResponsiva)`
  box-shadow: ${({ theme }) => theme.shadows.sm};

  td { vertical-align: middle; color: ${({ theme }) => theme.colors.textPrimary}; }
  th.centro, td.centro { text-align: center; }
  tbody tr:hover td { background: ${({ theme }) => theme.colors.primarySubtle}; }

  ${ate.tablet} {
    box-shadow: none;
    tbody tr:hover td { background: transparent; }
    th.centro, td.centro { text-align: left; }
    td[data-rotulo] > * { justify-self: start; }
  }
`

export const OwnerCell = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const NoOwner = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  /* \`warningText\`, e não \`warning\`: o amarelo puro no cartão fica abaixo de 4,5:1. */
  color: ${({ theme }) => theme.colors.warningText};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`

/** Aberto em verde, fechado em cinza, pelos tokens: as cores fixas eram só as do tema claro. */
export const StatusBadge = styled.span<{ $aberto: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  background: ${({ $aberto, theme }) => ($aberto ? theme.colors.successLight : theme.colors.borderLight)};
  color: ${({ $aberto, theme }) => ($aberto ? theme.colors.success : theme.colors.textMuted)};
  white-space: nowrap;
`

export const ActionGroup = styled.div`
  display: flex;
  gap: 8px;

  /* No pé do cartão, os dois botões dividem a linha. */
  ${ate.tablet} {
    flex-wrap: wrap;
    & > button { flex: 1 1 0; }
  }
`

type VariantKey = keyof typeof VARIANT

/**
 * Pelos tokens do tema: os hexadecimais de antes eram do tema claro, e no escuro
 * o "Fechar" virava um bloco rosa-claro com texto vermelho.
 */
const VARIANT = {
  secondary: css`
    background: ${({ theme }) => theme.colors.bgApp};
    border-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textSecondary};
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successLight};
    border-color: ${({ theme }) => theme.colors.success};
    color: ${({ theme }) => theme.colors.success};
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.errorLight};
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
  `,
}

export const ActionBtn = styled.button<{ variant?: VariantKey }>`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  white-space: nowrap;
  border: 1px solid;
  ${({ variant = 'secondary' }) => VARIANT[variant]}
  transition: all 0.15s;

  &:hover:not(:disabled) { opacity: 0.8; }
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

// ── Modal ─────────────────────────────────────────────────────────────────────

export const Modal = styled.div`
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
    margin: 0 0 16px;
  }

  ${ate.celular} {
    padding: 22px 20px;
  }
`

export const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 8px;
`

export const Select = styled.select`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 9px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgApp};
  outline: none;
  cursor: pointer;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    min-height: ${ALVO_DE_TOQUE};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

export const OwnerOption = styled.option``

export const PromoteDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.xs};

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.colors.border};
  }
`

export const PromoteLink = styled.button`
  background: none;
  border: none;
  padding: 6px 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  width: 100%;
  text-align: left;

  &:hover { opacity: 0.75; }

  ${telaDeToque} {
    min-height: ${ALVO_DE_TOQUE};
    padding-top: 0;
  }
`

export const PromoteBox = styled.div`
  margin-top: 12px;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgApp};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 10px;

  label {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
`

export const PromoteBtn = styled.button`
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.warning};
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warningText};
  transition: opacity 0.15s;
  align-self: flex-end;

  &:hover:not(:disabled) { opacity: 0.8; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${alvoDeToque}
  ${ate.celular} { align-self: stretch; }
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;

  /* No celular os dois botões dividem a linha, com alvo de toque inteiro. */
  ${ate.celular} {
    & > button { flex: 1 1 0; min-height: ${ALVO_DE_TOQUE}; }
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
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

/** A busca da lista (api#618): nome, cidade ou bairro, filtrada na api. */
export const Busca = styled.input`
  box-sizing: border-box;
  width: 100%;
  max-width: 420px;
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-family: inherit;
  ${alvoDeToque}

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }
`
