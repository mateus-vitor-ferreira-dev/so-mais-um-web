import type { Court, FaixaDeExpediente, FaixaDePrecoDaQuadra } from '../types/api'

/**
 * As contas do editor de faixas de preço (web#474, api#576), fora do JSX.
 *
 * **O que NÃO mora aqui é a regra de sobreposição.** Quem recusa faixa que
 * colide é a api, e a tela mostra a mensagem dela no lugar certo. A faixa que
 * atravessa a meia-noite é justamente onde duas cópias da regra começariam a
 * discordar, e a da api é a que vale.
 */

export const DIAS_DA_SEMANA = [
  { dia: 0, nome: 'Domingo' },
  { dia: 1, nome: 'Segunda' },
  { dia: 2, nome: 'Terça' },
  { dia: 3, nome: 'Quarta' },
  { dia: 4, nome: 'Quinta' },
  { dia: 5, nome: 'Sexta' },
  { dia: 6, nome: 'Sábado' },
] as const

export const DIAS_UTEIS = [1, 2, 3, 4, 5]
export const FIM_DE_SEMANA = [0, 6]
export const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6]

/** Uma faixa como o editor a guarda: o valor é texto, porque é o que o campo devolve. */
export interface FaixaEditavel {
  /** Estável entre renders, para o React e para apontar a faixa que a api recusou. */
  chave: string
  inicio: string
  fim: string
  valor: string
}

/** As faixas de cada dia da semana, de 0 (domingo) a 6. */
export type SemanaDeFaixas = Record<number, FaixaEditavel[]>

let sequencia = 0
const novaChave = () => `faixa-${++sequencia}`

export function semanaVazia(): SemanaDeFaixas {
  return Object.fromEntries(TODOS_OS_DIAS.map((dia) => [dia, []]))
}

export function novaFaixa(inicio = '18:00', fim = '23:00', valor = ''): FaixaEditavel {
  return { chave: novaChave(), inicio, fim, valor }
}

/** A tabela da api, arrumada por dia. */
export function semanaDaApi(faixas: FaixaDePrecoDaQuadra[] = []): SemanaDeFaixas {
  const semana = semanaVazia()
  for (const faixa of faixas) {
    semana[faixa.diaDaSemana]?.push(novaFaixa(faixa.inicio, faixa.fim, String(Number(faixa.valorPorHora))))
  }
  return semana
}

export interface FaixasParaApi {
  faixas: Array<{ diaDaSemana: number; inicio: string; fim: string; valorPorHora: number }>
  /** A chave de cada faixa, na mesma ordem: é por ela que o 422 da api vira a linha certa. */
  chaves: string[]
}

/** A semana na ordem em que vai para a api: domingo primeiro, e cada dia na ordem da tela. */
export function semanaParaApi(semana: SemanaDeFaixas): FaixasParaApi {
  const faixas: FaixasParaApi['faixas'] = []
  const chaves: string[] = []
  for (const dia of TODOS_OS_DIAS) {
    for (const faixa of semana[dia] ?? []) {
      faixas.push({ diaDaSemana: dia, inicio: faixa.inicio, fim: faixa.fim, valorPorHora: Number(faixa.valor) })
      chaves.push(faixa.chave)
    }
  }
  return { faixas, chaves }
}

/**
 * As faixas do dia `origem` copiadas por cima dos `destinos`.
 *
 * Substitui, e não soma: "copiar a segunda para os dias úteis" quer dizer que a
 * terça fica igual à segunda. Somar deixaria a terça com as faixas antigas e as
 * novas, e a api recusaria as duas pela sobreposição.
 */
export function copiarDia(semana: SemanaDeFaixas, origem: number, destinos: number[]): SemanaDeFaixas {
  const copia = { ...semana }
  for (const dia of destinos) {
    if (dia === origem) continue
    copia[dia] = (semana[origem] ?? []).map((f) => novaFaixa(f.inicio, f.fim, f.valor))
  }
  return copia
}

