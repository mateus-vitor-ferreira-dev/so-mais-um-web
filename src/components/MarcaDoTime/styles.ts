import styled from 'styled-components'
import { TONS } from '../../constants/coresDeTime'
import type { CorDeTime } from '../../constants/coresDeTime'

/** Os três tamanhos em que a marca aparece hoje: convite, cartão e cabeçalho. */
export const TAMANHOS = {
  sm: { caixa: 32, fonte: '0.75rem',  raio: 'md' },
  md: { caixa: 44, fonte: '1rem',     raio: 'lg' },
  lg: { caixa: 64, fonte: '1.5rem',   raio: 'lg' },
} as const

export type TamanhoDaMarca = keyof typeof TAMANHOS

export const Marca = styled.span<{ $cor: CorDeTime; $tamanho: TamanhoDaMarca }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  width:  ${({ $tamanho }) => TAMANHOS[$tamanho].caixa}px;
  height: ${({ $tamanho }) => TAMANHOS[$tamanho].caixa}px;
  border-radius: ${({ theme, $tamanho }) => theme.radii[TAMANHOS[$tamanho].raio]};

  font-size: ${({ $tamanho }) => TAMANHOS[$tamanho].fonte};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: 1;
  letter-spacing: 0.02em;

  /*
   * O tom vem do tema, e não do banco: theme.mode é o que permite guardar o
   * NOME da cor lá e escolher aqui o tom que se lê — o hexadecimal que fica bom
   * no claro some no escuro.
   *
   * (Sem crase neste comentário: ele mora dentro de um template literal, e uma
   * crase aqui fecharia a string — o erro sai como "',' expected" na linha do
   * comentário, que não parece ter nada a ver.)
   */
  background: ${({ theme, $cor }) => TONS[theme.mode === 'dark' ? 'dark' : 'light'][$cor].fundo};
  color:      ${({ theme, $cor }) => TONS[theme.mode === 'dark' ? 'dark' : 'light'][$cor].texto};
`
