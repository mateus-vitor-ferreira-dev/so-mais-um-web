import styled from 'styled-components'

/**
 * O catálogo tem um problema que nenhuma outra tela tem: ele mostra os dois
 * temas ao mesmo tempo, então a moldura da página não pode usar as cores do
 * tema — ela ficaria igual a um dos dois lados e o outro pareceria o errado.
 *
 * Por isso a casca é neutra e fixa, e só o que está DENTRO de cada painel
 * recebe tema.
 */
export const Pagina = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
  color: #1a1a1a;
  padding: 32px 24px 64px;
  font-family: ${({ theme }) => theme.fonts.sans};
`

export const Cabecalho = styled.header`
  max-width: 1100px;
  margin: 0 auto 40px;

  h1 {
    font-size: 1.875rem;
    margin: 0 0 12px;
  }

  p {
    margin: 0 0 10px;
    max-width: 70ch;
    line-height: 1.7;
    color: #444;
  }

  code {
    background: #e6e6e6;
    border-radius: 4px;
    padding: 1px 5px;
    font-size: 0.85em;
  }
`

export const Indice = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;

  a {
    background: #fff;
    border: 1px solid #d4d4d4;
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 0.8rem;
    color: #1a1a1a;
    text-decoration: none;
  }

  a:hover { border-color: #999; }
`

export const Secao = styled.section`
  max-width: 1100px;
  margin: 0 auto 48px;
  scroll-margin-top: 16px;

  h2 {
    font-size: 1.25rem;
    margin: 0 0 4px;
  }

  .onde {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 0.78rem;
    color: #666;
    margin: 0 0 10px;
  }

  .porque {
    margin: 0 0 18px;
    max-width: 78ch;
    line-height: 1.7;
    color: #444;
    font-size: 0.92rem;
  }
`

/** Os dois temas lado a lado. No mobile eles empilham, e continuam comparáveis. */
export const Painéis = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

export const Painel = styled.div<{ $escuro: boolean }>`
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${({ $escuro }) => ($escuro ? '#333' : '#d4d4d4')};

  .titulo {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 700;
    padding: 6px 12px;
    background: ${({ $escuro }) => ($escuro ? '#333' : '#e6e6e6')};
    color: ${({ $escuro }) => ($escuro ? '#e8e8e8' : '#444')};
  }

  /* O fundo do painel é o fundo REAL daquele tema: um componente que some no
     fundo do app precisa sumir aqui também, senão o catálogo mente. */
  .corpo {
    padding: 20px;
    background: ${({ $escuro }) => ($escuro ? '#111111' : '#f9fafb')};
  }
`

export const Estado = styled.div`
  & + & {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px dashed rgba(128, 128, 128, 0.35);
  }

  .rotulo {
    font-size: 0.72rem;
    color: #8a8a8a;
    margin-bottom: 8px;
  }
`

export const Fileira = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
`

/**
 * Um botão só para o catálogo ter o que pôr no slot de ação do EmptyState.
 *
 * Não sai daqui de propósito: o app ainda não tem botão compartilhado, e
 * inventar um agora — dentro do catálogo, sem tela que o peça — seria promover
 * peça sem uso, que é o oposto do que a #315 fez.
 */
export const BotaoDeExemplo = styled.button`
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 9px 16px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;
`

export const Tokens = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 10px;
`

export const Token = styled.div`
  font-size: 0.72rem;

  .amostra {
    height: 34px;
    border-radius: 6px;
    border: 1px solid rgba(128, 128, 128, 0.4);
    margin-bottom: 4px;
  }

  .nome { font-weight: 600; }
  .valor { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #8a8a8a; }
`

/**
 * Uma amostra com legenda, para a fileira da paleta.
 *
 * Ali o que se compara é a **cor**, não a inicial — e sem a legenda a fileira
 * lê como defeito, porque nomes diferentes colidem nas mesmas duas letras
 * (Verde e Vermelho dão "V", Roxo e Rosa dão "R").
 */
export const Amostra = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .legenda {
    font-size: 0.68rem;
    color: #8a8a8a;
  }
`
