import styled from 'styled-components'

export const Container = styled.main`
  max-width: 1100px;
  margin: 0 auto;

  > button {
    display: inline-flex; align-items: center; gap: 6px; border: 0; padding: 0;
    background: transparent; color: ${({ theme }) => theme.colors.textSecondary}; cursor: pointer;
  }
`

export const Titulo = styled.header`
  margin: 20px 0;
  h1 { margin: 0; color: ${({ theme }) => theme.colors.textPrimary}; }
  p { margin: 6px 0 0; color: ${({ theme }) => theme.colors.textSecondary}; }
`

export const Filtros = styled.div`
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: end;
  padding: 16px; border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg}; background: ${({ theme }) => theme.colors.bgCard};

  label, .localizacao {
    display: grid; gap: 8px; color: ${({ theme }) => theme.colors.textSecondary};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
  label { grid-template-columns: auto 1fr; align-items: center; }

  input, select {
    width: 100%; grid-column: 1 / -1; box-sizing: border-box; padding: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.bgCard};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  @media (max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

/** Cidade ou perto de mim: uma pergunta, duas respostas — nunca as duas. */
export const Abas = styled.div`
  display: inline-flex; gap: 4px; padding: 3px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
`

export const Aba = styled.button<{ $ativa: boolean }>`
  display: inline-flex; align-items: center; gap: 5px; flex: 1; justify-content: center;
  padding: 6px 10px; border: 0; cursor: pointer; white-space: nowrap;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  background: ${({ $ativa, theme }) => ($ativa ? theme.colors.primary : 'transparent')};
  color: ${({ $ativa, theme }) => ($ativa ? '#fff' : theme.colors.textSecondary)};

  /* Desabilitado e mudo faria a pessoa procurar o que ela fez de errado; o
     title do componente diz o motivo onde ela está olhando. */
  &:disabled { cursor: not-allowed; opacity: 0.5; }
`

export const Limpar = styled.button`
  justify-self: start; align-self: center; padding: 0; border: 0; background: transparent;
  color: ${({ theme }) => theme.colors.primary}; cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm}; text-decoration: underline;
`

/**
 * O vazio de verdade — o que sobrou do "informe uma cidade" (#469).
 *
 * Ele diz **o que afrouxar**, e não o que preencher: chegar aqui já significa
 * que a pessoa perguntou, e a resposta foi nenhum.
 */
export const Vazio = styled.div`
  display: grid; gap: 6px; margin: 32px 0; padding: 24px; text-align: center;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};

  strong { color: ${({ theme }) => theme.colors.textPrimary}; }
  span { color: ${({ theme }) => theme.colors.textSecondary}; }

  button {
    padding: 0; border: 0; background: transparent; cursor: pointer;
    color: ${({ theme }) => theme.colors.primary}; text-decoration: underline;
  }
`
