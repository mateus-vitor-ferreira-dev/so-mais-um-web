import styled from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate, ALVO_DE_PONTEIRO, LARGURA_DE_LEITURA } from '../../../styles/telas'

export const Voltar = styled.button`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 16px;
  min-height: ${ALVO_DE_PONTEIRO};
  padding: 0;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  /* Um link de texto com 16px de altura: em tela de toque, a linha inteira vira alvo. */
  ${ate.tablet} {
    min-height: ${ALVO_DE_TOQUE};
    margin-bottom: 8px;
  }
`

export const Caixa = styled.section`
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};

  ${ate.celular} { padding: 16px; }
`

export const Topo = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;

  ${ate.celular} {
    flex-direction: column;
    gap: 4px;
  }
`

export const TituloDaCaixa = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Explicacao = styled.p`
  max-width: ${LARGURA_DE_LEITURA};
  margin: 4px 0 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
`

export const Ocupacao = styled.span<{ $lotada: boolean }>`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  white-space: nowrap;
  background: ${({ theme, $lotada }) => ($lotada ? theme.colors.warningLight : theme.colors.primaryLight)};
  color: ${({ theme, $lotada }) => ($lotada ? theme.colors.warningText : theme.colors.primaryDark)};

  /* Empilhada no celular, ela encostava no rótulo do primeiro campo. */
  ${ate.celular} { margin-bottom: 14px; }
`

export const Form = styled.form`
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr auto;
  align-items: start;

  ${ate.tablet} {
    grid-template-columns: minmax(0, 1fr);
  }
`

export const Campo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`

export const Rotulo = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Input = styled.input<{ $erro?: boolean }>`
  min-height: 44px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.875rem;
  border: 1px solid ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.border)};

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} { font-size: 1rem; }

  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: 2px solid ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.primary)};
    outline-offset: 1px;
  }
`

export const ErroDoCampo = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.error};
`

export const Botao = styled.button`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  align-self: end;
  min-height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.primaryHover}; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }
`

export const BotaoLeve = styled.button`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  ${alvoDeToque}
`

export const Lotada = styled.p`
  margin: 0;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warningText};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
`

export const Alternador = styled.label`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  /* O rótulo inteiro é o alvo da caixa de 13px. */
  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; }
`

export const Lista = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const Item = styled.li<{ $saiu?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  opacity: ${({ $saiu }) => ($saiu ? 0.55 : 1)};

  ${ate.celular} {
    flex-direction: column;
    align-items: stretch;
  }
`

export const Dados = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`

export const Nome = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Contato = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  overflow-wrap: anywhere;
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const Quando = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`

/**
 * A marca de quem tem conta no Só+1.
 *
 * Discreta de propósito: ter conta não é status, não é melhor e não muda o que
 * dá para fazer com a matrícula. O caso normal é **não** ter.
 */
export const TemConta = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
`

export const Acoes = styled.div`
  display: flex;
  gap: 8px;
  flex-shrink: 0;

  /* No celular, as ações do aluno dividem a largura do cartão. */
  ${ate.celular} {
    & > button { flex: 1 1 0; justify-content: center; }
  }
`

export const Vazio = styled.p`
  margin: 0;
  padding: 24px 0;
  text-align: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`

export const Erro = styled.p`
  margin: 0;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`
