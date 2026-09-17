import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { alvoDeToque, ate, LARGURA_DE_LEITURA } from '../../styles/telas'

/** A largura máxima do conteúdo e da linha da topbar. */
const LARGURA_DO_CONTEUDO = '1440px'

export const Shell = styled.div`
  display: flex;
  height: 100vh;
  background: ${({ theme }) => theme.colors.bgApp};
  font-family: ${({ theme }) => theme.fonts.sans};
`

// ── Sidebar ───────────────────────────────────────────────────────────────────

export const Sidebar = styled.aside<{ $open?: boolean }>`
  width: 240px;
  min-width: 240px;
  height: 100vh;
  background: ${({ theme }) => theme.colors.bgSidebar};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  padding: 24px 12px;
  position: sticky;
  top: 0;
  z-index: 80;

  ${ate.tablet} {
    position: fixed;
    left: 0;
    transform: translateX(${({ $open }) => $open ? '0' : '-100%'});
    transition: transform 0.2s ease;
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`

export const MobileOverlay = styled.button`
  display: none;

  ${ate.tablet} {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 70;
    border: 0;
    background: ${({ theme }) => theme.colors.bgOverlay};
  }
`

export const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px;
  margin-bottom: 8px;
`

export const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  flex-shrink: 0;
`

export const LogoText = styled.div`
  display: flex;
  flex-direction: column;
`

export const LogoName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.2;
`

export const LogoTagline = styled.span<{ accent: 'primary' | 'warning' }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ accent, theme }) => theme.colors[accent]};
`

export const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border};
  margin: 16px 8px;
`

export const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`

export const NavItem = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
  position: relative;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
  }

  &.active {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  svg {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
  }
`

/**
 * Item que o plano não abre.
 *
 * É um `button`, e não um `NavLink`, de propósito: ele leva para a tela de planos,
 * não para a rota do item. Se fosse um NavLink apontando para `/owner/plans`, dois
 * itens do menu ficariam com a classe `.active` ao mesmo tempo naquela tela.
 *
 * Continua visível em vez de sumir porque o dono precisa saber que a funcionalidade
 * existe — menu que esconde o que ele poderia comprar não vende nada e ainda o deixa
 * achando que o produto não faz aquilo.
 */
export const NavItemBloqueado = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textMuted ?? theme.colors.textSecondary};
  opacity: 0.55;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.15s;

  &:hover { opacity: 0.85; }

  svg { flex-shrink: 0; width: 18px; height: 18px; }

  .cadeado { margin-left: auto; width: 14px; height: 14px; }
`

export const NavBadge = styled.span`
  margin-left: auto;
  background: ${({ theme }) => theme.colors.error};
  color: ${({ theme }) => theme.colors.textOnError};
  /* 12px, o piso de texto, como o número do sino (#511). */
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
`

// ── Theme toggle ──────────────────────────────────────────────────────────────

export const ThemeToggleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.bgCard};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};
  margin-bottom: 4px;

  &:hover,
  &:active {
    background: ${({ theme }) => theme.colors.primarySubtle};
    color: ${({ theme }) => theme.colors.primary};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary};
    outline-offset: 2px;
  }

  svg { flex-shrink: 0; width: 18px; height: 18px; }
`

export const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: ${({ theme }) => theme.fonts.sans};
  margin-bottom: 4px;

  &:hover {
    background: ${({ theme }) => theme.colors.errorLight};
    color: ${({ theme }) => theme.colors.error};
  }

  svg { flex-shrink: 0; }
`

// ── User card ─────────────────────────────────────────────────────────────────

export const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-top: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.primarySubtle};
  }
`

export const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.textOnPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  flex-shrink: 0;
`

export const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`

export const UserName = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const UserRole = styled.span<{ accent?: 'primary' | 'warning' }>`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ accent, theme }) => (accent ? theme.colors[accent] : theme.colors.textMuted)};
`

// ── Main area ─────────────────────────────────────────────────────────────────

export const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`

export const Topbar = styled.header`
  background: ${({ theme }) => theme.colors.bgSidebar};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 16px 32px;

  ${ate.tablet} {
    padding: 12px 16px;
  }
`

export const MobileMenuBtn = styled.button`
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.bgCard};
  cursor: pointer;
  ${alvoDeToque}

  ${ate.tablet} {
    display: flex;
  }
`

export const TopbarTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 2px;

  /* No celular o título divide a linha com o menu, o sino e a ação da página:
     uma linha só, cortada, em vez de empurrar a barra para duas (web#493). */
  ${ate.tablet} {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const TopbarSub = styled.p`
  max-width: ${LARGURA_DE_LEITURA};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;

  ${ate.tablet} {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export const TopbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  /* No celular, a ação da página que tem ícone fica só com o ícone (web#493).
     Com o rótulo inteiro, "Criar Partida" deixava para o título "Minhas ...".
     O texto continua no botão, só sem tamanho: é ele que dá o nome acessível. */
  ${ate.tablet} {
    .acoes-da-pagina > button:has(svg) {
      font-size: 0;
      gap: 0;
      width: 40px;
      height: 40px;
      padding: 0;
      justify-content: center;
    }

    .acoes-da-pagina > button:has(svg) svg {
      margin: 0 !important;
    }
  }
`

export const TopbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* A mesma largura e o mesmo centro do conteúdo: o título começa onde a
     página começa, e o sino termina onde ela termina (web#502). */
  max-width: ${LARGURA_DO_CONTEUDO};
  margin-inline: auto;

  ${ate.tablet} {
    justify-content: flex-start;
    gap: 12px;

    .page-heading {
      min-width: 0;
      flex: 1;
    }
  }
`

export const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;

  ${ate.tablet} {
    padding: 20px 16px;
  }
`

/**
 * A largura do conteúdo, a mesma para jogador, dono e admin (web#493).
 *
 * Até a #493 cada página do jogador escolhia a sua (1100, 1200, 780 centrado,
 * 680 à esquerda), e o painel do dono ocupava a tela toda. Numa tela larga, o
 * título da topbar ficava num lugar e o conteúdo começava em outro.
 *
 * **Centrada desde a web#502.** Com 1200px colados à esquerda, um monitor largo
 * deixava o lado direito vazio e as tabelas do admin espremidas. A largura
 * subiu para 1440px e o bloco foi para o centro, junto com a linha da topbar.
 */
export const LarguraDoConteudo = styled.div`
  max-width: ${LARGURA_DO_CONTEUDO};
  margin-inline: auto;
`
