import { pushApi } from '../api/pushApi'

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function registerServiceWorker(): void {
  if (!pushSupported()) return
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

/** Demande la permission (si besoin) et abonne l'appareil courant aux notifications push. */
export async function subscribeToPush(): Promise<boolean> {
  if (!pushSupported()) return false

  let permission = Notification.permission
  if (permission === 'default') permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.ready
  let sub = await registration.pushManager.getSubscription()
  if (!sub) {
    const publicKey = await pushApi.vapidPublicKey()
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
  }
  await pushApi.subscribe(sub.toJSON() as PushSubscriptionJSON)
  return true
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!pushSupported()) return
  const registration = await navigator.serviceWorker.ready
  const sub = await registration.pushManager.getSubscription()
  if (!sub) return
  await pushApi.unsubscribe(sub.endpoint).catch(() => {})
  await sub.unsubscribe()
}
