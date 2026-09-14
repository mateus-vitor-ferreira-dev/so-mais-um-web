/**
 * As contas do editor de faixas (web#474).
 *
 * O caso que carrega o arquivo é o de `faixasApontadasPelaApi`: a api conta as
 * posições na ordem que a tela mandou, e é essa ordem que transforma "as faixas
 * 2 e 5" nas duas linhas certas.
 */
import { describe, expect, it } from 'vitest'
import type { FaixaDeExpediente } from '../types/api'
import {
  DIAS_UTEIS, FIM_DE_SEMANA, TODOS_OS_DIAS,
  avisoDeExpediente, copiarDia, faixasApontadasPelaApi, fimPorExtenso, novaFaixa, precoNaLista,
  semanaDaApi, semanaParaApi, semanaVazia,
} from './faixasDePreco'

describe('semana ↔ api', () => {
  it('arruma a tabela da api por dia, e devolve na ordem de domingo a sábado com as chaves', () => {
    const semana = semanaDaApi([
      { diaDaSemana: 6, inicio: '22:00', fim: '02:00', valorPorHora: '140' },
      { diaDaSemana: 1, inicio: '18:00', fim: '23:00', valorPorHora: '120.50' },
    ])

    expect(semana[1]).toEqual([expect.objectContaining({ inicio: '18:00', fim: '23:00', valor: '120.5' })])

    const { faixas, chaves } = semanaParaApi(semana)
    expect(faixas).toEqual([
      { diaDaSemana: 1, inicio: '18:00', fim: '23:00', valorPorHora: 120.5 },
      { diaDaSemana: 6, inicio: '22:00', fim: '02:00', valorPorHora: 140 },
    ])
    expect(chaves).toEqual([semana[1][0].chave, semana[6][0].chave])
  })

  it('a mensagem de sobreposição da api vira as chaves das duas faixas', () => {
    expect(faixasApontadasPelaApi('As faixas 1 e 3 se sobrepõem', ['a', 'b', 'c'])).toEqual(['a', 'c'])
    expect(faixasApontadasPelaApi('Outra coisa', ['a'])).toEqual([])
  })
})

describe('copiarDia', () => {
  const comSegunda = () => ({ ...semanaVazia(), 1: [novaFaixa('18:00', '23:00', '120')], 2: [novaFaixa('08:00', '10:00', '50')] })

  it('dias úteis: terça a sexta ficam iguais à segunda, substituindo o que tinham', () => {
    const copia = copiarDia(comSegunda(), 1, DIAS_UTEIS)

    for (const dia of [2, 3, 4, 5]) {
      expect(copia[dia]).toEqual([expect.objectContaining({ inicio: '18:00', fim: '23:00', valor: '120' })])
    }
    expect(copia[0]).toEqual([])
    expect(copia[6]).toEqual([])
    // Cópia é faixa nova: chave própria, para destacar uma sem destacar a outra.
    expect(copia[2][0].chave).not.toBe(copia[1][0].chave)
  })

  it('fim de semana e outros dias', () => {
    expect(copiarDia(comSegunda(), 1, FIM_DE_SEMANA)[6]).toHaveLength(1)
    const todos = copiarDia(comSegunda(), 1, TODOS_OS_DIAS)
    expect(TODOS_OS_DIAS.every((dia) => todos[dia].length === 1)).toBe(true)
  })
})

describe('fimPorExtenso', () => {
  it('diz o fim da faixa que atravessa a meia-noite', () => {
    expect(fimPorExtenso({ inicio: '22:00', fim: '02:00' })).toBe('até as 2h do dia seguinte')
    expect(fimPorExtenso({ inicio: '22:00', fim: '01:30' })).toBe('até as 1h30 do dia seguinte')
    expect(fimPorExtenso({ inicio: '18:00', fim: '00:00' })).toBe('até a meia-noite')
    expect(fimPorExtenso({ inicio: '10:00', fim: '10:00' })).toMatch(/24 horas/)
    expect(fimPorExtenso({ inicio: '18:00', fim: '23:00' })).toBeNull()
  })
})

describe('avisoDeExpediente', () => {
  const expediente: FaixaDeExpediente[] = [{ id: 'e1', diaDaSemana: 1, abre: '08:00', fecha: '23:00' }]

  it('avisa quando a faixa passa do fechamento ou começa antes da abertura', () => {
    expect(avisoDeExpediente(1, { inicio: '22:00', fim: '02:00' }, expediente)).toBe('o espaço fecha às 23h')
    expect(avisoDeExpediente(1, { inicio: '06:00', fim: '09:00' }, expediente)).toBe('o espaço abre às 8h')
    expect(avisoDeExpediente(1, { inicio: '18:00', fim: '23:00' }, expediente)).toBeNull()
  })

  it('expediente que atravessa a meia-noite cobre a faixa da madrugada', () => {
    const ateAs2 = [{ id: 'e1', diaDaSemana: 5, abre: '16:00', fecha: '02:00' }]
    expect(avisoDeExpediente(5, { inicio: '22:00', fim: '02:00' }, ateAs2)).toBeNull()
  })

  it('dia sem expediente cadastrado não avisa nada', () => {
    expect(avisoDeExpediente(3, { inicio: '22:00', fim: '02:00' }, expediente)).toBeNull()
  })
})

describe('precoNaLista', () => {
  it('valor único, intervalo com as faixas, e nada sem preço', () => {
    expect(precoNaLista({ pricePerHour: '120', precoVariaPorHorario: false, precoMinimo: 120, precoMaximo: 120 })).toBe('R$ 120,00/h')
    expect(precoNaLista({ pricePerHour: '80', precoVariaPorHorario: true, precoMinimo: 80, precoMaximo: 150 })).toBe('R$ 80,00 a 150,00/h')
    expect(precoNaLista({ pricePerHour: null, precoVariaPorHorario: false, precoMinimo: null, precoMaximo: null })).toBeNull()
    // Api antiga, sem os campos novos: o preço de sempre.
    expect(precoNaLista({ pricePerHour: '90' })).toBe('R$ 90,00/h')
  })
})
