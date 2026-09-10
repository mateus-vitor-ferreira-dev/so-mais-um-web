import styled, { css } from 'styled-components'

/** Os tons de selo. `manual`, `stripe` e `cortesia` marcam origem; o resto, situação. */
export type TomDeSelo = 'ok' | 'alerta' | 'erro' | 'neutro' | 'manual' | 'stripe' | 'cortesia'

const TONS = {
  ok:     css`background: ${({ theme }) => theme.colors.successLight}; color: ${({ theme }) => theme.colors.success};`,
  alerta: css`background: ${({ theme }) => theme.colors.warningLight}; color: ${({ theme }) => theme.colors.warningText};`,
  erro:   css`background: ${({ theme }) => theme.colors.errorLight};   color: ${({ theme }) => theme.colors.error};`,
  neutro: css`background: ${({ theme }) => theme.colors.borderLight};  color: ${({ theme }) => theme.colors.textMuted};`,
  manual: css`background: ${({ theme }) => theme.colors.primaryLight}; color: ${({ theme }) => theme.colors.primary};`,
  stripe: css`background: ${({ theme }) => theme.colors.infoLight};    color: ${({ theme }) => theme.colors.info};`,
  // Roxo, e não verde: cortesia ao lado da manual em verde diria "é a mesma
  // coisa que o Pix", que é o engano que a origem nova existe para desfazer.
  cortesia: css`background: ${({ theme }) => theme.colors.accentLight}; color: ${({ theme }) => theme.colors.accent};`,
}

export const Topo = styled.div`
  display: flex; justify-content: space-between; align-items: start; gap: 16px; margin-bottom: 16px;
  @media (max-width: 640px) { flex-direction: column; align-items: stretch; }
`
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
`
export const BotoesDoTopo = styled.div`
  display: flex; gap: 8px; flex-shrink: 0;
  @media (max-width: 640px) { flex-direction: column; }
`
export const BotaoRegistrar = styled.button`
  display: inline-flex; align-items: center; gap: 7px; white-space: nowrap;
  border: 0; border-radius: ${({ theme }) => theme.radii.md}; padding: 10px 16px; cursor: pointer;
  background: ${({ theme }) => theme.colors.primary}; color: ${({ theme }) => theme.colors.textOnPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.bold}; font-size: ${({ theme }) => theme.fontSizes.sm};
  &:hover { background: ${({ theme }) => theme.colors.primaryHover}; }
`
export const Aviso = styled.p`
  margin: 0; padding: 12px 14px; border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.infoLight}; color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm}; line-height: 1.5;
`
export const Atencao = styled.div`
  margin: 16px 0; padding: 12px 14px; border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.warningLight};
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  color: ${({ theme }) => theme.colors.warningText}; font-size: ${({ theme }) => theme.fontSizes.sm};
  display: flex; gap: 10px; align-items: start; line-height: 1.5;
`
export const Lista = styled.ul`list-style: none; padding: 0; margin: 16px 0 0; display: grid; gap: 10px;`
export const Linha = styled.li`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg}; padding: 16px;
  display: flex; justify-content: space-between; align-items: center; gap: 16px;
  @media (max-width: 760px) { flex-direction: column; align-items: stretch; }
`
export const Dados = styled.div`min-width: 0;`
export const Nome = styled.strong`display: block; color: ${({ theme }) => theme.colors.textPrimary};`
export const Detalhe = styled.span`
  display: block; margin-top: 3px; font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`
export const Selos = styled.div`display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;`
export const Selo = styled.span<{ $tom: TomDeSelo }>`
  padding: 3px 10px; border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.xs}; font-weight: ${({ theme }) => theme.fontWeights.bold};
  ${({ $tom }) => TONS[$tom]}
`
export const Acoes = styled.div`display: flex; gap: 8px; align-items: center; flex-shrink: 0;`
export const Botao = styled.button<{ $perigo?: boolean }>`
  border-radius: ${({ theme }) => theme.radii.sm}; padding: 8px 14px; cursor: pointer; background: transparent;
  font-weight: ${({ theme }) => theme.fontWeights.bold}; font-size: ${({ theme }) => theme.fontSizes.sm};
  border: 1px solid ${({ $perigo, theme }) => ($perigo ? theme.colors.error : theme.colors.primary)};
  color: ${({ $perigo, theme }) => ($perigo ? theme.colors.error : theme.colors.primary)};
  &:disabled { opacity: .55; cursor: wait; }
`
/**
 * O motivo de a assinatura da Stripe não ter botão.
 *
 * Texto, e não um botão desabilitado: desabilitado sem explicação faz quem
 * opera achar que a tela está quebrada e ir procurar o defeito.
 */
export const Travado = styled.p`
  margin: 0; max-width: 320px; text-align: right;
  font-size: ${({ theme }) => theme.fontSizes.xs}; color: ${({ theme }) => theme.colors.textMuted};
  @media (max-width: 760px) { text-align: left; }
`
export const Estado = styled.p`color: ${({ theme }) => theme.colors.textSecondary}; margin: 20px 0 0;`

export const ModalFundo = styled.div`
  position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center;
  padding: 16px; background: ${({ theme }) => theme.colors.bgOverlay};
`
export const ModalCaixa = styled.div`
  width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto;
  background: ${({ theme }) => theme.colors.bgCard}; color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: ${({ theme }) => theme.radii.lg}; padding: 22px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
`
export const ModalTitulo = styled.h2`margin: 0 0 8px; font-size: ${({ theme }) => theme.fontSizes.xl};`
export const ModalTexto = styled.p`
  margin: 0 0 16px; line-height: 1.5;
  font-size: ${({ theme }) => theme.fontSizes.sm}; color: ${({ theme }) => theme.colors.textSecondary};
`
export const Grupo = styled.div`margin-bottom: 14px;`
export const Campo = styled.label`
  display: grid; gap: 5px;
  font-size: ${({ theme }) => theme.fontSizes.sm}; font-weight: ${({ theme }) => theme.fontWeights.bold};
`
const campo = css`
  border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.sm};
  padding: 10px; font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ theme }) => theme.colors.bgInput}; color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: ${({ theme }) => theme.fontWeights.regular};
`
export const Selecao = styled.select`${campo}`
export const Data = styled.input`${campo}`
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
