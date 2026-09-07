import styled from 'styled-components'
import { TONS } from '../../constants/coresDeTime'
import type { CorDeTime } from '../../constants/coresDeTime'

export const Grupo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing[2]};
`

export const Opcao = styled.button<{ $cor: CorDeTime; $ativa: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  padding: 0;

  background: ${({ theme, $cor }) => TONS[theme.mode === 'dark' ? 'dark' : 'light'][$cor].fundo};

  /*
   * A seleção é um anel POR FORA, e não uma borda que come a cor.
   * Borda interna estreitaria o quadrado escolhido, e ele passaria a parecer
   * menor que os outros justamente por estar escolhido.
   */
  border: 2px solid transparent;
  box-shadow: ${({ theme, $ativa }) =>
    $ativa ? `0 0 0 2px ${theme.colors.bgCard}, 0 0 0 4px ${theme.colors.textPrimary}` : 'none'};

  transition: transform 0.12s;

  &:hover { transform: scale(1.08); }

  /* O foco de teclado precisa aparecer mesmo na cor já selecionada. */
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 3px;
  }
`

export const Limpar = styled.button`
  background: none;
  border: none;
  padding: 0;
  margin-top: ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`
