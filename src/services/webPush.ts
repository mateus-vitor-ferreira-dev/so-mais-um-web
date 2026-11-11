import { notificationService } from './notificationService'

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(value: string) {
  const padded = value.padEnd(value.length + (4 - value.length % 4) % 4, '=')
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

/** Pede permissão somente depois de um clique explícito na interface. */
export async function enableWebPush(): Promise<'enabled' | 'denied' | 'unavailable'> {
  if (!vapidPublicKey || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unavailable'
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })
  await notificationService.subscribePush({ ...subscription.toJSON(), userAgent: navigator.userAgent })
  await notificationService.setPushPreference(true)
  return 'enabled'
}
