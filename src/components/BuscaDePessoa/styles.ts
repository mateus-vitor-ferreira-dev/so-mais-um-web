import styled from 'styled-components'
import { alvoDeToque } from '../../styles/telas'

/**
 * Vieram das Assinaturas junto com o componente (api#618). O campo repete o
 * `campo` de lá, e é de propósito: a busca aparece nos formulários do admin ao
 * lado dos outros campos e precisa ter a mesma cara.
 */
export const Busca = styled.input`
  box-sizing: border-box; width: 100%; min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px; font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.bgInput}; color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.regular}; font-family: inherit;
`

export const Opcoes = styled.ul`
  list-style: none; margin: 4px 0 0; padding: 4px; max-height: 240px; overflow-y: auto;
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgCard};
`
export const Opcao = styled.li<{ $destaque: boolean }>`
  padding: 8px 10px; border-radius: ${({ theme }) => theme.radii.sm}; cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ $destaque, theme }) => ($destaque ? theme.colors.primaryLight : 'transparent')};
`
export const OpcaoEmail = styled.span`
  display: block; font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
  overflow-wrap: anywhere;
`
export const SemOpcao = styled.p<{ $erro?: boolean }>`
  margin: 6px 4px; font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ $erro, theme }) => ($erro ? theme.colors.error : theme.colors.textMuted)};
`
export const Escolhido = styled.div`
  display: flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 0;
  padding: 8px 10px; border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.primary}; background: ${({ theme }) => theme.colors.primarySubtle};
`
export const EscolhidoTexto = styled.div`
  min-width: 0; font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textPrimary};
  span { display: block; font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted}; overflow-wrap: anywhere; }
`
export const Trocar = styled.button`
  flex-shrink: 0; border: 0; background: transparent; cursor: pointer; padding: 4px 6px;
  color: ${({ theme }) => theme.colors.primary}; font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  ${alvoDeToque}
`
