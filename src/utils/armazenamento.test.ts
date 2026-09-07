/**
 * `localStorage` que não derruba a tela (web#359).
 *
 * O teste que importa é o do **acessor** lançando, e não o do método: quando o
 * navegador bloqueia dados de site, quem estoura é `window.localStorage` em si,
 * antes de chegar a `getItem`. Um stub que só faz `getItem` lançar testa o caso
 * fácil e deixa passar o que derrubava o app.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { esqueca, guarde, leia } from './armazenamento'

const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!

function bloqueieOAcessor() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    },
  })
}

function facaOMetodoLancar(metodo: 'getItem' | 'setItem' | 'removeItem') {
  vi.spyOn(Storage.prototype, metodo).mockImplementation(() => {
    throw new DOMException('quota', 'QuotaExceededError')
  })
}

afterEach(() => {
  Object.defineProperty(window, 'localStorage', original)
  vi.restoreAllMocks()
})

describe('armazenamento', () => {
  it('lê e grava quando o storage funciona', () => {
    guarde('teste:chave', 'valor')
    expect(leia('teste:chave')).toBe('valor')

    esqueca('teste:chave')
    expect(leia('teste:chave')).toBeNull()
  })

  describe('com o ACESSOR bloqueado — o caso que derrubava o app', () => {
    it('leia devolve null em vez de estourar', () => {
      bloqueieOAcessor()
      expect(() => leia('teste:chave')).not.toThrow()
      expect(leia('teste:chave')).toBeNull()
    })

    it('guarde e esqueca não estouram', () => {
      bloqueieOAcessor()
      expect(() => guarde('teste:chave', 'x')).not.toThrow()
      expect(() => esqueca('teste:chave')).not.toThrow()
    })
  })

  describe('com o MÉTODO lançando — storage cheio', () => {
    it('leia devolve null', () => {
      facaOMetodoLancar('getItem')
      expect(leia('teste:chave')).toBeNull()
    })

    it('guarde engole a falha', () => {
      facaOMetodoLancar('setItem')
      expect(() => guarde('teste:chave', 'x')).not.toThrow()
    })

    it('esqueca engole a falha', () => {
      facaOMetodoLancar('removeItem')
      expect(() => esqueca('teste:chave')).not.toThrow()
    })
  })

  it('NÃO guarda em memória o que não conseguiu gravar', () => {
    facaOMetodoLancar('setItem')
    guarde('teste:chave', 'valor')

    vi.restoreAllMocks()

    // Um cache aqui enganaria: a pessoa acharia que a preferência ficou, e ela
    // sumiria ao recarregar. Melhor não lembrar do que mentir sobre lembrar.
    expect(leia('teste:chave')).toBeNull()
  })
})
