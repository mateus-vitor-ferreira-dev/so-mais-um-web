/**
 * Os formatos de data, e a regra que os mantém num lugar só (web#492).
 *
 * A regra de que a data formatada à mão não sai daqui é conferida pelo
 * `scripts/verifica-formatacao.mjs`, e não por teste: pelo mesmo motivo do
 * `verifica-primeira-tela.mjs`, ler o `src/` de dentro da suíte inflaria a
 * cobertura.
 */
import { describe, expect, it } from 'vitest'
import {
  dataCompletaPorExtenso, dataCurta, dataEHora, dataPorExtenso, diaDaSemanaEData, diaDaSemanaEMes,
  diaDaSemanaEHora, diaEMes, diaMesEHora, hora,
} from './datas'
import { formatarNota, formatarNumero } from './numeros'

// Hora local, e não ISO em UTC: o vitest não fixa TZ, e o formato usa o relógio de quem olha.
const TERCA = new Date(2026, 8, 15, 19, 5)
const semEspacoDuro = (s: string) => s.replace(/[\u00a0\u202f]/g, ' ')

describe('datas (web#492)', () => {
  it('cada formato com nome', () => {
    expect(dataCurta(TERCA)).toBe('15/09/2026')
    expect(diaEMes(TERCA)).toBe('15/09')
    expect(dataPorExtenso(TERCA)).toBe('15 de setembro de 2026')
    expect(dataCompletaPorExtenso(TERCA)).toBe('terça-feira, 15 de setembro de 2026')
    expect(diaDaSemanaEData(TERCA)).toBe('ter., 15/09')
    expect(diaDaSemanaEMes(TERCA)).toBe('ter., 15 de set')
    expect(hora(TERCA)).toBe('19:05')
    expect(semEspacoDuro(diaMesEHora(TERCA))).toBe('15/09, 19:05')
    expect(semEspacoDuro(dataEHora(TERCA))).toBe('15/09/2026, 19:05')
    expect(semEspacoDuro(diaDaSemanaEHora(TERCA))).toBe('ter., 19:05')
  })

  it('aceita o ISO que a api manda', () => {
    expect(dataCurta(TERCA.toISOString())).toBe('15/09/2026')
  })

  it('com fuso, o dia é o do fuso, e não o de quem olha', () => {
    // 01:30 UTC de 16/09 ainda é 15/09 em Lavras.
    expect(dataCurta('2026-09-16T01:30:00.000Z', 'America/Sao_Paulo')).toBe('15/09/2026')
  })
})

describe('numeros (web#492)', () => {
  it('nota com vírgula e uma casa, e número com separador de milhar', () => {
    expect(formatarNota(4.5)).toBe('4,5')
    expect(formatarNota('4')).toBe('4,0')
    expect(formatarNumero(1234.5)).toBe('1.234,5')
  })
})
