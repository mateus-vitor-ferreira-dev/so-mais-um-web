import styled from 'styled-components'
import { ALVO_DE_TOQUE, alvoDeToque, ate } from '../../styles/telas'

/* Largura, respiro e alinhamento são do layout (web#493): a página não
   repete o padding do conteúdo nem se centraliza por conta própria. */
export const Container = styled.div``

export const StatsCard = styled.div`
  background: ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing[6]};
  /* O par do tema: no escuro o primary é verde-claro, e branco nele não se lê. */
  color: ${({ theme }) => theme.colors.textOnPrimary};
  display: flex;
  justify-content: space-around;
  gap: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[8]};
  box-shadow: ${({ theme }) => theme.shadows.md};

  .stat-item {
    text-align: center;
    h2 {
      font-size: ${({ theme }) => theme.fontSizes['3xl']};
      margin-bottom: 4px;
    }
    p {
      opacity: 0.8;
      font-size: ${({ theme }) => theme.fontSizes.sm};
    }
  }

  ${ate.celular} {
    padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[3]};
    margin-bottom: ${({ theme }) => theme.spacing[6]};
    .stat-item {
      flex: 1 1 0;
      min-width: 0;
      h2 { font-size: ${({ theme }) => theme.fontSizes['2xl']}; }
      p { font-size: ${({ theme }) => theme.fontSizes.xs}; opacity: 0.9; }
    }
  }
`

export const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[4]};
`

export const HistoryCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing[4]} ${({ theme }) => theme.spacing[6]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[3]};

  /* No celular o botão vai para baixo, na largura toda. Ao lado, ele tomava 100px
     e o nome do local saía em três linhas. */
  ${ate.celular} {
    flex-direction: column;
    align-items: stretch;
    padding: ${({ theme }) => theme.spacing[4]};
    .action button { width: 100%; }
  }

  .info {
    min-width: 0;
    h4 {
      font-size: ${({ theme }) => theme.fontSizes.lg};
      color: ${({ theme }) => theme.colors.textPrimary};
      margin-bottom: 4px;
    }
    p {
      font-size: ${({ theme }) => theme.fontSizes.sm};
      color: ${({ theme }) => theme.colors.textSecondary};
    }
  }

  .action {
    button {
      background: ${({ theme }) => theme.colors.primaryLight};
      color: ${({ theme }) => theme.colors.primaryDark};
      border: none;
      padding: 8px 16px;
      border-radius: ${({ theme }) => theme.radii.full};
      font-weight: bold;
      cursor: pointer;
      &:hover {
        background: ${({ theme }) => theme.colors.primary};
        color: ${({ theme }) => theme.colors.textOnPrimary};
      }
      ${alvoDeToque}
    }
  }
`

export const EvalModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  /* A margem do modal no celular: sem ela a caixa encosta nas bordas da tela. */
  padding: 16px;
`

export const EvalModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: ${({ theme }) => theme.spacing[6]};
  border-radius: ${({ theme }) => theme.radii.xl};
  width: 100%;
  max-width: 600px;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;

  ${ate.celular} { padding: ${({ theme }) => theme.spacing[4]}; }
`

export const ProgressInfo = styled.div`
  background: ${({ theme }) => theme.colors.bgApp};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing[3]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;

  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.textSecondary};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.primary};
  }
`

export const ProgressBarWrap = styled.div<{ $pct?: number; }>`
  height: 6px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  margin-top: ${({ theme }) => theme.spacing[2]};
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing[3]};

  div {
    height: 100%;
    background: ${({ theme }) => theme.colors.primary};
    border-radius: ${({ theme }) => theme.radii.full};
    width: ${({ $pct }) => $pct}%;
    transition: width 0.4s ease;
  }
`

export const CommentTextarea = styled.textarea`
  width: 100%;
  padding: ${({ theme }) => theme.spacing[2]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-family: ${({ theme }) => theme.fonts.sans};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
  resize: vertical;
  min-height: 52px;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  /* 16px no celular: abaixo disso o Safari do iPhone dá zoom ao focar o campo. */
  ${ate.tablet} { font-size: ${({ theme }) => theme.fontSizes.md}; }
`

export const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.primaryLight};
    color: ${({ theme }) => theme.colors.primaryDark};
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    font-size: 18px;
  }

  .details {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-weight: bold;
    color: ${({ theme }) => theme.colors.textPrimary};
    margin-bottom: 8px;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 8px;
    select {
      padding: 4px;
      border-radius: 4px;
      border: 1px solid ${({ theme }) => theme.colors.border};
      background: ${({ theme }) => theme.colors.bgInput};
      color: ${({ theme }) => theme.colors.textPrimary};

      ${ate.tablet} { min-height: ${ALVO_DE_TOQUE}; font-size: ${({ theme }) => theme.fontSizes.md}; padding: 0 8px; }
    }
  }

  /* No celular a avaliação desce para a largura toda: numa coluna de 140px ao
     lado do nome, o comentário mostrava três palavras por linha. */
  ${ate.celular} {
    flex-wrap: wrap;
    gap: 12px;
    .avatar { width: 40px; height: 40px; font-size: 16px; }
    .controls { flex-basis: 100%; }
  }
`

/** O rodapé do modal de avaliação. */
export const AcoesDaAvaliacao = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 24px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    ${alvoDeToque}
  }

  .cancelar {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  /* A cor primária do tema, e não o #22c55e com branco, que dava 2,3:1. */
  .salvar {
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textOnPrimary};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }
  .salvar:disabled { cursor: not-allowed; opacity: 0.7; }

  ${ate.celular} { gap: 10px; }
`
