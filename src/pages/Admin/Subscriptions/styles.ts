import styled, { css } from 'styled-components'
import { TabelaResponsiva } from '../../../components/TabelaResponsiva'
export { CaixaDaTabela } from '../../../components/TabelaResponsiva'
import { GradeDeNumeros } from '../../../components/GradeDeNumeros'
import { alvoDeToque, ate, LARGURA_DE_LEITURA } from '../../../styles/telas'

/** Os tons de selo. `manual`, `stripe` e `cortesia` marcam origem; o resto, situação. */
export type TomDeSelo = 'ok' | 'alerta' | 'erro' | 'neutro' | 'manual' | 'stripe' | 'cortesia'

const TONS = {
  ok:     css`background: ${({ theme }) => theme.colors.successLight}; color: ${({ theme }) => theme.colors.success};`,
  alerta: css`background: ${({ theme }) => theme.colors.warningLight}; color: ${({ theme }) => theme.colors.warningText};`,
  erro:   css`background: ${({ theme }) => theme.colors.errorLight};   color: ${({ theme }) => theme.colors.error};`,
  neutro: css`background: ${({ theme }) => theme.colors.borderLight};  color: ${({ theme }) => theme.colors.textSecondary};`,
  manual: css`background: ${({ theme }) => theme.colors.primaryLight}; color: ${({ theme }) => theme.colors.primary};`,
  stripe: css`background: ${({ theme }) => theme.colors.infoLight};    color: ${({ theme }) => theme.colors.infoText};`,
  // Roxo, e não verde: cortesia ao lado da manual em verde diria "é a mesma
  // coisa que o Pix", que é o engano que a origem nova existe para desfazer.
  cortesia: css`background: ${({ theme }) => theme.colors.accentLight}; color: ${({ theme }) => theme.colors.accent};`,
}

/**
 * O de conceder cortesia, ao lado do de registrar (web#456).
 *
 * Secundário de propósito: registrar um Pix é a ação do dia a dia, conceder é
 * exceção. Os dois com o mesmo peso fariam a exceção parecer rotina — e a
 * diferença entre eles é o que a Receita Mensal soma.
 */
export const BotaoConceder = styled.button`
  display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: ${({ theme }) => theme.radii.md}; padding: 10px 16px; cursor: pointer;
  background: transparent; color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.fontWeights.bold}; font-size: ${({ theme }) => theme.fontSizes.sm};
  &:hover { background: ${({ theme }) => theme.colors.accentLight}; }
  ${alvoDeToque}
`
export const BotaoRegistrar = styled.button`
  display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
  border: 0; border-radius: ${({ theme }) => theme.radii.md}; padding: 10px 16px; cursor: pointer;
  background: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textOnPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.bold}; font-size: ${({ theme }) => theme.fontSizes.sm};
  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }
  ${alvoDeToque}
`
export const Aviso = styled.p`
  max-width: ${LARGURA_DE_LEITURA};
  margin: 0 0 16px; font-size: ${({ theme }) => theme.fontSizes.sm}; line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
`

/** Os quatro números do topo: a grade comum do app (web#511). */
export const Numeros = GradeDeNumeros

/** No celular, os filtros rolam de lado em vez de empilhar três linhas acima da lista. */
export const Filtros = styled.div`
  display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;
  ${ate.tablet} {
    flex-wrap: nowrap; overflow-x: auto; margin-inline: -16px; padding-inline: 16px; scrollbar-width: none;
    & > button { flex-shrink: 0; }
  }
`
export const Filtro = styled.button<{ $ativo: boolean }>`
  display: inline-flex; align-items: center; gap: 6px;
  border-radius: ${({ theme }) => theme.radii.full}; padding: 7px 14px; cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.semibold};
  border: 1px solid ${({ $ativo, theme }) => ($ativo ? theme.colors.primary : theme.colors.border)};
  background: ${({ $ativo, theme }) => ($ativo ? theme.colors.primaryLight : theme.colors.bgCard)};
  color: ${({ $ativo, theme }) => ($ativo ? theme.colors.primary : theme.colors.textSecondary)};
  ${alvoDeToque}
`
export const Contagem = styled.span<{ $alerta?: boolean }>`
  min-width: 20px; padding: 0 6px; border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs}; line-height: 20px; text-align: center;
  background: ${({ $alerta, theme }) => ($alerta ? theme.colors.warningLight : theme.colors.borderLight)};
  color: ${({ $alerta, theme }) => ($alerta ? theme.colors.warningText : theme.colors.textMuted)};
`

/** A explicação de um filtro, dita uma vez em cima da lista. */
export const NotaDoFiltro = styled.p<{ $tom?: 'alerta'; $noCampo?: boolean }>`
  max-width: ${LARGURA_DE_LEITURA};
  margin: ${({ $noCampo }) => ($noCampo ? '6px 0 0' : '0 0 12px')};
  padding: 10px 14px; border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm}; line-height: 1.5;
  ${({ $tom, theme }) =>
    $tom === 'alerta'
      ? css`background: ${theme.colors.warningLight}; color: ${theme.colors.warningText}; border: 1px solid ${theme.colors.warningBorder};`
      : css`background: ${theme.colors.infoLight}; color: ${theme.colors.textSecondary};`}
`

