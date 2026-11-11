/* Sem cache de app: este worker só torna Web Push possível com a aba fechada. */
self.addEventListener('push', event => {
  const payload = event.data ? event.data.json() : {}
  const notification = payload.data || {}
  const data = { type: payload.type, ...notification }
  event.waitUntil(self.registration.showNotification(payload.title || 'Só+1', {
    body: payload.body || 'Você tem uma nova notificação.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: payload.id || payload.type,
    data,
  }))
})

function destination(data) {
  if (['MATCH_FULL', 'MATCH_CANCELLED', 'MATCH_INVITE'].includes(data.type) && data.matchId) return `/partida/${data.matchId}`
  if (data.type === 'WEATHER_ALERT') {
    if (data.atividade === 'PARTIDA' && data.matchId) return `/partida/${data.matchId}`
    if (data.atividade === 'DAY_USE' && data.dayUseId) return `/owner/day-uses/${data.dayUseId}/entradas`
    if (data.atividade === 'JOGO_DE_TORNEIO' && data.tournamentId) return `/torneios/${data.tournamentId}`
  }
  return '/'
}

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = new URL(destination(event.notification.data || {}), self.location.origin).href
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
    const existing = windows.find(client => client.url.startsWith(self.location.origin))
    return existing ? existing.focus().then(() => existing.navigate(url)) : self.clients.openWindow(url)
  }))
})