/** `2h`, `22h30`. */
export function horaCurta(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`
}

const minutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5))

/**
 * O fim da faixa por extenso, quando ele não é óbvio.
 *
 * A faixa das 22h às 2h é aceita, e é a que mais engana: "22:00 — 02:00" numa
 * linha de sábado lê como erro de digitação. Dita por extenso, lê como é.
 */
export function fimPorExtenso(faixa: Pick<FaixaEditavel, 'inicio' | 'fim'>): string | null {
  if (!faixa.inicio || !faixa.fim) return null
  if (faixa.inicio === faixa.fim) return 'por 24 horas, até a mesma hora do dia seguinte'
  if (faixa.fim === '00:00') return 'até a meia-noite'
  if (faixa.fim < faixa.inicio) return `até as ${horaCurta(faixa.fim)} do dia seguinte`
  return null
}

/**
 * O aviso discreto de faixa fora do expediente, ou `null` (épico api#574).
 *
 * A faixa fora do horário do espaço é **aceita** — é decisão do épico: o dono
 * pode ter aberto a quadra num horário que o expediente cadastrado não conta.
 * O aviso só diz o que pode ter passado despercebido.
 *
 * Dia sem expediente cadastrado não avisa nada: sem o horário, a tela não sabe
 * se a faixa está fora dele.
 */
export function avisoDeExpediente(
  dia: number,
  faixa: Pick<FaixaEditavel, 'inicio' | 'fim'>,
  expediente: FaixaDeExpediente[],
): string | null {
  const doDia = expediente.filter((e) => e.diaDaSemana === dia)
  if (doDia.length === 0 || !faixa.inicio || !faixa.fim) return null

  const fimEmMinutos = (inicio: string, fim: string) => (fim <= inicio ? minutos(fim) + 1440 : minutos(fim))
  const abre = Math.min(...doDia.map((e) => minutos(e.abre)))
  const fecha = Math.max(...doDia.map((e) => fimEmMinutos(e.abre, e.fecha)))
  const primeiro = doDia.find((e) => minutos(e.abre) === abre)!
  const ultimo = doDia.find((e) => fimEmMinutos(e.abre, e.fecha) === fecha)!

  if (minutos(faixa.inicio) < abre) return `o espaço abre às ${horaCurta(primeiro.abre)}`
  if (fimEmMinutos(faixa.inicio, faixa.fim) > fecha) return `o espaço fecha às ${horaCurta(ultimo.fecha)}`
  return null
}

/**
 * As chaves das duas faixas que a api disse que se sobrepõem.
 *
 * A mensagem dela conta as posições a partir de 1, na ordem que a tela mandou
 * ("As faixas 2 e 5 se sobrepõem"). É por isso que `semanaParaApi` devolve as
 * chaves junto: sem a ordem, a posição não diz linha nenhuma.
 */
export function faixasApontadasPelaApi(mensagem: string, chaves: string[]): string[] {
  const achado = /faixas (\d+) e (\d+)/i.exec(mensagem)
  if (!achado) return []
  return [Number(achado[1]), Number(achado[2])].map((posicao) => chaves[posicao - 1]).filter(Boolean)
}

const reais = (valor: number) =>
  valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * O preço da quadra na lista do dono: `R$ 120,00/h`, ou `R$ 80,00 a 150,00/h`.
 *
 * O intervalo sai do `precoMinimo` e do `precoMaximo` que a api já calcula. A
 * tela não varre faixa nenhuma — a lista nem as recebe.
 */
export function precoNaLista(court: Pick<Court, 'pricePerHour' | 'precoVariaPorHorario' | 'precoMinimo' | 'precoMaximo'>): string | null {
  if (court.precoVariaPorHorario && court.precoMinimo != null && court.precoMaximo != null) {
    return court.precoMinimo === court.precoMaximo
      ? `R$ ${reais(court.precoMinimo)}/h`
      : `R$ ${reais(court.precoMinimo)} a ${reais(court.precoMaximo)}/h`
  }
  return court.pricePerHour != null ? `R$ ${reais(Number(court.pricePerHour))}/h` : null
}

/** `R$ 250` ou `R$ 58,33`: centavo só quando existe. */
export function reaisCurtos(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(valor) ? 0 : 2, maximumFractionDigits: 2 })}`
}

/**
 * O selo da quadra na escolha, antes de existir horário (web#475).
 *
 * No passo 1 não há hora escolhida, então o preço exato ainda não existe:
 * a quadra com faixas diz **"a partir de"** o menor preço dela.
 */
export function seloDePrecoDaQuadra(court: Pick<Court, 'pricePerHour' | 'precoVariaPorHorario' | 'precoMinimo' | 'precoMaximo'>): string | null {
  if (court.precoVariaPorHorario && court.precoMinimo != null) {
    return court.precoMinimo === court.precoMaximo
      ? `${reaisCurtos(court.precoMinimo)}/h`
      : `a partir de ${reaisCurtos(court.precoMinimo)}/h`
  }
  return court.pricePerHour != null && Number(court.pricePerHour) > 0 ? `${reaisCurtos(Number(court.pricePerHour))}/h` : null
}

/** `17h–18h a R$ 100/h · 18h–19h a R$ 150/h` — o detalhamento da cotação, na hora de quem olha. */
export function detalhamentoPorExtenso(trechos: Array<{ de: string; ate: string; valorPorHora: number }>): string {
  const hora = (iso: string) => {
    const d = new Date(iso)
    return d.getMinutes() === 0 ? `${d.getHours()}h` : `${d.getHours()}h${String(d.getMinutes()).padStart(2, '0')}`
  }
  return trechos.map((t) => `${hora(t.de)}–${hora(t.ate)} a ${reaisCurtos(t.valorPorHora)}/h`).join(' · ')
}
