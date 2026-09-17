/**
 * As palavras e o recorte da previsão (web#477).
 *
 * O caso que carrega o arquivo é o de `riscoDaOcupacao`: é ele que decide qual
 * marcação da agenda do dono fica vermelha. Encostar não é tocar — a mesma
 * régua da agenda e da api —, e só o risco alto destaca.
 */
import { describe, expect, it } from 'vitest'
import type { HoraDoTempo, OcupacaoDaQuadra } from '../types/api'
import { Cloud, CloudLightning, CloudRain, CloudSun, Sun, Thermometer } from 'lucide-react'
import { diaEMes, fraseDoRisco, graus, hojeLocal, iconeDaCondicao, motivosPorExtenso, porcento, riscoDaOcupacao } from './previsao'

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
    expect(iconeDaCondicao('THUNDERSHOWER')).toBe(CloudLightning)
    expect(iconeDaCondicao('LIGHT_RAIN_SHOWERS')).toBe(CloudRain)
    expect(iconeDaCondicao('PARTLY_CLOUDY')).toBe(CloudSun)
    expect(iconeDaCondicao('MOSTLY_CLOUDY')).toBe(Cloud)
    expect(iconeDaCondicao('CLEAR')).toBe(Sun)
    expect(iconeDaCondicao('TIPO_NOVO_DA_GOOGLE')).toBe(Thermometer)
    expect(iconeDaCondicao(null)).toBe(Thermometer)
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

describe('fraseDoRisco (web#476)', () => {
  const h = (inicio: string, extra: Partial<HoraDoTempo>) =>
    hora(inicio, new Date(new Date(inicio).getTime() + 3_600_000).toISOString(), extra)

  it('diz a primeira hora que chega ao pior nível, com os motivos dela', () => {
    const inicio = new Date(2026, 8, 14, 17).toISOString()
    const depois = new Date(2026, 8, 14, 20).toISOString()
    const horas = [
      h(inicio, { risco: 'ATENCAO', motivos: ['CALOR'] }),
      h(depois, { risco: 'ALTO', motivos: ['TEMPESTADE'] }),
    ]

    expect(fraseDoRisco(horas, 'ALTO')).toBe('Risco de tempestade às 20h')
    expect(fraseDoRisco(horas, 'ATENCAO')).toBe('Atenção: calor às 17h')
    expect(fraseDoRisco(horas, 'NENHUM')).toBeNull()
  })

  it('o dia e o mês saem da data civil, sem fuso', () => {
    expect(diaEMes('2026-09-01')).toBe('01/09')
  })
})
