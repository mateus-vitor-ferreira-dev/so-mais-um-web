/**
 * As palavras e o recorte da previsão (web#477).
 *
 * O caso que carrega o arquivo é o de `riscoDaOcupacao`: é ele que decide qual
 * marcação da agenda do dono fica vermelha. Encostar não é tocar — a mesma
 * régua da agenda e da api —, e só o risco alto destaca.
 */
import { describe, expect, it } from 'vitest'
import type { HoraDoTempo, OcupacaoDaQuadra } from '../types/api'
import { graus, hojeLocal, iconeDaCondicao, motivosPorExtenso, porcento, riscoDaOcupacao } from './previsao'

function hora(inicio: string, fim: string, extra: Partial<HoraDoTempo> = {}): HoraDoTempo {
  return {
    inicio,
    fim,
    temperatura: 22,
    sensacao: 22,
    chanceDeChuva: 10,
    chuvaMm: 0,
    chanceDeTempestade: 0,
    vento: 5,
    rajada: 10,
    uv: 3,
    condicao: 'CLEAR',
    risco: 'NENHUM',
    motivos: [],
    ...extra,
  }
}

const partida = (inicio: string, fim: string): OcupacaoDaQuadra => ({
  tipo: 'PARTIDA',
  id: 'p1',
  inicio,
  fim,
  descricao: 'partida de Ana',
})

describe('motivosPorExtenso', () => {
  it('escreve um, dois e três motivos em português', () => {
    expect(motivosPorExtenso(['CHUVA'])).toBe('chuva')
    expect(motivosPorExtenso(['CHUVA', 'VENTO'])).toBe('chuva e vento forte')
    expect(motivosPorExtenso(['TEMPESTADE', 'CHUVA', 'CALOR'])).toBe('tempestade, chuva e calor')
    expect(motivosPorExtenso([])).toBe('')
  })
})

describe('iconeDaCondicao', () => {
  it('agrupa os tipos da Google por família, com a tempestade antes da chuva', () => {
    expect(iconeDaCondicao('THUNDERSHOWER')).toBe('⛈️')
    expect(iconeDaCondicao('LIGHT_RAIN_SHOWERS')).toBe('🌧️')
    expect(iconeDaCondicao('PARTLY_CLOUDY')).toBe('⛅')
    expect(iconeDaCondicao('MOSTLY_CLOUDY')).toBe('☁️')
    expect(iconeDaCondicao('CLEAR')).toBe('☀️')
    expect(iconeDaCondicao('TIPO_NOVO_DA_GOOGLE')).toBe('🌡️')
    expect(iconeDaCondicao(null)).toBe('🌡️')
  })
})

describe('números', () => {
  it('arredonda, e escreve traço quando a Google não mandou', () => {
    expect(graus(23.6)).toBe('24°')
    expect(graus(null)).toBe('—')
    expect(porcento(69.5)).toBe('70%')
    expect(porcento(null)).toBe('—')
  })

  it('hoje é o dia do relógio local', () => {
    expect(hojeLocal(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05')
  })
})

describe('riscoDaOcupacao', () => {
  const horas = [
    hora('2026-09-14T21:00:00.000Z', '2026-09-14T22:00:00.000Z', { risco: 'ATENCAO', motivos: ['CALOR'] }),
    hora('2026-09-14T22:00:00.000Z', '2026-09-14T23:00:00.000Z', { risco: 'ALTO', motivos: ['CHUVA', 'CALOR'] }),
    hora('2026-09-14T23:00:00.000Z', '2026-09-15T00:00:00.000Z', { risco: 'ALTO', motivos: ['TEMPESTADE'] }),
  ]

  it('junta os motivos das horas de risco alto que a marcação atravessa, do mais grave ao mais leve', () => {
    const risco = riscoDaOcupacao(partida('2026-09-14T22:30:00.000Z', '2026-09-14T23:30:00.000Z'), horas)
    expect(risco).toEqual({ risco: 'ALTO', motivos: ['TEMPESTADE', 'CHUVA', 'CALOR'] })
  })

  it('só atenção não destaca', () => {
    expect(riscoDaOcupacao(partida('2026-09-14T21:00:00.000Z', '2026-09-14T22:00:00.000Z'), horas)).toBeNull()
  })

  it('encostar na hora de risco não é tocar', () => {
    expect(riscoDaOcupacao(partida('2026-09-14T20:00:00.000Z', '2026-09-14T22:00:00.000Z'), horas)).toBeNull()
  })
})
