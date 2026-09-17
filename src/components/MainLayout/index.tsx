import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { UserMe, UserRole } from '../../types/api'
import { Home, Search, ClipboardList, History, User, Plus, Trophy, Star, LayoutDashboard, Store, Users, UserPlus, GraduationCap, Ticket } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import DashboardLayout from '../DashboardLayout'
import type { NavItemDef } from '../DashboardLayout'
import { formatarNota } from '../../utils/numeros'

const NAV_ITEMS: NavItemDef[] = [
  { to: '/home',           label: 'Início',          icon: Home          },
  { to: '/quero-jogar',    label: 'Quero Jogar',     icon: Search        },
  { to: '/day-uses',       label: 'Day uses',        icon: Ticket        },
  { to: '/criar-partida',   label: 'Criar Partida',   icon: Plus          },
  { to: '/torneios',       label: 'Torneios',        icon: Trophy        },
  { to: '/minhas-partidas', label: 'Minhas Partidas', icon: ClipboardList },
  { to: '/times',          label: 'Meus Times',      icon: Users         },
  /*
   * `UserPlus`, e não outro par de silhuetas: `Users` já é o de Meus Times, e
   * `UsersRound` — que estava aqui — é o mesmo desenho com outro traço. No
   * tamanho do menu os dois eram indistinguíveis. Este tem o sinal de mais, que
   * é o glifo universal de seguir.
   */
  { to: '/amigos',         label: 'Amigos',          icon: UserPlus      },
  { to: '/historico',      label: 'Histórico',       icon: History       },
  { to: '/avaliacoes',     label: 'Avaliações',      icon: Star          },
  { to: '/perfil',         label: 'Perfil',          icon: User          },
]

interface PanelLink {
  to: string
  label: string
  icon: LucideIcon
}

/**
 * As áreas a mais de quem tem uma.
 *
 * O papel decide os painéis de admin e de dono; o **vínculo** decide a área do
 * professor, e é a decisão B da api#451 que manda: `user.role` é global e
 * exclusivo, e dar aula vale num espaço e não nos outros. Quem dá aula continua
 * `PLAYER` e ganha uma entrada a mais — não uma no lugar da outra. É por isso
 * que a assinatura recebe o usuário, e não só o papel.
 *
 * A entrada aparece só para quem tem vínculo. Professor é papel de poucos, e um
 * item de menu para todo mundo anunciaria uma área que a pessoa não alcança
 * sozinha: só o dono de um espaço concede o vínculo.
 */
function getPanelLinks(user: UserMe | null | undefined): PanelLink[] {
  const role: UserRole | undefined = user?.role
  const links: PanelLink[] = []

  if (role === 'ADMIN') {
    links.push({ to: '/admin', label: 'Painel Admin', icon: LayoutDashboard })
  }
  if (role === 'ADMIN' || role === 'OWNER') {
    links.push({ to: '/owner', label: 'Painel Owner', icon: Store })
  }
  if ((user?.vinculos?.professorEm?.length ?? 0) > 0) {
    links.push({ to: '/professor', label: 'Minhas aulas', icon: GraduationCap })
  }

  return links
}

/**
 * Layout da área do jogador.
 *
 * É **rota-pai**: renderiza `<Outlet />` em vez de receber `children`. Antes da
 * #197 cada uma das dez páginas renderizava este layout dentro de si, então
 * trocar de rota desmontava a sidebar e derrubava a conexão SSE do sino.
 *
 * ## Um layout só (web#493)
 *
 * Até a #493 este arquivo tinha a própria sidebar, e a área do jogador e o
 * painel do dono eram dois desenhos: aqui o título ficava dentro de cada
 * página e o sino só existia no celular; lá havia barra de topo com título,
 * sino e ações. Quem é dono e joga passava de um para o outro e mudava de
 * aplicativo no meio do caminho.
 *
 * Agora o jogador usa o `DashboardLayout`, e este arquivo só monta o menu. A
 * página publica o título com `usePageHeader` e as ações com `<PageActions>`;
 * a que não publica fica com o rótulo do item do menu.
 */
export default function MainLayout() {
  const { user } = useAuth()

  const navItems = useMemo<NavItemDef[]>(() => {
    const paineis = getPanelLinks(user)
    return [
      ...NAV_ITEMS,
      ...paineis.map((link, i) => ({ ...link, divider: i === 0 })),
    ]
  }, [user])

  return (
    <DashboardLayout
      navItems={navItems}
      tagline="Área do Jogador"
      accent="primary"
      sobreOUsuario={user ? (
        <>
          {/* A estrela era emoji (⭐), e cada sistema a desenhava com cor e peso próprios (#511). */}
          <Star size={12} fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-1px' }} />
          {' '}{user.stats?.averageStars != null ? formatarNota(user.stats.averageStars) : '—'} · {user.badge ?? 'Jogador'}
        </>
      ) : undefined}
    />
  )
}
