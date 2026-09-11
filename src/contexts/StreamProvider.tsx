import { useCallback, useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { env } from '../config/env'
import { useAuth } from './AuthContext'
import { StreamContext } from './streamContext'
import type { OuvinteDoStream, StreamContextValue } from './streamContext'

/**
 * Uma conexão de stream por aba, fora do sino (web#472).
 *
 * O `EventSource` morava dentro do `NotificationBell`, e o sino é montado em dois
 * lugares — `MainLayout` e `DashboardLayout`. Três consequências, e esta peça
 * resolve as três:
 *
 * - **nenhuma outra tela conseguia escutar a conexão.** A conversa de suporte
 *   precisa do evento `suporte`, e abrir uma segunda conexão por conta própria é
 *   o que o épico api#570 pede para não fazer;
 * - **trocar de layout derrubava e reabria a conexão**, porque cada layout
 *   montava um sino próprio;
 * - **o que chegava durante uma queda se perdia calado.** Agora quem escuta é
 *   avisado da reconexão e relê o que importa.
 *
 * A conexão abre quando há usuário logado e fecha quando ele sai. É o `user` do
 * `AuthContext`, e não só o `temSessao()`, que decide: o logout zera o `user`, e
 * é isso que fecha a conexão sem ninguém precisar lembrar.
 */
export function StreamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id

  const ouvintes = useRef(new Map<string, Set<OuvinteDoStream>>())
  const reconexoes = useRef(new Set<() => void>())
  const conexao = useRef<EventSource | null>(null)
  /** Os eventos já ligados na conexão atual — um `addEventListener` por nome. */
  const ligados = useRef(new Set<string>())

  const ligar = useCallback((evento: string) => {
    const es = conexao.current
    if (!es || ligados.current.has(evento)) return
    ligados.current.add(evento)

    es.addEventListener(evento, (e) => {
      let dado: unknown
      try {
        dado = JSON.parse((e as MessageEvent<string>).data)
      } catch {
        return // payload malformado não derruba quem escuta
      }
      ouvintes.current.get(evento)?.forEach((ouvinte) => ouvinte(dado))
    })
  }, [])

  useEffect(() => {
    if (!userId) return

    /**
     * `withCredentials` é o que manda o cookie de sessão na conexão. O
     * `EventSource` não aceita header customizado, e token na query string
     * acaba em log de proxy, histórico e `Referer`.
     */
    const es = new EventSource(`${env.apiUrl}/notifications/stream`, { withCredentials: true })
    conexao.current = es
    ligados.current = new Set()

    // O `open` dispara na primeira abertura e a cada reconexão. Só é
    // reconexão o `open` que vem depois de um `error`.
    let caiu = false
    es.addEventListener('error', () => {
      caiu = true
    })
    es.addEventListener('open', () => {
      if (!caiu) return
      caiu = false
      reconexoes.current.forEach((ouvinte) => ouvinte())
    })

    for (const evento of ouvintes.current.keys()) ligar(evento)

    return () => {
      es.close()
      conexao.current = null
      ligados.current = new Set()
    }
  }, [userId, ligar])

  const valor = useMemo<StreamContextValue>(
    () => ({
      assinar(evento, ouvinte) {
        let doEvento = ouvintes.current.get(evento)
        if (!doEvento) {
          doEvento = new Set()
          ouvintes.current.set(evento, doEvento)
        }
        doEvento.add(ouvinte)
        ligar(evento)
        return () => {
          doEvento.delete(ouvinte)
        }
      },
      aoReconectar(ouvinte) {
        reconexoes.current.add(ouvinte)
        return () => {
          reconexoes.current.delete(ouvinte)
        }
      },
    }),
    [ligar],
  )

  return <StreamContext.Provider value={valor}>{children}</StreamContext.Provider>
}

export default StreamProvider
