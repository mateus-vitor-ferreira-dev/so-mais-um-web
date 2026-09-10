import { describe, it, expect } from 'vitest'
import { faixaDeHorario, ehFaixa } from './horarios'

/** Quarta-feira, 10/09/2026, 15h. Dia de semana, para o fim de semana ser futuro. */
const QUARTA_15H = new Date(2026, 8, 10, 15, 0, 0)

const local = (iso?: string) => (iso === undefined ? undefined : new Date(iso))

describe('faixaDeHorario', () => {
  it('qualquer dia não manda faixa nenhuma — é a tela abrindo com tudo', () => {
    expect(faixaDeHorario('qualquer', QUARTA_15H)).toEqual({})
  })

  it('hoje começa AGORA, e não à meia-noite', () => {
    // O que terminou de manhã não é onde jogar às 15h.
    const { from, to } = faixaDeHorario('hoje', QUARTA_15H)

    expect(local(from)).toEqual(QUARTA_15H)
    expect(local(to)?.getHours()).toBe(23)
    expect(local(to)?.getDate()).toBe(10)
  })

  it('amanhã pega o dia inteiro, da meia-noite ao fim', () => {
    const { from, to } = faixaDeHorario('amanha', QUARTA_15H)

    expect(local(from)?.getDate()).toBe(11)
    expect(local(from)?.getHours()).toBe(0)
    expect(local(to)?.getDate()).toBe(11)
    expect(local(to)?.getHours()).toBe(23)
  })

  it('fim de semana vai do sábado 00h ao domingo 23h59', () => {
    const { from, to } = faixaDeHorario('fim-de-semana', QUARTA_15H)

    expect(local(from)?.getDate()).toBe(12) // sábado
    expect(local(from)?.getDay()).toBe(6)
    expect(local(from)?.getHours()).toBe(0)
    expect(local(to)?.getDate()).toBe(13) // domingo
    expect(local(to)?.getDay()).toBe(0)
  })

  it('no próprio sábado, o fim de semana é ESTE — e não o de daqui a sete dias', () => {
    const sabado = new Date(2026, 8, 12, 10, 0, 0)
    const { from } = faixaDeHorario('fim-de-semana', sabado)

    expect(local(from)?.getDate()).toBe(12)
  })

  it('no domingo, o fim de semana ainda é o que está acontecendo', () => {
    // `getDay()` do domingo é 0, e a conta ingênua de "6 - 0" jogaria para
    // sábado que vem — depois do domingo que a pessoa está vivendo.
    const domingo = new Date(2026, 8, 13, 10, 0, 0)
    const { from, to } = faixaDeHorario('fim-de-semana', domingo)

    expect(local(from)?.getDate()).toBe(12)
    expect(local(to)?.getDate()).toBe(13)
  })
})

describe('ehFaixa', () => {
  it('aceita as quatro e recusa o resto — a faixa vem da URL, que é do usuário', () => {
    expect(ehFaixa('hoje')).toBe(true)
    expect(ehFaixa('fim-de-semana')).toBe(true)
    expect(ehFaixa('ontem')).toBe(false)
    expect(ehFaixa('')).toBe(false)
  })
})
