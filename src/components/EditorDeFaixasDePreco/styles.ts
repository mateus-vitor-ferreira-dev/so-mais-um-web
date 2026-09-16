import styled, { css } from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate, telaDeToque } from '../../styles/telas'

/**
 * Os atalhos em texto ("outros dias", "Adicionar faixa") tinham 14px de altura:
 * no dedo, errava-se o dia. Em tela de toque ganham a altura do alvo, sem
 * mudar o desenho com mouse.
 */
const linkDeToque = css`
  ${telaDeToque} {
    display: inline-flex;
    align-items: center;
    min-height: ${ALVO_DE_TOQUE};
  }
`

export const Dias = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

export const Dia = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgPage};

  ${ate.celular} { padding: 10px 8px; }
`

export const Cabecalho = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
`

export const NomeDoDia = styled.h4`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Atalhos = styled.div`
  display: flex;
  align-items: baseline;
  gap: 6px;
  flex-wrap: wrap;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Atalho = styled.button`
  padding: 0;
  border: 0;
  background: none;
  font-size: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  text-decoration: underline;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${linkDeToque}
  ${telaDeToque} { padding: 0 4px; }
`

export const SemFaixa = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

/** A linha que a api recusou ganha borda e fundo: a mensagem diz o que houve, o destaque diz onde. */
export const Linha = styled.div<{ $destacada: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 4px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid transparent;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};

  ${({ $destacada, theme }) =>
    $destacada &&
    css`
      border-color: ${theme.colors.error};
      background: ${theme.colors.errorLight};
    `}
`

export const Campo = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 6px 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgInput};
  font-variant-numeric: tabular-nums;

  &[type='number'] { width: 90px; }
  ${ate.celular} { padding: 6px; }
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} {
    min-height: ${ALVO_DE_TOQUE};
    font-size: ${({ theme }) => theme.fontSizes.md};
  }
`

/**
 * "das 08:00 às 23:00" junto, numa linha só. Solto no \`flex-wrap\` da linha, o
 * "às" ficava numa linha e o horário do fim na seguinte, no celular.
 */
export const Horario = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`

export const Valor = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`

export const Remover = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  &:hover:not(:disabled) { color: ${({ theme }) => theme.colors.error}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${alvoDeToque}
`

export const Nota = styled.p<{ $aviso?: boolean }>`
  margin: 0 0 0 6px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme, $aviso }) => ($aviso ? theme.colors.warningText : theme.colors.textSecondary)};
`

export const Adicionar = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  align-self: flex-start;
  padding: 0;
  border: 0;
  background: none;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.primary};
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }

  ${linkDeToque}
`
