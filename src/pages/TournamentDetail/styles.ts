import styled from 'styled-components'
import { alvoDeToque, ate } from '../../styles/telas'

/** Tons semânticos aceitos pelo Badge desta página. */
export type BadgeTone = 'info' | 'warning' | 'success' | 'error' | 'default'

export const Container = styled.div`
  max-width: 720px;
`

export const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  padding: 0;
  margin-bottom: 20px;
  transition: color 0.15s;
  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
  ${alvoDeToque}
`

export const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: ${({ theme }) => theme.shadows.sm};

  ${ate.celular} { padding: ${({ theme }) => theme.spacing[4]}; }
`

export const SportIcon = styled.div`
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
`

export const HeaderInfo = styled.div`
  flex: 1;
  min-width: 0;
`

export const TournamentName = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 4px;
`

export const PlaceName = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
`

export const StatusBadge = styled.span<{ $color?: BadgeTone }>`
  flex-shrink: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $color, theme }) => {
    const map: Record<BadgeTone, string> = {
      info:    theme.colors.infoLight,
      warning: theme.colors.warningLight,
      success: theme.colors.successLight,
      error:   theme.colors.errorLight,
      default: theme.colors.borderLight,
    }
    return ($color && map[$color]) || theme.colors.borderLight
  }};
  color: ${({ $color, theme }) => {
    const map: Record<BadgeTone, string> = {
      info:    theme.colors.infoText,
      warning: theme.colors.warningText,
      success: theme.colors.success,
      error:   theme.colors.error,
      default: theme.colors.textSecondary,
    }
    return ($color && map[$color]) || theme.colors.textSecondary
  }};
`

export const Body = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 20px;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export const FormatCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.primarySubtle};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0 ${({ theme }) => theme.radii.md} ${({ theme }) => theme.radii.md} 0;
`

export const FormatIcon = styled.span`
  display: flex;
  color: ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
`

export const FormatDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 2px;
`

export const FormatHint = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  margin: 0;
`

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  ${ate.celular} {
    grid-template-columns: 1fr;
  }
`

export const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
`

export const InfoIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.primarySubtle};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.primary};
`

export const InfoLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 2px;
`

export const InfoValue = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

export const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin: 0;
`

export const DivisionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`

export const BracketToggle = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => theme.spacing[2]};
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font: inherit;
  text-align: left;
  cursor: pointer;

  ${alvoDeToque}
`

export const BracketSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`
