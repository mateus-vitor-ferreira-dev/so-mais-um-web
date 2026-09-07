import styled from 'styled-components'

/**
 * A seção de day use dentro do Quero Jogar (web#420).
 *
 * Visualmente separada do grid de partidas de propósito. Os cards de lá
 * desenham `Partida` — organizador, barra de vagas, botão de entrar —, e um
 * card de day use no meio deles herdaria affordances que não existem, a
 * começar pela que sugere que dá para entrar dali.
 */
export const Secao = styled.section`
  margin: 24px 0 8px;
`

export const Cabecalho = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.md};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

/**
 * A frase que impede a tela de prometer reserva.
 *
 * "3 de 16" se lê como *ainda tem vaga para mim*, e quem registra a entrada é o
 * dono, na porta — a api#519 decidiu isso e o épico #505 já tinha posto vaga
 * garantida fora de escopo. Sem esta linha, a seção promete o que o produto
 * não faz.
 */
export const Aviso = styled.p`
  margin: 0 0 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

export const Grade = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
`

export const Cartao = styled.article<{ $lotado: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  /* Lotado fica visível, e não escondido: quem vê aprende que o lugar enche. */
  opacity: ${({ $lotado }) => ($lotado ? 0.7 : 1)};

  header { display: flex; flex-direction: column; gap: 2px; }

  .quadra {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  .lugar {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  .linha {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

export const Precos = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;

  .geral {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  /* A faixa de aluno é informação sobre a oferta, e não sobre quem olha: a
     api não personaliza, e a tela não inventa que o desconto é seu. */
  .aluno {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.primary};
  }
`

export const Selo = styled.span<{ $lotado: boolean }>`
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid ${({ theme, $lotado }) => ($lotado ? theme.colors.border : theme.colors.primary)};
  color: ${({ theme, $lotado }) => ($lotado ? theme.colors.textSecondary : theme.colors.primary)};
`
