import { describe, expect, it } from 'vitest'
import { formatarReais, valorPorPessoa } from './formatCurrency'
import { contagem } from './plural'

// O Intl separa "R$" do número com espaço não quebrável; a comparação normaliza.
const texto = (s: string) => s.replace(/\u00a0/g, ' ')

describe('formatarReais (web#491)', () => {
  it('vírgula e duas casas, também para o Decimal que chega como string', () => {
    expect(texto(formatarReais(20))).toBe('R$ 20,00')
    expect(texto(formatarReais('22.5'))).toBe('R$ 22,50')
    expect(texto(formatarReais(1200))).toBe('R$ 1.200,00')
  })

  it('valor que não é número vira zero, e não NaN', () => {
    expect(texto(formatarReais(undefined))).toBe('R$ 0,00')
    expect(texto(formatarReais('abc'))).toBe('R$ 0,00')
  })

  it('o valor por pessoa não arredonda para cima', () => {
    expect(texto(valorPorPessoa('90', 4))).toBe('R$ 22,50')
    expect(texto(valorPorPessoa(100, 0))).toBe('R$ 0,00')
  })
})

describe('contagem (web#491)', () => {
  it('singular só no um', () => {
    expect(contagem(1, 'vaga', 'vagas')).toBe('1 vaga')
    expect(contagem(0, 'vaga', 'vagas')).toBe('0 vagas')
    expect(contagem(3, 'vaga restante', 'vagas restantes')).toBe('3 vagas restantes')
  })
})
