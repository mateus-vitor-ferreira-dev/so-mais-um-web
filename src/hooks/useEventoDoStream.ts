import { useContext, useEffect, useRef } from 'react'
import { StreamContext } from '../contexts/streamContext'

/**
 * Escuta um evento do stream pelo nome (web#472). `'message'` é o evento sem
 * nome, o das notificações.
 *
 * O `ouvinte` pode mudar a cada render sem reassinar: a assinatura guarda a
 * versão mais recente numa ref. Sem isso, cada render do componente cancelaria
 * e refaria a assinatura — e um evento chegando no meio se perderia.
 *
 * Fora de um `StreamProvider` não faz nada, de propósito: a tela funciona sem
 * tempo real, e o teste de um componente que não liga para o stream não precisa
 * montá-lo.
 */
export function useEventoDoStream<T>(evento: string, ouvinte: (dado: T) => void) {
  const stream = useContext(StreamContext)
  const atual = useRef(ouvinte)

  useEffect(() => {
    atual.current = ouvinte
  })

  useEffect(() => {
    if (!stream) return
    return stream.assinar(evento, (dado) => atual.current(dado as T))
  }, [stream, evento])
}

/**
 * Chamado quando a conexão volta depois de cair — nunca na primeira abertura.
 * É a deixa para reler do banco o que pode ter chegado durante a queda.
 */
export function useReconexaoDoStream(ouvinte: () => void) {
  const stream = useContext(StreamContext)
  const atual = useRef(ouvinte)

  useEffect(() => {
    atual.current = ouvinte
  })

  useEffect(() => {
    if (!stream) return
    return stream.aoReconectar(() => atual.current())
  }, [stream])
}
