import styled from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../../styles/telas'

export const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;

  > div:first-child { min-width: min(360px, 100%); }

  ${ate.tablet} {
    align-items: stretch;
    flex-direction: column;
  }
`

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;

  ${ate.celular} {
    align-items: stretch;
    flex-direction: column;
  }
`

export const FilterToggle = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  /* O rótulo inteiro é o alvo da caixa de 17px. */
  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; }

  input {
    width: 17px;
    height: 17px;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`

export const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  font-weight: 600;
`

const field = `
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border-radius: 8px;
  font: inherit;

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    min-height: ${ALVO_DE_TOQUE};
    font-size: 1rem;
  }
`

export const Input = styled.input`
  ${field}
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Select = styled.select`
  ${field}
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Textarea = styled.textarea`
  ${field}
  min-height: 80px;
  resize: vertical;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 11px 16px;
  border: 0;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${alvoDeToque}
`

export const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 11px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  ${alvoDeToque}
`

export const DangerButton = styled(SecondaryButton)`
  border-color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
`

export const StockSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;

  /* Os três lado a lado também no celular, com o ícone acima do número: um por
     linha, eles ocupavam a primeira tela, e o primeiro produto só vinha rolando. */
  ${ate.celular} { gap: 8px; margin-bottom: 16px; }
`

export const SummaryCard = styled.div<{ $warning?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid ${({ $warning, theme }) => ($warning ? theme.colors.warning : theme.colors.borderLight)};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bgCard};

  svg { color: ${({ $warning, theme }) => ($warning ? theme.colors.warning : theme.colors.primary)}; }
  div { display: flex; flex-direction: column; }
  strong { color: ${({ theme }) => theme.colors.textPrimary}; font-size: 22px; }
  span { color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; }

  ${ate.celular} {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 12px 10px;
    strong { font-size: 20px; }
  }
`

export const PageGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  align-items: start;
  gap: 20px;

  ${ate.notebook} { grid-template-columns: minmax(0, 1fr); }
`

export const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr));
  gap: 14px;
`

export const ProductCard = styled.article<{ $low: boolean }>`
  padding: 18px;
  border: 1px solid ${({ $low, theme }) => ($low ? theme.colors.warning : theme.colors.borderLight)};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bgCard};
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${ate.celular} { padding: 16px; }
`

export const ProductHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;

  h2 {
    margin: 0 0 4px;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 17px;
    overflow-wrap: anywhere;
  }
`

export const ProductMeta = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
`

export const AlertBadge = styled.span`
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: 4px;
  padding: 4px 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warningText};
  /* 12px, o menor texto do app: com 10px, o aviso mais importante do cartão era o menor. */
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
`

export const StockNumber = styled.div<{ $low: boolean }>`
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin: 18px 0;
  color: ${({ $low, theme }) => ($low ? theme.colors.warningText : theme.colors.textPrimary)};

  strong { font-size: 34px; }
  span { color: ${({ theme }) => theme.colors.textSecondary}; font-size: 12px; }
`

export const QuickSale = styled.div`
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 8px;
  margin-bottom: 10px;
`

export const SaleButton = styled(PrimaryButton)`
  padding: 10px;
  background: ${({ theme }) => theme.colors.success};
`

export const Actions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
`

export const HistoryCard = styled.aside`
  padding: 18px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bgCard};
`

export const HistoryHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 17px;
  }

  select { padding: 8px 10px; font-size: 13px; }
  ${ate.tablet} { select { font-size: 1rem; } }
`

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 640px;
  overflow: auto;

  /* Até o notebook o histórico vem embaixo dos produtos, e a página já rola: a
     caixa com rolagem própria prendia o dedo no meio da tela (#511). */
  ${ate.notebook} {
    max-height: none;
    overflow: visible;
  }

  > p { color: ${({ theme }) => theme.colors.textMuted}; font-size: 13px; }
`

export const HistoryItem = styled.div<{ $entry: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  .movement { display: flex; flex-direction: column; min-width: 0; }
  strong { color: ${({ $entry, theme }) => ($entry ? theme.colors.success : theme.colors.error)}; font-size: 13px; }
  span, time { color: ${({ theme }) => theme.colors.textMuted}; font-size: 12px; }
  time { white-space: nowrap; }
`


export const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`

export const ModalOverlay = styled.button`
  position: absolute;
  inset: 0;
  border: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
`

export const ModalBox = styled.div`
  position: relative;
  width: 100%;
  max-width: 540px;
  max-height: calc(100dvh - 32px);
  overflow: auto;
  padding: 24px;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.bgCard};
  box-shadow: ${({ theme }) => theme.shadows.lg};

  h2 {
    margin: 0 0 20px;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: 19px;
  }

  ${ate.celular} { padding: 20px 16px; }
`

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;

  .wide { grid-column: 1 / -1; }

  ${ate.celular} {
    grid-template-columns: minmax(0, 1fr);
    .wide { grid-column: auto; }
  }
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin-top: 20px;

  ${ate.celular} {
    flex-wrap: wrap;
    button { flex: 1 1 auto; white-space: nowrap; }
  }
`

export const DangerActions = styled.div`
  display: flex;
  gap: 8px;
  margin-right: auto;
`
