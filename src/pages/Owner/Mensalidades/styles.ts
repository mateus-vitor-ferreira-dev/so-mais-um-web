import styled from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../../styles/telas'

export const Voltar = styled.button`
  border: 0; background: none; color: ${({ theme }) => theme.colors.textSecondary}; cursor: pointer;
  display: inline-flex; gap: 8px; align-items: center; margin-bottom: 16px;
  /* Um texto de 16px de altura: em tela de toque, a linha inteira vira alvo. */
  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; margin-bottom: 8px; }
`
export const Caixa = styled.section`
  background: ${({ theme }) => theme.colors.bgCard}; border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 14px; padding: 20px;
  ${ate.celular} { padding: 16px; }
`
export const Topo = styled.div`
  display: flex; justify-content: space-between; gap: 16px; align-items: end; margin-bottom: 18px;
  ${ate.celular} { align-items: stretch; flex-direction: column; }
`
export const Titulo = styled.h2`margin: 0 0 4px; font-size: 1.15rem;`
export const Explicacao = styled.p`margin: 0; color: ${({ theme }) => theme.colors.textSecondary};`
export const CampoMes = styled.label`display: grid; gap: 5px; font-size: .82rem; font-weight: 700;`
export const Mes = styled.input`
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 8px; padding: 9px 10px;
  color: ${({ theme }) => theme.colors.textPrimary}; background: ${({ theme }) => theme.colors.bgInput};
  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; font-size: 1rem; }
`
export const Lista = styled.ul`list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px;`
/**
 * A faixa à esquerda diz quem já pagou, como na lista de entradas do day use:
 * antes, "pago" e "em aberto" só se separavam pela palavra, no meio da linha.
 */
export const Linha = styled.li<{ $pago: boolean }>`
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: 10px; padding: 14px;
  border-left: 3px solid ${({ theme, $pago }) => ($pago ? theme.colors.primary : theme.colors.border)};
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  ${ate.celular} { align-items: stretch; flex-direction: column; gap: 12px; }
`
export const Nome = styled.strong`display: block;`
export const Detalhe = styled.span`display: block; color: ${({ theme }) => theme.colors.textSecondary}; font-size: .84rem; margin-top: 3px;`
export const Selo = styled.span`font-size: .75rem; color: ${({ theme }) => theme.colors.warningText}; margin-left: 7px;`
/**
 * "Marcar como paga" é a ação do dia a dia e leva o verde; "Desmarcar" desfaz
 * um registro de dinheiro e fica neutro. Com o mesmo peso, a exceção parecia rotina.
 */
export const Botao = styled.button<{ $desfazer?: boolean }>`
  border: 1px solid ${({ theme, $desfazer }) => ($desfazer ? theme.colors.border : theme.colors.primary)}; border-radius: 8px; padding: 8px 12px;
  color: ${({ theme, $desfazer }) => ($desfazer ? theme.colors.textSecondary : theme.colors.primary)}; background: transparent; cursor: pointer; font-weight: 700;
  white-space: nowrap;
  &:disabled { opacity: .55; cursor: wait; }
  ${alvoDeToque}
`
export const Estado = styled.p`color: ${({ theme }) => theme.colors.textSecondary}; margin: 12px 0 0;`
