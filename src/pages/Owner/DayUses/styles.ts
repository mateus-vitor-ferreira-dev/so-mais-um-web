import styled from 'styled-components'

/**
 * Os estilos da tela de day use.
 *
 * Nascem da tela de Turmas e são deliberadamente parecidos: as duas são a
 * oferta comercial do espaço, moram lado a lado no menu, e o dono passa de uma
 * para a outra. Divergir na aparência aqui seria inventar dialeto.
 *
 * O que é só do day use vem no fim do arquivo.
 */

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
`

export const Caixa = styled.section`
  padding: 20px;
  margin-bottom: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
`

export const Topo = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 4px;

  @media (max-width: 560px) {
    flex-direction: column;
  }
`

export const TituloDaCaixa = styled.h2`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Explicacao = styled.p`
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
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
`

/**
 * Turma inativa **não some** — fica esmaecida.
 *
 * Cancelar não é apagar: o day use guarda quem pagou quanto naquele dia, e
 * sumir com ele levaria o registro do dinheiro junto. O cancelado fica
 * esmaecido quando o filtro o traz de volta.
 */
export const Cartao = styled.div<{ $cancelado?: boolean }>`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  opacity: ${({ $cancelado }) => ($cancelado ? 0.55 : 1)};

  @media (max-width: 640px) {
    flex-direction: column;
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

export const Lado = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;

  @media (max-width: 640px) {
    align-items: flex-start;
  }
`

export const Acoes = styled.div`
  display: flex;
  gap: 8px;
`

/**
 * A ocupação: `17 / 20`.
 *
 * Fica em destaque porque é o número que responde a única pergunta que se faz
 * olhando a lista — cabe mais alguém? Muda de tom quando o day use lota.
 *
 * `maxPessoas` nulo é sem teto, e aí `$lotado` é sempre falso: não há o que
 * lotar, e pintar de alerta um day use sem limite seria mentira.
 */
export const Ocupacao = styled.span<{ $lotado: boolean }>`
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 700;
  background: ${({ theme, $lotado }) => ($lotado ? theme.colors.warningLight : theme.colors.primaryLight)};
  color: ${({ theme, $lotado }) => ($lotado ? theme.colors.warningText : theme.colors.primaryDark)};
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
 * Menor que o `Select` do formulário, porque divide a linha com o rótulo e vive
 * dentro de um cartão de lista — o do formulário ocupa a largura do campo.
 */
export const SelectDoCartao = styled.select`
  max-width: 220px;
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
`

/**
 * A faixa de preço de quem entrou.
 *
 * `ALUNO` ganha destaque porque é a exceção — a maioria entra como `GERAL`, e
 * um selo em cada linha viraria ruído.
 */
export const Faixa = styled.span<{ $aluno: boolean }>`
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${({ theme, $aluno }) => ($aluno ? theme.colors.primary : theme.colors.border)};
  color: ${({ theme, $aluno }) => ($aluno ? theme.colors.primary : theme.colors.textSecondary)};
`

/**
 * O resumo do dinheiro, no topo da lista de quem está dentro.
 *
 * Os números vêm da api: somar `Decimal` no cliente é onde o centavo se perde.
 */
export const Resumo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 14px 16px;
  margin-bottom: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};

  div { display: flex; flex-direction: column; gap: 2px; }

  dt {
    margin: 0;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  dd {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

/** Linha de quem está dentro: nome à esquerda, dinheiro e ações à direita. */
export const LinhaDaPessoa = styled.li<{ $pago: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid
    ${({ theme, $pago }) => ($pago ? theme.colors.primary : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};

  .quem { display: flex; flex-direction: column; gap: 2px; min-width: 0; }

  .nome {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .contato {
    font-size: 12px;
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .dinheiro { display: flex; align-items: center; gap: 10px; }
`
