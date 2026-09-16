import styled from 'styled-components'
import { TabelaResponsiva } from '../../../components/TabelaResponsiva'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../../styles/telas'

export const FilterBar = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  /* No celular, uma coisa por linha: a busca, os papéis e o convite. Lado a
     lado, os quatro papéis e o botão empurravam o "ADMIN" para fora da tela. */
  ${ate.tablet} {
    padding: 12px;
  }
`

export const SearchInput = styled.input`
  flex: 1 1 220px;
  min-width: 0;
  max-width: 320px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 7px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgApp};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  ${alvoDeToque}

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    flex-basis: 100%;
    max-width: none;
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

export const RoleFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  /* Os quatro papéis numa linha só, em partes iguais: com quebra, o "ADMIN"
     descia sozinho para a linha de baixo. */
  ${ate.tablet} {
    flex-basis: 100%;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`

export const RoleBtn = styled.button<{ active?: boolean; }>`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  border: 1px solid ${({ theme, active }) => active ? theme.colors.primary : theme.colors.border};
  background: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.bgApp};
  color: ${({ theme, active }) => active ? theme.colors.textOnPrimary : theme.colors.textSecondary};
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme, active }) => active ? theme.colors.textOnPrimary : theme.colors.primary};
  }

  ${alvoDeToque}

  ${ate.tablet} {
    padding: 6px 4px;
  }
`

export const BotaoConvidar = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  /* A cor primária do tema, e não o #22c55e fixo: branco sobre aquele verde dava
     2,3:1, abaixo dos 4,5:1 do texto normal. O tema escuro troca o par sozinho. */
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};

  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }

  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;

  ${alvoDeToque}

  ${ate.tablet} {
    flex-basis: 100%;
  }
`

/**
 * A tabela de usuários: a `TabelaResponsiva` do app (web#511). No celular cada
 * usuário vira um cartão, com a troca de papel no pé; antes a tabela tinha
 * 870px, e as ações ficavam fora de uma tela de 390.
 */
export const Tabela = styled(TabelaResponsiva)`
  box-shadow: ${({ theme }) => theme.shadows.sm};

  td { vertical-align: middle; }
  th.centro, td.centro { text-align: center; }
  tbody tr:hover td { background: ${({ theme }) => theme.colors.primarySubtle}; }

  ${ate.tablet} {
    box-shadow: none;
    tbody tr:hover td { background: transparent; }
    th.centro, td.centro { text-align: left; }
    /* O selo do papel na largura do texto, e não esticado na célula do cartão. */
    td[data-rotulo] > * { justify-self: start; }
    /* O admin não tem troca de papel: sem isso o cartão dele ganha um pé vazio. */
    td.acoes:empty { display: none; }
  }
`

export const Usuario = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
`

export const AvatarCell = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${({ color }) => color}22;
  color: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
`

export const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export const UserEmail = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const ActionBtn = styled.button`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  transition: all 0.15s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${alvoDeToque}
`

/* ── Modal compartilhado (convite + confirmação de role) ─────────────────────── */
export const ModalWrap = styled.div`
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
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 32px;
  width: 100%;
  max-width: 420px;
  box-shadow: ${({ theme }) => theme.shadows.lg};

  ${ate.celular} {
    padding: 22px 20px;
  }
`

export const ModalTitle = styled.h3`
  margin: 0 0 6px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const ModalText = styled.p`
  margin: 0 0 20px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`

export const ModalInput = styled.input`
  width: 100%;
  height: 42px;
  padding: 0 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  outline: none;
  box-sizing: border-box;
  margin-bottom: 16px;
  transition: border-color 0.15s;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }

  ${ate.tablet} {
    height: ${ALVO_DE_TOQUE};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;

  /* No celular os dois botões dividem a linha, com alvo de toque inteiro. */
  ${ate.celular} {
    & > button { flex: 1 1 0; min-height: ${ALVO_DE_TOQUE}; }
  }
`

export const ModalCancelBtn = styled.button`
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.bgApp}; }
`

export const ModalConfirmBtn = styled.button<{ $danger?: boolean; }>`
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ $danger, theme }) => $danger ? theme.colors.error : theme.colors.primary};
  color: #fff;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.85; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`


export const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 12px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 16px;
`
