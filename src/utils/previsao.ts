import type { HoraDoTempo, MotivoDoRisco, OcupacaoDaQuadra, AvaliacaoDoTempo } from '../types/api'

/**
 * As palavras e os recortes da previsão do tempo (épico api#580).
 *
 * **Nenhum limiar mora aqui.** Se chove "o bastante" para ser risco é a api que
 * diz, por hora e por esporte (api#583). Este arquivo só escreve o que ela
 * mandou, e cruza as horas que ela avaliou com a agenda que a tela já tem.
 */

const PALAVRA_DO_MOTIVO: Record<MotivoDoRisco, string> = {
  TEMPESTADE: 'tempestade',
  CHUVA: 'chuva',
  VENTO: 'vento forte',
  CALOR: 'calor',
}

/** `chuva e vento forte` — na ordem da api, que é do mais grave ao mais leve. */
export function motivosPorExtenso(motivos: MotivoDoRisco[]): string {
  const palavras = motivos.map((m) => PALAVRA_DO_MOTIVO[m])
  if (palavras.length <= 1) return palavras[0] ?? ''
  return `${palavras.slice(0, -1).join(', ')} e ${palavras.at(-1)}`
}

/**
 * O ícone da condição que a Google mandou (`weatherCondition.type`).
 *
 * Por família, e não valor a valor: a Google tem mais de trinta tipos
 * (`LIGHT_RAIN_SHOWERS`, `SCATTERED_THUNDERSTORMS`…), e o que a tela precisa
 * distinguir são seis. A ordem importa — `THUNDERSHOWER` é tempestade antes de
 * ser chuva.
 */
export function iconeDaCondicao(condicao: string | null): string {
  if (!condicao) return '🌡️'
  if (condicao.includes('THUNDER')) return '⛈️'
  if (condicao.includes('RAIN') || condicao.includes('SHOWER')) return '🌧️'
  if (condicao.includes('SNOW') || condicao.includes('HAIL')) return '🌨️'
  if (condicao.includes('WIND')) return '💨'
  if (condicao === 'PARTLY_CLOUDY') return '⛅'
  if (condicao.includes('CLOUDY')) return '☁️'
  if (condicao === 'MOSTLY_CLEAR') return '🌤️'
  if (condicao === 'CLEAR') return '☀️'
  return '🌡️'
}

/** `24°`, ou `—` quando a Google não mandou o número. */
export function graus(valor: number | null): string {
  return valor === null ? '—' : `${Math.round(valor)}°`
}

/** `70%`, ou `—`. */
export function porcento(valor: number | null): string {
  return valor === null ? '—' : `${Math.round(valor)}%`
}

/** `19h` — a hora local em que a hora da previsão começa. */
export function horaCheia(iso: string): string {
  return `${new Date(iso).getHours()}h`
}

/** Hoje, `AAAA-MM-DD`, no relógio de quem está olhando. */
export function hojeLocal(agora = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${agora.getFullYear()}-${mes}-${dia}`
}

/**
 * O risco `ALTO` que uma marcação da agenda atravessa, ou `null`.
 *
 * Só o `ALTO` destaca: `ATENCAO` em toda linha de uma tarde nublada deixaria a
 * agenda inteira amarela, e o destaque deixaria de apontar para alguma coisa.
 *
 * A régua de "tocar" é a mesma da agenda e da api: encostar não é tocar. A hora
 * das 20h às 21h fica fora da partida que acaba às 20h.
 */
export function riscoDaOcupacao(ocupacao: OcupacaoDaQuadra, horas: HoraDoTempo[]): AvaliacaoDoTempo | null {
  const inicio = new Date(ocupacao.inicio).getTime()
  const fim = new Date(ocupacao.fim).getTime()
  const emRisco = horas.filter(
    (h) => h.risco === 'ALTO' && new Date(h.inicio).getTime() < fim && new Date(h.fim).getTime() > inicio,
  )
  if (emRisco.length === 0) return null

  const ordem: MotivoDoRisco[] = ['TEMPESTADE', 'CHUVA', 'VENTO', 'CALOR']
  return {
    risco: 'ALTO',
    motivos: ordem.filter((m) => emRisco.some((h) => h.motivos.includes(m))),
  }
}
