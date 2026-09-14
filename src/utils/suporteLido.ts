import { useEffect, useRef } from 'react'

/**
 * "Esta conversa de suporte foi lida", dito dentro da aba (web#473).
 *
 * Marcar como lida apaga no servidor o aviso `SUPPORT_MESSAGE` do sino, mas o
 * sino desta aba só descobriria na próxima leitura da lista. A tela avisa por
 * aqui, e o sino apaga na hora — "abrir a conversa faz a notificação sumir".
 *
 * Evento de `window`, e não o stream: é notícia desta aba para ela mesma, e
 * passar pelo servidor seria uma volta para dizer o que já se sabe aqui.
 */
const EVENTO = 'so-mais-um:suporte-lido'

/** Sem `conversaId`, vale para toda conversa — o dono tem uma só. */
export function avisarSuporteLido(conversaId?: string) {
  window.dispatchEvent(new CustomEvent(EVENTO, { detail: { conversaId } }))
}

export function useSuporteLido(ouvinte: (conversaId?: string) => void) {
  const atual = useRef(ouvinte)
  useEffect(() => {
    atual.current = ouvinte
  })

  useEffect(() => {
    function aoLer(evento: Event) {
      atual.current((evento as CustomEvent<{ conversaId?: string }>).detail?.conversaId)
    }
    window.addEventListener(EVENTO, aoLer)
    return () => window.removeEventListener(EVENTO, aoLer)
  }, [])
}
