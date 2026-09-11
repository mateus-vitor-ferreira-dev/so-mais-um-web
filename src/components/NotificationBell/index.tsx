import { useState, useEffect, useRef, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationService } from '../../services/notificationService'
import { useAuth } from '../../contexts/AuthContext'
import { useEventoDoStream, useReconexaoDoStream } from '../../hooks/useEventoDoStream'
import { destinoDaNotificacao } from '../../utils/destinoDaNotificacao'
import type { Notification } from '../../types/api'
import {
  Wrapper, BellBtn, Badge, Dropdown, DropHeader, DropTitle,
  MarkAllBtn, NotifList, NotifItem, NotifDot, NotifText,
  NotifTime, EmptyMsg,
} from './styles'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function NotificationBell() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [open, setOpen]     = useState(false)
  const ref                 = useRef<HTMLDivElement>(null)
  const navigate            = useNavigate()
  const { user }            = useAuth()

  const load = useCallback(async () => {
    try {
      const data = await notificationService.list()
      setNotifs(data)
    } catch {
      // não crítico
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /**
   * A conexão não mora mais aqui (web#472): ela é do `StreamProvider`, uma por
   * aba, e o sino é só um dos consumidores. Ele lê o evento **sem nome** — o das
   * notificações; os nomeados, como o `suporte`, nem chegam aqui.
   *
   * O `some` é o que torna a reconexão inofensiva: a notificação que chega pelo
   * stream pode já ter vindo na releitura.
   */
  useEventoDoStream<Notification>('message', (notification) => {
    setNotifs(prev => (prev.some(n => n.id === notification.id) ? prev : [notification, ...prev]))
  })

  // O que chegou durante a queda se perdeu: o banco é a verdade.
  useReconexaoDoStream(() => void load())

  useEffect(() => {
    function handleClick(e: globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleMarkAll() {
    await notificationService.readAll()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  /**
   * Marca como lida e, quando o tipo leva a algum lugar, vai para lá.
   *
   * A marcação não espera a api: navegar só depois dela faria o clique parecer
   * travado, e uma falha ali não justifica deixar a pessoa onde estava.
   */
  function handleRead(notificacao: Notification) {
    void notificationService.readOne(notificacao.id).catch(() => {})
    setNotifs(prev => prev.map(n => n.id === notificacao.id ? { ...n, read: true } : n))

    const destino = destinoDaNotificacao(notificacao, user?.role)
    if (destino) {
      setOpen(false)
      navigate(destino)
    }
  }

  const unread = notifs.filter(n => !n.read).length

  return (
    <Wrapper ref={ref}>
      <BellBtn onClick={() => setOpen(o => !o)} aria-label="Notificações">
        <Bell size={20} />
        {unread > 0 && <Badge>{unread > 9 ? '9+' : unread}</Badge>}
      </BellBtn>

      {open && (
        <Dropdown>
          <DropHeader>
            <DropTitle>Notificações</DropTitle>
            {unread > 0 && (
              <MarkAllBtn onClick={handleMarkAll}>Marcar todas como lidas</MarkAllBtn>
            )}
          </DropHeader>
          <NotifList>
            {notifs.length === 0 ? (
              <EmptyMsg>Nenhuma notificação</EmptyMsg>
            ) : (
              notifs.slice(0, 10).map(n => (
                <NotifItem key={n.id} $read={n.read} onClick={() => handleRead(n)}>
                  {!n.read && <NotifDot />}
                  <div style={{ flex: 1 }}>
                    {/*
                      * Era `n.title || n.message`: `message` não existe no
                      * payload da API (os campos são `title` e `body`), então o
                      * fallback nunca resolvia para nada. Como `title` é sempre
                      * preenchido, o efeito era nenhum — mas o campo era resquício
                      * de um formato antigo.
                      */}
                    <NotifText>{n.title}</NotifText>
                    <NotifTime>{timeAgo(n.createdAt)}</NotifTime>
                  </div>
                </NotifItem>
              ))
            )}
          </NotifList>
        </Dropdown>
      )}
    </Wrapper>
  )
}
