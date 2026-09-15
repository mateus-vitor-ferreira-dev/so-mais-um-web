import type { AssinaturaDoAdmin } from '../../../types/api'
import type { TomDeSelo } from './styles'

const DIA_MS = 24 * 60 * 60 * 1000

/**
 * A janela em que uma assinatura manual já conta como problema.
 *
 * Espelha o `ASSINATURA_EXPIRANDO_DIAS` do `admin.service` da api, que é o que
 * alimenta o "Vencendo" da Visão Geral. Se um mudar, o outro tem que mudar
 * junto — dois números diferentes fariam o painel contar quatro e esta tela
 * apontar três.
 */
export const DIAS_DE_ALERTA = 7

export const diasAte = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / DIA_MS)

/** Os status que vêm da Stripe, em português. */
const STATUS_DA_STRIPE: Record<string, string> = {
  active: 'Ativa',
  trialing: 'Em teste',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  inactive: 'Inativa',
}

/**
 * As origens em que quem manda é a data escrita à mão — espelha o
 * `VENCEM_POR_DATA` do `vigencia.ts` da api (#551).
 */
export const venceuPorData = (a: AssinaturaDoAdmin) => a.origem === 'MANUAL' || a.origem === 'CORTESIA'

/**
 * O selo de situação de uma assinatura.
 *
 * Quem decide se ela vale é a api, no campo `emDia` — a regra depende da origem
 * e vive no `subscriptions/vigencia.ts`. Aqui só se escolhe a palavra e a cor;
 * recalcular a regra deixaria duas cópias dela para discordarem no primeiro
 * ajuste.
 */
export function situacao(assinatura: AssinaturaDoAdmin): { tom: TomDeSelo; rotulo: string } {
  if (!venceuPorData(assinatura)) {
    return {
      tom: assinatura.emDia ? 'ok' : 'erro',
      rotulo: STATUS_DA_STRIPE[assinatura.status] ?? assinatura.status,
    }
  }

  if (assinatura.status === 'canceled') return { tom: 'neutro', rotulo: 'Encerrada' }
  if (!assinatura.emDia) {
    // "Teste acabado" e não "Vencida": ninguém deixou de pagar nada, o mês
    // simplesmente terminou — e é o fim esperado de toda cortesia.
    return { tom: 'erro', rotulo: assinatura.origem === 'CORTESIA' ? 'Teste acabado' : 'Vencida' }
  }

  const dias = assinatura.currentPeriodEnd ? diasAte(assinatura.currentPeriodEnd) : null
  if (dias !== null && dias <= DIAS_DE_ALERTA) {
    return { tom: 'alerta', rotulo: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}` }
  }

  return { tom: 'ok', rotulo: 'Em dia' }
}

/**
 * Precisa de alguém agora.
 *
 * A da Stripe fica de fora: ela tem webhook, e um cartão recusado lá vira
 * `past_due` sozinho e volta sozinho. A manual não tem ninguém — se a data
 * passar, o dono perde acesso e o primeiro a saber é ele.
 *
 * **A cortesia entra junto, e é a que mais precisa** (web#456): o fim do teste
 * é o único momento com data marcada em que a conversa de venda tem que
 * acontecer, e ele passa sozinho se ninguém abrir esta tela.
 *
 * Encerrada fica de fora de propósito: alguém já decidiu que aquela acabou.
 */
export const precisaDeAtencao = (a: AssinaturaDoAdmin) =>
  venceuPorData(a) &&
  a.status !== 'canceled' &&
  (!a.emDia || (a.currentPeriodEnd !== null && diasAte(a.currentPeriodEnd) <= DIAS_DE_ALERTA))

/** Valendo acesso agora, de qualquer origem. Quem decide é o `emDia` da api. */
const ativa = (a: AssinaturaDoAdmin) => a.emDia && a.status !== 'canceled'

/**
 * Os filtros da lista (web#502).
 *
 * "Todas" existe além dos quatro da issue porque a tela abre na de atenção só
 * quando há alguma — sem nada pedindo atenção, abrir num filtro vazio faria a
 * tela parecer sem assinatura nenhuma.
 */
export type Filtro = 'atencao' | 'todas' | 'manuais' | 'cortesias' | 'stripe'

export const FILTROS: { id: Filtro; rotulo: string; aplica: (a: AssinaturaDoAdmin) => boolean }[] = [
  { id: 'atencao', rotulo: 'Precisam de atenção', aplica: precisaDeAtencao },
  { id: 'todas', rotulo: 'Todas', aplica: () => true },
  { id: 'manuais', rotulo: 'Manuais (Pix)', aplica: (a) => a.origem === 'MANUAL' },
  { id: 'cortesias', rotulo: 'Cortesias', aplica: (a) => a.origem === 'CORTESIA' },
  { id: 'stripe', rotulo: 'Stripe', aplica: (a) => a.origem === 'STRIPE' },
]

/**
 * `"189,90"` → centavos. É o formato do `brl` do `admin.service` da api: duas
 * casas, vírgula e nenhum separador de milhar.
 */
const centavosDe = (valor: string) => Math.round(Number(valor.replace(/\./g, '').replace(',', '.')) * 100) || 0

/**
 * Os números do topo.
 *
 * A receita é **só a manual em dia**: a da Stripe já está na Receita Mensal da
 * Visão Geral, e a cortesia não é dinheiro. É soma, e não conta de taxa — o Pix
 * cai inteiro, então o líquido que a api manda é o valor recebido.
 */
export function numeros(assinaturas: AssinaturaDoAdmin[]) {
  return {
    ativas: assinaturas.filter(ativa).length,
    atencao: assinaturas.filter(precisaDeAtencao).length,
    cortesias: assinaturas.filter((a) => a.origem === 'CORTESIA' && ativa(a)).length,
    receitaManualCentavos: assinaturas
      .filter((a) => a.origem === 'MANUAL' && ativa(a))
      .reduce((soma, a) => soma + centavosDe(a.monthlyValue), 0),
  }
}
