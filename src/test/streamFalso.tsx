import type { ReactNode } from 'react'
import { act } from '@testing-library/react'
import { StreamContext } from '../contexts/streamContext'
import type { OuvinteDoStream, StreamContextValue } from '../contexts/streamContext'

/**
 * Um stream de mentira para testar quem o consome (web#472).
 *
 * O `StreamProvider` de verdade tem teste próprio, com `EventSource` falso. Quem
 * só escuta — a tela de suporte, o sino — é testado com isto: emite o evento que
 * quiser, e simula a reconexão, sem conexão nenhuma.
 */
export function criaStreamFalso() {
  const ouvintes = new Map<string, Set<OuvinteDoStream>>()
  const reconexoes = new Set<() => void>()

  const valor: StreamContextValue = {
    assinar(evento, ouvinte) {
      if (!ouvintes.has(evento)) ouvintes.set(evento, new Set())
      ouvintes.get(evento)!.add(ouvinte)
      return () => {
        ouvintes.get(evento)?.delete(ouvinte)
      }
    },
    aoReconectar(ouvinte) {
      reconexoes.add(ouvinte)
      return () => {
        reconexoes.delete(ouvinte)
      }
    },
  }

  return {
    Provider: ({ children }: { children: ReactNode }) => (
      <StreamContext.Provider value={valor}>{children}</StreamContext.Provider>
    ),
    emitir(evento: string, dado: unknown) {
      act(() => ouvintes.get(evento)?.forEach(ouvinte => ouvinte(dado)))
    },
    reconectar() {
      act(() => reconexoes.forEach(ouvinte => ouvinte()))
    },
    /** Quantos ouvintes o evento tem agora — prova que desmontar cancela. */
    ouvintesDe: (evento: string) => ouvintes.get(evento)?.size ?? 0,
  }
}
