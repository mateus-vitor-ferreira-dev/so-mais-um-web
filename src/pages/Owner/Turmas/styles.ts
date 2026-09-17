import styled from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate, LARGURA_DE_LEITURA } from '../../../styles/telas'

/** 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
const campoNoCelular = `
  ${ate.tablet} {
    font-size: 1rem;
  }
`

/**
 * O seletor de espaço, no topo — mesmo lugar e mesma forma do Professores, do
 * Estoque e dos Equipamentos.
 *
 * A tela entrou pelo menu, e menu não carrega parâmetro.
 */
export const SeletorDeEspaco = styled.select`
  min-height: 44px;
  margin-bottom: 20px;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  max-width: 100%;

  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 1px;
  }

  ${campoNoCelular}
  ${ate.celular} { width: 100%; }
`

export const Caixa = styled.section`
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};

  ${ate.celular} {
    padding: 16px;
  }
`

export const Topo = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;

  ${ate.celular} {
    flex-direction: column;
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

export const Botao = styled.button`
  display: inline-flex;
  gap: 8px;
  align-items: center;
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
  justify-content: center;
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

export const Form = styled.form`
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  align-items: start;
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

const campo = `
  min-height: 44px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 0.875rem;
  width: 100%;
  ${campoNoCelular}
`

export const Input = styled.input<{ $erro?: boolean }>`
  ${campo}
  border: 1px solid ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.border)};
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: 2px solid ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.primary)};
    outline-offset: 1px;
  }
`

export const Select = styled.select<{ $erro?: boolean }>`
  ${campo}
  border: 1px solid ${({ theme, $erro }) => ($erro ? theme.colors.error : theme.colors.border)};
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

export const AcoesDoForm = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  grid-column: 1 / -1;
`

/**
 * O aviso de que cadastrar ocupa a quadra.
 *
 * Não é decoração: a api gera as oito semanas de aulas dentro do `criarTurma`,
 * e sem esta linha o dono descobre pela agenda e acha que é defeito.
 */
export const Aviso = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  padding: 10px 12px;
  border: 1px solid ${({ theme }) => theme.colors.warningBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.warningLight};
  color: ${({ theme }) => theme.colors.warningText};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.5;
`

export const Lista = styled.ul`
  display: grid;
  /* \`minmax(0, 1fr)\`: sem ele a coluna crescia até a largura dos botões numa
     linha só, e o cartão da turma passava da borda com 503px numa tela de 360. */
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`

export const GrupoDoDia = styled.li`
  list-style: none;
`

export const TituloDoDia = styled.h3`
  margin: 0 0 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.textMuted};
`

/**
 * Turma inativa **não some** — fica esmaecida.
 *
 * Desativar não é apagar: a api não tem `DELETE` de propósito, e sumir da lista
 * contaria outra história.
 */
export const Cartao = styled.div<{ $inativa?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  opacity: ${({ $inativa }) => ($inativa ? 0.55 : 1)};

  ${ate.tablet} {
    flex-direction: column;
  }
  ${ate.celular} {
    padding: 14px;
  }
`

export const Dados = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`

export const Horario = styled.strong`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Detalhe = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

export const SemProfessor = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-style: italic;
  color: ${({ theme }) => theme.colors.textMuted};
`

export const Lado = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;

  ${ate.tablet} {
    align-items: flex-start;
    width: 100%;
  }
`

export const Acoes = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;

  /* No cartão, as ações em duas colunas iguais: numa linha só, "Tirar
     professor" e "Desativar" ficavam fora da tela. */
  ${ate.tablet} {
    justify-content: flex-start;
  }
  ${ate.celular} {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    width: 100%;
    /* O botão que sobra sozinho ocupa a linha, em vez de meia linha vazia. */
    & > :last-child:nth-child(odd) { grid-column: 1 / -1; }
  }
`

/**
 * A ocupação: `17 / 20`.
 *
 * Fica em destaque porque é o número que responde a única pergunta que se faz
 * olhando a lista — cabe mais alguém? Muda de tom quando a turma lota.
 */
export const Ocupacao = styled.span<{ $lotada: boolean }>`
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  background: ${({ theme, $lotada }) => ($lotada ? theme.colors.warningLight : theme.colors.primaryLight)};
  color: ${({ theme, $lotada }) => ($lotada ? theme.colors.warningText : theme.colors.primaryDark)};
`

export const Selo = styled.span`
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
`

export const Valor = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
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

/**
 * O seletor que põe professor numa turma que está sem (#407).
 *
 * ## Por que ele mora aqui, e não num formulário
 *
 * O cartão já tinha **Tirar professor**, e não tinha o contrário: uma vez
 * tirado, a turma ficava sem professor para sempre e a única saída era apagá-la
 * e refazer, perdendo matrículas, chamadas e mensalidades. A porta era de mão
 * única.
 *
 * O caminho mais curto de volta é onde a falta aparece — no próprio cartão,
 * embaixo do "Sem professor". Um formulário de edição resolveria isto e mais,
 * e é a decisão 2 registrada na issue; não é o que o bug pedia.
 */
export const EscolherProfessor = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
`

/**
 * Menor que o `Select` do formulário, porque divide a linha com o rótulo e vive
 * dentro de um cartão de lista — o do formulário ocupa a largura do campo.
 */
export const SelectDoCartao = styled.select`
  max-width: 100%;
  width: 220px;
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: progress;
  }

  ${ate.tablet} {
    min-height: ${ALVO_DE_TOQUE};
    font-size: 1rem;
  }
`
