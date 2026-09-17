import styled, { css } from 'styled-components'
import { ate } from '../../styles/telas'
import type { Degrau } from '../../styles/telas'

/** A tabela desenhada como pilha de cartões. */
const emCartao = css`
    background: transparent;
    border: 0;
    border-radius: 0;
    overflow: visible;

    thead { display: none; }
    tbody { display: grid; gap: 10px; }
    tr {
      display: grid;
      gap: 8px;
      padding: 14px;
      background: ${({ theme }) => theme.colors.bgCard};
      border: 1px solid ${({ theme }) => theme.colors.border};
      border-radius: ${({ theme }) => theme.radii.lg};
    }
    td, td:first-child, td:last-child {
      display: grid;
      /* Largura fixa para o rótulo: com ela os valores de todas as linhas do
         cartão começam no mesmo x. 128px cabe "ESTABELECIMENTO" em caixa alta. */
      grid-template-columns: 128px minmax(0, 1fr);
      gap: 8px;
      padding: 0;
      border: 0;
      overflow-wrap: anywhere;
    }
    td[data-rotulo]::before {
      content: attr(data-rotulo);
      overflow-wrap: normal;
      letter-spacing: 0.02em;
      padding-top: 2px;
      font-size: ${({ theme }) => theme.fontSizes.xs};
      text-transform: uppercase;
      color: ${({ theme }) => theme.colors.textMuted};
    }
    td.principal, td.acoes { display: block; }
    td.acoes { margin-top: 4px; }
`

/**
 * A tabela que vira pilha de cartões na tela estreita (web#511).
 *
 * Nasceu na tela de Assinaturas (web#502) e saiu de lá porque é o mesmo defeito
 * em todas as tabelas do painel: seis colunas numa tela de 390px empurravam as
 * ações para fora, escondidas atrás de uma rolagem lateral que nada anunciava.
 *
 * **Uma marcação só**, e não duas árvores escondidas por CSS: duas fariam o
 * leitor de tela e os testes acharem cada linha duas vezes. Na tela estreita o
 * cabeçalho some, e cada célula leva o próprio rótulo:
 *
 * ```tsx
 * <TabelaResponsiva>
 *   <thead><tr><th>Dono</th><th>Plano</th><th aria-label="Ações" /></tr></thead>
 *   <tbody>
 *     <tr>
 *       <td className="principal">Joana</td>          // topo do cartão, sem rótulo
 *       <td data-rotulo="Plano">Pro</td>              // "PLANO   Pro"
 *       <td className="acoes">…botões…</td>           // pé do cartão, sem rótulo
 *     </tr>
 *   </tbody>
 * </TabelaResponsiva>
 * ```
 *
 * `$cartaoAte` escolhe o degrau em que ela vira cartão: `tablet` por padrão,
 * `celular` para a tabela estreita que ainda cabe num tablet.
 *
 * `$cartaoAbaixoDe` vira cartão também quando **o espaço da tabela** fica menor
 * que tantos pixels, dentro de uma `CaixaDaTabela`. É o caso da tabela larga no
 * painel: com a barra lateral, a 1024–1280px a tela é de computador e a tabela
 * ainda não cabe, e nenhum degrau de tela acerta isso (#511, computador).
 */
export const TabelaResponsiva = styled.table<{ $cartaoAte?: Degrau; $cartaoAbaixoDe?: number }>`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;

  th {
    text-align: left;
    padding: 10px;
    white-space: nowrap;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.textMuted};
    background: ${({ theme }) => theme.colors.bgPage};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  td {
    padding: 12px 10px;
    vertical-align: top;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  }
  tbody tr:last-child td { border-bottom: 0; }
  th:first-child, td:first-child { padding-left: 16px; }
  th:last-child, td:last-child { padding-right: 16px; }

  ${({ $cartaoAte = 'tablet' }) => ate[$cartaoAte]} {
    ${emCartao}
  }

  ${({ $cartaoAbaixoDe }) => $cartaoAbaixoDe && css`
    @container (max-width: ${$cartaoAbaixoDe}px) {
      ${emCartao}
    }
  `}
`

/** O contêiner que o `$cartaoAbaixoDe` mede. */
export const CaixaDaTabela = styled.div`
  container-type: inline-size;
`
