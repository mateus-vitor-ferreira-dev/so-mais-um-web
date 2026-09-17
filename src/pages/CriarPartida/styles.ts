import styled from 'styled-components'
import { cartaoClicavel } from '../../styles/cartaoClicavel'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../styles/telas'

/**
 * No celular a grade cresce com a página, em vez de rolar numa caixa de 340px
 * dentro dela: rolagem dentro de rolagem, com menos de três opções à vista.
 */
const semRolagemPropriaNoCelular = `
  ${ate.tablet} {
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
`

export const Container = styled.div`
  max-width: 680px;
`

export const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 28px;

  ${ate.celular} { margin-bottom: 20px; }
`

export const Step = styled.div<{ $active?: boolean; $done?: boolean; }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ $active, $done, theme }) =>
    $done ? theme.colors.success :
    $active ? theme.colors.primary :
    theme.colors.textMuted};

  /* No celular só a etapa atual mostra o nome: os três lado a lado quebravam em
     duas linhas cada. O texto das outras fica sem tamanho, e o leitor de tela
     continua lendo as três. */
  ${ate.celular} {
    ${({ $active }) => ($active ? '' : 'font-size: 0; gap: 0;')}
  }
`

export const StepDot = styled.div<{ $active?: boolean; $done?: boolean; }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  flex-shrink: 0;
  background: ${({ $active, $done, theme }) =>
    $done ? theme.colors.success :
    $active ? theme.colors.primary :
    theme.colors.borderLight};
  color: ${({ $active, $done, theme }) =>
    $done || $active ? theme.colors.textOnPrimary : theme.colors.textMuted};
`

export const StepLine = styled.div<{ $done?: boolean; }>`
  flex: 1;
  height: 2px;
  background: ${({ $done, theme }) =>
    $done ? theme.colors.success : theme.colors.borderLight};
  max-width: 40px;
`

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: 28px;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${ate.celular} { padding: 16px; }
`

export const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 16px;
`

export const CourtsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 340px;
  overflow-y: auto;
  padding-right: 4px;
  ${semRolagemPropriaNoCelular}
`

export const CourtCard = styled.div<{ $selected?: boolean; }>`
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.primary : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 14px;
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.primarySubtle : theme.colors.bgCard};

  /* O cartão inteiro é o alvo do toque; o nome, um AlvoDoCartao, é por onde o
     teclado chega nele. Era só \`div\` com clique (#511). */
  ${cartaoClicavel}
`

export const CourtName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
`

export const CourtInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const SportBadge = styled.span`
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primary};
  margin-top: 6px;
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

export const Row = styled.div<{ $cols?: number; }>`
  display: grid;
  grid-template-columns: ${({ $cols }) => $cols === 2 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)'};
  gap: 16px;

  ${ate.celular} { grid-template-columns: minmax(0, 1fr); }
`

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

export const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Input = styled.input<{ $error?: boolean; }>`
  padding: 10px 12px;
  border: 1px solid ${({ $error, theme }) => $error ? theme.colors.error : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    min-height: ${ALVO_DE_TOQUE};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

export const ErrorMsg = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const HintMsg = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
`

export const BackButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.textSecondary};
  }

  ${alvoDeToque}
`

export const NextButton = styled.button`
  padding: 10px 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  /* O par do tema: no escuro o primary é verde-claro, e branco nele não se lê. */
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  ${alvoDeToque}
`


export const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

export const SuccessBox = styled.div`
  text-align: center;
  padding: 40px 20px;

  > svg {
    display: block;
    margin: 0 auto 16px;
    color: ${({ theme }) => theme.colors.primary};
  }

  h3 {
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin: 0 0 8px;
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    margin: 0 0 24px;
  }
`

export const SuccessActions = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
`

export const PrimaryBtn = styled.button`
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  ${alvoDeToque}
`

export const SecondaryBtn = styled.button`
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }

  ${alvoDeToque}
`

export const SportChipsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 340px;
  overflow-y: auto;
  ${semRolagemPropriaNoCelular}
  /* Duas modalidades por linha no celular: com 130px de mínimo, a 360 cabia uma. */
  ${ate.celular} { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
`

export const SportChip = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: ${({ theme }) => theme.radii.lg};
  min-width: 0;
  overflow-wrap: anywhere;
  text-align: center;

  ${ate.celular} { padding: 14px 8px; }
  border: 2px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.15s;

  span {
    font-size: 1.8rem;
    line-height: 1;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
  }
`

export const PlacesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(200px, 100%), 1fr));
  gap: 12px;
  margin-bottom: 20px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
  ${semRolagemPropriaNoCelular}
`

export const PlaceCard = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 16px;
  background: ${({ theme }) => theme.colors.bgCard};

  /* Mesmo arranjo do CourtCard: o teclado entra pelo nome (#511). */
  ${cartaoClicavel}
`

export const PlaceName = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
`

export const PlaceAddress = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 8px;
`

export const PlaceCourtCount = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.primary};
`

export const BreadcrumbBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`

export const BreadcrumbTag = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primarySubtle};
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
  }

  ${alvoDeToque}
`

export const BreadcrumbSep = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`
/** A cotação ao lado do valor total (web#475): informação para comparar, e não erro nem aviso. */
export const CotacaoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.primarySubtle};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

/** O erro da api dentro do formulário: faixa com fundo, que troca com o tema (#511). */
export const FaixaDeErro = styled.p`
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.xs};

  svg { flex-shrink: 0; margin-top: 1px; }
`
