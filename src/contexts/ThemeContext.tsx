import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { guarde, leia } from '../utils/armazenamento'

const STORAGE_KEY = 'só+1:theme'

export interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ isDark: false, toggleTheme: () => {} })

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  /*
   * Este inicializador roda DURANTE a renderização do provider que envolve o
   * app inteiro. Uma exceção aqui sobe antes de qualquer tela existir, e o
   * resultado é página em branco — não um tema errado (web#359).
   *
   * Sem preferência gravada, `prefers-color-scheme` é o padrão sensato, e ele
   * já estava logo abaixo da linha que quebrava.
   */
  const [isDark, setIsDark] = useState<boolean>(() => {
    const stored = leia(STORAGE_KEY)
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  /* Não conseguir gravar não impede o tema de valer na sessão: o estado é do
     React, e só a memória entre visitas se perde. */
  useEffect(() => {
    guarde(STORAGE_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => setIsDark(v => !v)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useThemeMode(): ThemeContextValue {
  return useContext(ThemeContext)
}
