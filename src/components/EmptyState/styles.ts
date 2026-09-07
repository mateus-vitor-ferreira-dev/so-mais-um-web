import styled, { css } from 'styled-components'

/**
 * A moldura tracejada.
 *
 * Ela não é decoração: é o que distingue "esta lista está vazia" de "esta
 * página não carregou". O tracejado diz *aqui caberia conteúdo*, e é por isso
 * que só aparece quando o vazio é o assunto principal da área — a lista de
 * times, a aba de partidas. Vazio de canto de tela não ganha caixa, senão a
 * ausência de dado vira o elemento mais pesado da página.
 */
const moldura = css`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
`

export const Caixa = styled.div<{ $comMoldura: boolean }>`
  text-align: center;
  line-height: 1.7;
  padding: ${({ theme }) => theme.spacing[8]} ${({ theme }) => theme.spacing[5]};

  ${({ $comMoldura }) => $comMoldura && moldura}
`

/**
 * O ícone é grande de propósito, e some para quem ouve (`aria-hidden` em quem
 * renderiza). Ele existe para dar peso visual ao vazio, não para informar —
 * o texto abaixo é que carrega o conteúdo.
 */
export const Icone = styled.div`
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: ${({ theme }) => theme.spacing[3]};

  svg {
    width: 2.5rem;
    height: 2.5rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

export const Titulo = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing[2]};
`

/**
 * O texto muda de peso conforme haja título, e isso não é detalhe de estilo.
 *
 * **Sem título, o texto É a mensagem** — "Nenhum usuário encontrado" é tudo o
 * que a área tem a dizer, e ele fica no tamanho de leitura (`md`, `textMuted`),
 * como nas onze telas que já faziam assim.
 *
 * **Com título, o texto é a linha de apoio** dele, e concorre com o título por
 * atenção: fica menor e mais escuro (`sm`, `textSecondary`), como as telas de
 * time e de partidas já faziam. Uniformizar os dois no tamanho grande fazia a
 * frase de apoio brigar com o título e quebrar em duas linhas onde cabia uma.
 */
export const Texto = styled.div<{ $comTitulo: boolean }>`
  margin: 0;

  color: ${({ theme, $comTitulo }) =>
    $comTitulo ? theme.colors.textSecondary : theme.colors.textMuted};
  font-size: ${({ theme, $comTitulo }) =>
    $comTitulo ? theme.fontSizes.sm : theme.fontSizes.md};

  /* As telas passam parágrafos soltos como filhos; sem isto, o espaçamento
     entre eles ficaria por conta do reset do navegador. */
  p {
    margin: 0 0 ${({ theme }) => theme.spacing[2]};
    &:last-child { margin-bottom: 0; }
  }
`

export const Acao = styled.div`
  margin-top: ${({ theme }) => theme.spacing[5]};
  display: flex;
  justify-content: center;
`
