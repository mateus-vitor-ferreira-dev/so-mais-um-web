import {
  LayoutDashboard, Users, ClipboardList, Building2, Home, Store, ShieldCheck, CreditCard, Package, Dumbbell,
  GraduationCap, CalendarClock, Ticket,
} from 'lucide-react'
import type { NavItemDef } from '../components/DashboardLayout'
import type { PlanFeature, UserRole } from '../types/api'

/**
 * Navegação lateral dos painéis de admin e owner, em um lugar só.
 *
 * O menu estava replicado em oito arquivos — uma cópia em cada página dos dois
 * painéis — e as cópias já haviam divergido: a do Owner/Dashboard chamava o
 * item de "Estabelecimentos" e o listava depois de "Solicitações", enquanto as
 * outras três diziam "Meus Estabelecimentos" e o traziam antes. O menu mudava
 * de forma conforme a página aberta.
 *
 * Os itens de visão geral apontam para `/admin/dashboard` e `/owner/dashboard`,
 * e não para `/admin` e `/owner`. Estas duas últimas são apenas
 * redirecionamentos (`routes/index.tsx`), então o usuário nunca permanece
 * nelas — e um NavLink com `end` apontando para lá jamais receberia a classe
 * `.active`.
 */
export const adminNavItems: NavItemDef[] = [
  { to: '/admin/dashboard', label: 'Visão Geral',        icon: LayoutDashboard, end: true },
  { to: '/admin/users',     label: 'Gestão de Usuários', icon: Users           },
  { to: '/admin/requests',  label: 'Solicitações',       icon: ClipboardList   },
  { to: '/admin/places',    label: 'Estabelecimentos',   icon: Building2       },
  { to: '/owner',           label: 'Painel do Owner',    icon: Store, divider: true },
  { to: '/home',            label: 'Área do Jogador',    icon: Home },
]

/**
 * Menu do owner. Ganha um atalho para o painel admin quando quem acessa é ADMIN, e
 * marca com cadeado o que o plano assinado não abre.
 *
 * **Item bloqueado não some.** Ele fica visível, esmaecido, e o clique leva para a
 * tela de planos — é assim que o dono descobre que a funcionalidade existe. Esconder
 * o que ele poderia comprar não vende nada e ainda o deixa achando que o produto não
 * faz aquilo.
 *
 * Visão Geral, Planos, Meus Estabelecimentos e Solicitações **nunca** são bloqueados:
 * são como o dono entra na plataforma, o que ele já contratou e como ele paga. A
 * Visão Geral entra na lista porque a página existe para todo mundo — o que depende de
 * plano são as estatísticas dentro dela, e quem barra isso é a própria página.
 *
 * Professores também nunca é bloqueado, mas por outro motivo — está escrito no item.
 */
export function ownerNavItems(
  role: UserRole | undefined,
  temFuncionalidade: (funcionalidade: PlanFeature) => boolean = () => true,
): NavItemDef[] {
  return [
    { to: '/owner/dashboard', label: 'Visão Geral',           icon: LayoutDashboard, end: true },
    { to: '/owner/plans',     label: 'Planos',                 icon: CreditCard      },
    { to: '/owner/places',    label: 'Meus Estabelecimentos', icon: Building2       },
    { to: '/owner/inventory', label: 'Estoque',                icon: Package,
      bloqueado: !temFuncionalidade('ESTOQUE') },
    { to: '/owner/equipment', label: 'Equipamentos',          icon: Dumbbell,
      bloqueado: !temFuncionalidade('EQUIPAMENTOS') },
    /*
     * Professores (api#451). **Continua nunca bloqueado**, mesmo depois da
     * api#531 ter portado a escolinha inteira.
     *
     * Não é esquecimento: a assinatura é do dono do espaço, e o professor é
     * prestador — ele não assina nada. As rotas de `/me/turmas` e `/me/aulas`
     * ficaram fora do portão de propósito, e a api tem teste prendendo isso. Um
     * cadeado aqui contradiria ela.
     */
    { to: '/owner/professores', label: 'Professores',        icon: GraduationCap   },
    /*
     * Turmas (api#472), sob `ESCOLINHA` desde a api#531.
     *
     * A mesma funcionalidade abre matrícula, mensalidade, aula e chamada — a
     * turma semanal é um bloco só, e vender "turma sem chamada" seria vender um
     * caderno pela metade. Por isso o cadeado é um, e não cinco.
     */
    { to: '/owner/turmas',    label: 'Turmas',                 icon: CalendarClock,
      bloqueado: !temFuncionalidade('ESCOLINHA') },
    /**
     * Day use (api#505). Ao lado de Turmas porque são os dois formatos que o
     * espaço vende, e o dono passa de um para o outro. Sob `DAY_USE` desde a
     * api#531 — cadeado próprio, porque o day use vende sozinho: quadra que só
     * aluga hora ganha dinheiro com ele sem nunca abrir uma turma.
     */
    { to: '/owner/day-uses',  label: 'Day use',                icon: Ticket,
      bloqueado: !temFuncionalidade('DAY_USE') },
    { to: '/owner/requests',  label: 'Solicitações',          icon: ClipboardList   },
    ...(role === 'ADMIN'
      ? [{ to: '/admin', label: 'Painel Admin', icon: ShieldCheck, divider: true }]
      : []),
    { to: '/home',            label: 'Área do Jogador',       icon: Home, divider: role !== 'ADMIN' },
  ]
}
