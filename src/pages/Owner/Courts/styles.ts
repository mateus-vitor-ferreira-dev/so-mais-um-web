import styled, { css } from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../../styles/telas'

/** 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
const campoNoCelular = css`
  ${ate.tablet} {
    min-height: ${ALVO_DE_TOQUE};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

export const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgApp};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 20px;
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }

  ${alvoDeToque}
`

export const CourtsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr));
  gap: 18px;
  margin-top: 8px;

  ${ate.celular} { gap: 12px; }
`

export const CourtCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 18px 20px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: 10px;

  ${ate.celular} { padding: 16px; }
`

export const CourtCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
`

export const CourtIconBox = styled.div`
  font-size: 28px;
  line-height: 1;
  flex-shrink: 0;
`

export const CourtInfo = styled.div`
  flex: 1;
  min-width: 0;
`

export const CourtName = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  /* No celular o nome inteiro, quebrando linha, e não cortado com reticências. */
  ${ate.tablet} {
    white-space: normal;
    overflow-wrap: anywhere;
  }
`

export const CourtMeta = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

/** Aberta em verde, fechada em cinza, pelos tokens: as cores fixas eram só as do tema claro. */
export const StatusBadge = styled.span<{ $aberta: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  background: ${({ $aberta, theme }) => ($aberta ? theme.colors.successLight : theme.colors.borderLight)};
  color: ${({ $aberta, theme }) => ($aberta ? theme.colors.success : theme.colors.textMuted)};
  white-space: nowrap;
  flex-shrink: 0;
`

export const CourtActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 2px;
`

type VariantKey = keyof typeof VARIANT_STYLES

/**
 * Pelos tokens do tema: os hexadecimais de antes eram do tema claro, e no escuro
 * os botões viravam blocos cinza-claro e rosa-claro no cartão escuro.
 */
const VARIANT_STYLES = {
  secondary: css`
    background: ${({ theme }) => theme.colors.bgApp};
    border-color: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.textSecondary};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.borderLight}; color: ${({ theme }) => theme.colors.textPrimary}; }
  `,
  success: css`
    background: ${({ theme }) => theme.colors.successLight};
    border-color: ${({ theme }) => theme.colors.success};
    color: ${({ theme }) => theme.colors.success};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.success}; color: ${({ theme }) => theme.colors.textOnPrimary}; }
  `,
  danger: css`
    background: ${({ theme }) => theme.colors.errorLight};
    border-color: ${({ theme }) => theme.colors.error};
    color: ${({ theme }) => theme.colors.error};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.error}; color: ${({ theme }) => theme.colors.textOnPrimary}; }
  `,
  primary: css`
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary};
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  `,
}

export const ActionBtn = styled.button<{ variant?: VariantKey }>`
  flex: 1;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  text-align: center;
  border: 1px solid;
  ${({ variant = 'secondary' }) => VARIANT_STYLES[variant]}
  transition: all 0.15s;

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

/**
 * A ação da barra do topo. Com ícone de verdade, e não um "+" escrito: é o
 * \`svg\` que faz o layout deixá-la só com o ícone no celular (web#493). Com o
 * rótulo inteiro, o título da página virava "Quad…".
 */
export const NewBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  transition: background 0.15s;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }

  /* Mesmo desabilitado do ActionBtn: sem assinatura em dia o botão precisa
     parecer desabilitado, não só deixar de responder. */
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${alvoDeToque}
`

// ── Modal ─────────────────────────────────────────────────────────────────────

export const Modal = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
`

export const ModalOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
`

/**
 * `$largo` com o editor de faixas aberto (web#474): sete dias de "das … às … R$"
 * não cabem em 480px sem cada linha quebrar em duas. A altura rola dentro do
 * modal, porque a semana cheia passa da tela.
 */
export const ModalBox = styled.div<{ $largo?: boolean }>`
  position: relative;
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 28px 32px;
  width: calc(100% - 32px);
  max-width: ${({ $largo }) => ($largo ? '640px' : '480px')};
  /* \`dvh\`: no celular o \`vh\` conta a barra de endereço, e o fim do modal ficava atrás dela. */
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  box-sizing: border-box;
  box-shadow: ${({ theme }) => theme.shadows.lg};

  ${ate.celular} { padding: 22px 16px; }
`

export const ModalHeader = styled.div`
  margin-bottom: 20px;
`

export const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Input = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 9px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.bgApp};

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }
  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }

  ${campoNoCelular}
`

export const Select = styled.select`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 9px 12px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.colors.bgApp};
  cursor: pointer;

  &:focus { border-color: ${({ theme }) => theme.colors.primary}; }

  ${campoNoCelular}
`

export const FieldError = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;

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

export const SubmitBtn = styled.button`
  padding: 9px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  transition: background 0.15s;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

/** O selo ao lado do nome. Discreto: é informação da quadra, e não estado dela como o Aberta/Fechada. */
export const SeloCoberta = styled.span`
  margin-left: 8px;
  padding: 1px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.info};
  background: ${({ theme }) => theme.colors.infoLight};
  vertical-align: middle;
`

export const AvisoSemCobertura = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding: 12px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.warningText};
  background: ${({ theme }) => theme.colors.warningLight};
`

/** Fieldset para os dois rádios terem nome acessível; sem a moldura que o navegador desenha. */
export const GrupoDeOpcoes = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`

/** O `ActionBtn` estica para dividir o rodapé do cartão; no aviso ele é um atalho, do tamanho do texto. */
export const AtalhoDoAviso = styled(ActionBtn)`
  flex: 0 0 auto;
  padding: 8px 16px;
`

export const Opcoes = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
`

export const Opcao = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  /* O rótulo inteiro é o alvo do rádio: com 44px de altura, o dedo não erra. */
  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; }
`

export const Nota = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const OpcaoDoPreco = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; }
`

export const ErroDasFaixas = styled.p`
  margin: 0;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorLight};
`