/**
 * A tabela das assinaturas: a `TabelaResponsiva` do app, com o que só esta tela tem.
 *
 * O e-mail do dono fica numa linha só no computador: com o `anywhere` do
 * detalhe, a coluna encolhia até quebrar o endereço no meio num notebook de
 * 1280px. O limite e as reticências impedem o e-mail muito comprido de empurrar
 * a tabela para fora da tela; o endereço inteiro fica no `title`.
 */
/* Cartão também quando a tabela tem menos de 920px: com a barra lateral, de
   1024 a ~1280px, sete colunas mais as ações passavam da borda (#511, computador). */
export const Tabela = styled(TabelaResponsiva).attrs({ $cartaoAbaixoDe: 920 })`
  td.principal span {
    max-width: 180px; overflow-wrap: normal; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  ${ate.tablet} {
    td.principal span { max-width: none; overflow-wrap: anywhere; white-space: normal; }
  }
`
export const Nome = styled.strong`display: block; color: ${({ theme }) => theme.colors.textPrimary};`
export const Detalhe = styled.span`
  display: block; margin-top: 2px; font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted}; overflow-wrap: anywhere;
`
/**
 * O valor e a data numa linha só. Num notebook de 1280px a tabela aperta, e
 * "R$ 189,90/" numa linha com "mês" na outra se lê como dois números.
 */
export const SemQuebra = styled.span`white-space: nowrap;`
export const Selo = styled.span<{ $tom: TomDeSelo }>`
  display: inline-block; padding: 3px 10px; border-radius: ${({ theme }) => theme.radii.full}; white-space: nowrap;
  font-size: ${({ theme }) => theme.fontSizes.xs}; font-weight: ${({ theme }) => theme.fontWeights.bold};
  ${({ $tom }) => TONS[$tom]}
`
export const Acoes = styled.div`
  display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;
  ${ate.tablet} { justify-content: flex-start; margin-top: 4px; }
`
export const Botao = styled.button<{ $perigo?: boolean }>`
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  border-radius: ${({ theme }) => theme.radii.sm}; padding: 6px 12px; cursor: pointer; background: transparent;
  font-weight: ${({ theme }) => theme.fontWeights.bold}; font-size: ${({ theme }) => theme.fontSizes.sm};
  border: 1px solid ${({ $perigo, theme }) => ($perigo ? theme.colors.error : theme.colors.primary)};
  color: ${({ $perigo, theme }) => ($perigo ? theme.colors.error : theme.colors.primary)};
  &:disabled { opacity: .55; cursor: wait; }
  ${alvoDeToque}
`
export const Estado = styled.p`color: ${({ theme }) => theme.colors.textSecondary}; margin: 20px 0 0;`

export const ModalFundo = styled.div`
  position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  padding: 16px; background: ${({ theme }) => theme.colors.bgOverlay};
`
export const ModalCaixa = styled.div`
  box-sizing: border-box; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto;
  background: ${({ theme }) => theme.colors.bgCard}; color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: ${({ theme }) => theme.radii.lg}; padding: 22px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`
export const ModalTitulo = styled.h2`margin: 0 0 8px; font-size: ${({ theme }) => theme.fontSizes.xl};`
export const ModalTexto = styled.p`
  margin: 0 0 16px; line-height: 1.5;
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textSecondary};
`
export const Grupo = styled.div`margin-bottom: 14px; min-width: 0;`
export const Campo = styled.label`
  display: grid; gap: 5px; min-width: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.bold};
`
/** O rótulo de um campo que não é `<label>`: a busca de dono se rotula sozinha. */
export const RotuloDeCampo = styled.span`
  display: block; margin-bottom: 5px;
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.bold};
`
/**
 * Todo campo na largura da caixa (web#502).
 *
 * Sem o `width` e o `box-sizing`, o `<select>` tomava a largura da opção mais
 * longa — "Nome — e-mail" do dono mais comprido — e passava da borda do modal.
 */
const campo = css`
  box-sizing: border-box; width: 100%; min-width: 0;
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px; font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.bgInput}; color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.regular}; font-family: inherit;
`
export const Selecao = styled.select`${campo}`
export const Data = styled.input`${campo}`
export const Busca = styled.input`${campo}`

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
/**
 * Ajuda de campo. Fora do `<label>` de propósito: dentro dele o parágrafo
 * entraria no nome acessível do campo, e o leitor de tela anunciaria a
 * explicação inteira como se fosse o rótulo.
 */
export const Ajuda = styled.p`
  margin: 5px 0 0; line-height: 1.4;
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
`
export const ModalAcoes = styled.div`display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;`
export const Cancelar = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px 16px; cursor: pointer; background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary}; font-weight: ${({ theme }) => theme.fontWeights.bold};
`
/**
 * O confirmar do modal.
 *
 * A variante de perigo é vermelho **claro com texto vermelho**, e não vermelho
 * cheio com texto branco: o `error` do tema escuro já é uma cor clara (#314), e
 * escrever branco em cima dele daria o contraste que a #436 acabou de consertar
 * no resto do painel.
 */
export const Confirmar = styled.button<{ $perigo?: boolean }>`
  border-radius: ${({ theme }) => theme.radii.sm}; padding: 10px 16px; cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  border: 1px solid ${({ $perigo, theme }) => ($perigo ? theme.colors.error : 'transparent')};
  background: ${({ $perigo, theme }) => ($perigo ? theme.colors.errorLight : theme.colors.primary)};
  color: ${({ $perigo, theme }) => ($perigo ? theme.colors.error : theme.colors.textOnPrimary)};
  &:disabled { opacity: .6; cursor: wait; }
`
