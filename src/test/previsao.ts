import type { HoraDoTempo, LeituraDoTempo } from '../types/api'

/**
 * Leituras do tempo para teste (web#476, web#477).
 *
 * As horas saem do relógio local, e não de um ISO escrito à mão: o vitest não
 * fixa `TZ`, e "19h" num ISO em UTC viraria "16h" num runner em UTC-3.
 */
export function horaDoTempo(h: number, over: Partial<HoraDoTempo> = {}): HoraDoTempo {
  return {
    inicio: new Date(2026, 8, 14, h).toISOString(),
    fim: new Date(2026, 8, 14, h + 1).toISOString(),
    temperatura: 24,
    sensacao: 24,
    chanceDeChuva: 10,
    chuvaMm: 0,
    chanceDeTempestade: 0,
    vento: 5,
    rajada: 10,
    uv: 1,
    condicao: 'CLEAR',
    risco: 'NENHUM',
    motivos: [],
    ...over,
  }
}

export function leituraPorHora(horas: HoraDoTempo[]): LeituraDoTempo {
  const ordem = ['NENHUM', 'ATENCAO', 'ALTO'] as const
  const risco = horas.reduce<LeituraDoTempo['risco']>(
    (acc, h) => (ordem.indexOf(h.risco) > ordem.indexOf(acc) ? h.risco : acc),
    'NENHUM',
  )
  const motivos = (['TEMPESTADE', 'CHUVA', 'VENTO', 'CALOR'] as const).filter((m) =>
    horas.some((h) => h.motivos.includes(m)),
  )
  return { alcance: 'HORA', risco, motivos, horas }
}

export function leituraDoDia(over: Partial<NonNullable<LeituraDoTempo['dia']>> = {}, risco: LeituraDoTempo['risco'] = 'NENHUM', motivos: LeituraDoTempo['motivos'] = []): LeituraDoTempo {
  return {
    alcance: 'DIA',
    risco,
    motivos,
    dia: {
      data: '2026-09-20',
      maxima: 24,
      minima: 15,
      sensacaoMaxima: 25,
      chanceDeChuva: 70,
      chanceDeTempestade: 10,
      vento: 12,
      condicao: 'RAIN',
      risco,
      motivos,
      ...over,
    },
  }
}
