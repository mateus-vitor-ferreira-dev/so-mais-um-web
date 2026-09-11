import { describe, it, expect } from 'vitest'
import { telaDeOrigem } from './suporte'

describe('telaDeOrigem (web#472)', () => {
  it('aceita o caminho de uma tela do app', () => {
    expect(telaDeOrigem('/owner/inventory')).toBe('/owner/inventory')
    expect(telaDeOrigem('/owner/places/abc123/courts')).toBe('/owner/places/abc123/courts')
  })

  // A api recusaria com 422, e o dono perderia o que escreveu por um campo de
  // contexto. O que ela recusaria nem vai.
  it('descarta o que a api recusaria', () => {
    expect(telaDeOrigem('https://app.so-mais-um.com/owner')).toBeUndefined()
    expect(telaDeOrigem('/owner/inventory?aba=1')).toBeUndefined()
    expect(telaDeOrigem(`/${'a'.repeat(200)}`)).toBeUndefined()
  })

  it('descarta a própria tela de suporte, e o que não é texto', () => {
    expect(telaDeOrigem('/owner/suporte')).toBeUndefined()
    expect(telaDeOrigem(undefined)).toBeUndefined()
    expect(telaDeOrigem(42)).toBeUndefined()
  })
})
