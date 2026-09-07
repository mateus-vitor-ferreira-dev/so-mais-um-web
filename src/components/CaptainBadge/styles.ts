import styled from 'styled-components'

export const Selo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${({ theme }) => theme.colors.primaryLight};
  color: ${({ theme }) => theme.colors.primaryDark};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 2px ${({ theme }) => theme.spacing[2]};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
`
