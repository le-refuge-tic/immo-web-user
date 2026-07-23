// Service worker minimal — reçoit les notifications push et ouvre/focus
// l'app au clic, même si l'onglet ou le navigateur est fermé.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = { title: 'REFUGE', body: 'Vous avez une nouvelle notification.', data: {} }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/REFUGE-LOGO.png',
      badge: '/REFUGE-LOGO.png',
      data: payload.data || {},
      tag: payload.data?.visite_id ? `visite-${payload.data.visite_id}` : undefined,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const type = event.notification.data?.type
  let path = '/notifications'
  if (type === 'NOUVELLE_VISITE' || type === 'visite_demande' || type === 'visite_confirmee' ||
      type === 'visite_contre_proposee' || type === 'visite_annulee') {
    path = '/mes-visites'
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if ('focus' in client) {
          client.navigate(path)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(path)
    })
  )
})
