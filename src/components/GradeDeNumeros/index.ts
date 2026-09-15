import styled from 'styled-components'
import { ate } from '../../styles/telas'

/**
 * A fileira de números do topo das telas (web#511): quatro no computador, dois
 * a partir do tablet.
 *
 * Seis telas tinham a sua, com `repeat(4, 1fr)` e nenhuma regra para celular.
 * Numa tela de 390px cada cartão ficava com 70px, e os rótulos em caixa alta
 * saíam cortados ("USUÁRIC", "PENDEN").
 *
 * `$colunas` é o máximo no computador. A tela com três números passa `3`, e
 * não ganha um buraco na quarta coluna.
 */
export const GradeDeNumeros = styled.div<{ $colunas?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $colunas = 4 }) => $colunas}, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;

  ${ate.tablet} {
    grid-template-columns: repeat(${({ $colunas = 4 }) => Math.min($colunas, 2)}, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 20px;
  }
`
