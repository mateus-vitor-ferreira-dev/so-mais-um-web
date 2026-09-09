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
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;
  padding: 16px; border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg}; background: ${({ theme }) => theme.colors.bgCard};
  label { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 8px; color: ${({ theme }) => theme.colors.textSecondary}; font-size: ${({ theme }) => theme.fontSizes.sm}; }
  input, select { width: 100%; grid-column: 1 / -1; box-sizing: border-box; padding: 10px; border: 1px solid ${({ theme }) => theme.colors.border}; border-radius: ${({ theme }) => theme.radii.md}; background: ${({ theme }) => theme.colors.bgCard}; color: ${({ theme }) => theme.colors.textPrimary}; }
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`

export const Hint = styled.p`
  margin: 24px 0; color: ${({ theme }) => theme.colors.textSecondary};
`
