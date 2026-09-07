import styled from 'styled-components'

export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: ${({ theme }) => theme.colors.bgPage};
`

export const Caixa = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
  padding: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.bgCard};
  text-align: center;
`

export const Titulo = styled.h1`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const Explicacao = styled.p`
  margin: 0 0 8px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`

export const Tentar = styled.button`
  padding: 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-weight: 700;
  cursor: pointer;

  &:disabled { opacity: 0.6; cursor: default; }
`

/* Discreto de propósito: sair é a saída de emergência, não o caminho sugerido —
   quem chegou aqui provavelmente não precisa entrar de novo. */
export const Sair = styled.button`
  padding: 8px;
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-decoration: underline;
  cursor: pointer;
`
