/**
 * O tema com o armazenamento recusado (web#359).
 *
 * ## Por que este teste existe, e por que ele é difícil de escrever por acaso
 *
 * O `ThemeContextProvider` envolve o app inteiro e lia a preferência **no
 * inicializador do `useState`** — ou seja, durante a renderização. Uma exceção
 * ali sobe antes de qualquer tela existir: o resultado não é tema errado, é
 * página em branco.
 *
 * O defeito foi achado escrevendo o teste de storage indisponível do
 * `ConviteDeLocalizacao` (#328): o stub derrubou o `ThemeContext` antes de o
 * teste chegar ao que ia medir. Aquele teste foi ajustado para aplicar o stub
 * **depois** da renderização — o que resolveu o teste e deixou o defeito de pé.
 *
 * Este aqui faz o contrário de propósito: bloqueia **antes** do primeiro render,
 * que é o único caminho que reproduz o problema.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ThemeContextProvider, useThemeMode } from './ThemeContext'

const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!

function bloqueieOAcessor() {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    },
  })
}

function Sonda() {
  const { isDark, toggleTheme } = useThemeMode()
  return (
    <button onClick={toggleTheme}>{isDark ? 'escuro' : 'claro'}</button>
  )
}

function preferePreto(prefere: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('dark') ? prefere : false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    addListener: () => {},
    removeListener: () => {},
  })) as unknown as typeof window.matchMedia
}

afterEach(() => {
  Object.defineProperty(window, 'localStorage', original)
  vi.restoreAllMocks()
})

describe('ThemeContext com o armazenamento recusado', () => {
  it('a árvore monta com o acessor lançando ANTES do primeiro render', () => {
    bloqueieOAcessor()
    preferePreto(false)

    // Sem a guarda, isto não renderiza nada: a exceção sobe do inicializador do
    // `useState` e leva o app inteiro junto.
    expect(() =>
      render(<ThemeContextProvider><Sonda /></ThemeContextProvider>),
    ).not.toThrow()

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('sem preferência gravada, cai em prefers-color-scheme', () => {
    bloqueieOAcessor()
    preferePreto(true)

    render(<ThemeContextProvider><Sonda /></ThemeContextProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('escuro')
  })

  it('o toggle continua valendo na sessão, mesmo sem conseguir persistir', async () => {
    bloqueieOAcessor()
    preferePreto(false)

    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()

    render(<ThemeContextProvider><Sonda /></ThemeContextProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('claro')

    // O estado é do React; só a memória entre visitas se perde.
    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveTextContent('escuro')
  })

  it('com storage funcionando, a preferência gravada ganha do prefers-color-scheme', () => {
    localStorage.setItem('só+1:theme', 'dark')
    preferePreto(false)

    render(<ThemeContextProvider><Sonda /></ThemeContextProvider>)
    expect(screen.getByRole('button')).toHaveTextContent('escuro')
  })
})
