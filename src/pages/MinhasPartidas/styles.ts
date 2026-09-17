import styled from 'styled-components'
import type { TomDoStatus } from '../../constants/statusDaPartida'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../styles/telas'

/* Largura, respiro e alinhamento são do layout (web#493): a página não
   repete o padding do conteúdo nem se centraliza por conta própria. */
export const Container = styled.div``

export const CreateButton = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.full};
  font-weight: bold;
  border: none;
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadows.md};

  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }

  ${alvoDeToque}
  ${ate.celular} { width: 100%; }
`

/**
 * O vazio de cada aba (#379).
 *
 * Mesmo desenho do `/times`, e de propósito: as duas telas dizem a mesma coisa
 * ("não há nada aqui, e é daqui que se sai disso"), e um segundo visual para o
 * mesmo estado só faria o produto parecer montado por duas pessoas que não se
 * falaram.
 */

export const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing[6]};

  ${ate.celular} { gap: ${({ theme }) => theme.spacing[3]}; }
`

export const Tab = styled.button<{ $active?: boolean; }>`
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing[3]} 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.fontWeights.bold : theme.fontWeights.medium};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom: 3px solid
    ${({ $active, theme }) => ($active ? theme.colors.primary : 'transparent')};
  cursor: pointer;

  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; }
  ${ate.celular} { flex: 1; }
`

export const PixBox = styled.div`
  background: ${({ theme }) => theme.colors.bgApp};
  border: 1px dashed ${({ theme }) => theme.colors.primary};
  padding: ${({ theme }) => theme.spacing[3]};
  border-radius: ${({ theme }) => theme.radii.md};
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing[4]};

  span {
    font-family: monospace;
    color: ${({ theme }) => theme.colors.textPrimary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    min-width: 0;
    overflow-wrap: anywhere;
  }

  button {
    background: transparent;
    border: none;
    color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: bold;
    ${alvoDeToque}
  }

  ${ate.celular} {
    align-items: flex-start;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing[2]};
    button { align-self: flex-end; }
  }
`

// Estilos do Modal
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${({ theme }) => theme.colors.bgOverlay};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`

export const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.xl};
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;

  ${ate.celular} {
    width: calc(100% - ${({ theme }) => theme.spacing[6]});
    padding: ${({ theme }) => theme.spacing[4]};
  }

  h2 {
    margin-bottom: ${({ theme }) => theme.spacing[6]};
  }
`

export const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};

  label {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 4px;
    display: block;
  }

  input,
  select {
    width: 100%;
    padding: ${({ theme }) => theme.spacing[3]};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    font-family: ${({ theme }) => theme.fonts.sans};
    background: ${({ theme }) => theme.colors.bgInput};
    color: ${({ theme }) => theme.colors.textPrimary};

    ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; font-size: ${({ theme }) => theme.fontSizes.md}; }
  }
`
export const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing[4]};
  margin-top: ${({ theme }) => theme.spacing[6]};

  button {
    flex: 1;
    padding: ${({ theme }) => theme.spacing[3]};
    border-radius: ${({ theme }) => theme.radii.md};
    font-weight: bold;
    cursor: pointer;
    border: none;
  }

  .cancel {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
  .submit {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary};

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  ${ate.tablet} { button { min-height: ${ALVO_DE_TOQUE}; } }
  ${ate.celular} { flex-direction: column-reverse; }
`

/**
 * O selo de status com a cor do tom (web#491), pelas mesmas cores semânticas do
 * tema — que o `contraste.test.ts` mede nos dois temas.
 */
export const SeloDeStatus = styled.span<{ $tom: TomDoStatus }>`
  white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme, $tom }) =>
    ({ aberta: theme.colors.success, cheia: theme.colors.warningText, fim: theme.colors.textSecondary, cancelada: theme.colors.error })[$tom]};
  background: ${({ theme, $tom }) =>
    ({ aberta: theme.colors.successLight, cheia: theme.colors.warningLight, fim: theme.colors.border, cancelada: theme.colors.errorLight })[$tom]};
`

export const AcoesDoStatus = styled.div`
  display: flex;
  gap: 8px;

  ${ate.celular} { flex-direction: column; }
`

/**
 * Os botões de quem organiza, pelas cores do tema (web#492). Eram estilo em
 * linha com `#f0fdf4`, `#fee2e2` e `#eff6ff` fixos, e no tema escuro saíam
 * como três placas claras no meio do cartão escuro.
 */
export const AcaoDoOrganizador = styled.button<{ $tom: 'finalizar' | 'cancelar' | 'presencas' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  border: 1px solid
    ${({ theme, $tom }) => ({ finalizar: theme.colors.border, cancelar: theme.colors.errorLight, presencas: theme.colors.info })[$tom]};
  background: ${({ theme, $tom }) => ({ finalizar: theme.colors.primarySubtle, cancelar: theme.colors.errorLight, presencas: theme.colors.infoLight })[$tom]};
  color: ${({ theme, $tom }) => ({ finalizar: theme.colors.primaryDark, cancelar: theme.colors.error, presencas: theme.colors.infoText })[$tom]};

  ${alvoDeToque}
`
