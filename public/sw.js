// Service worker — push notifications + cache offline pour assets statiques.

const CACHE_NAME = 'refuge-static-v1'

// Assets du shell applicatif à précacher au premier chargement
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Stratégie réseau en premier, cache en repli pour les navigations HTML
// et stale-while-revalidate pour les assets JS/CSS/images
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // Ne pas intercepter les appels API
  if (url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    // Navigation : réseau en premier, index.html en repli offline
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/index.html').then(r => r || fetch(request))
      )
    )
  } else {
    // Assets statiques : stale-while-revalidate
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          const network = fetch(request).then(response => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          return cached || network
        })
      )
    )
  }
})

self.addEventListener('push', (event) => {
  let payload = { title: 'REFUGE', body: 'Vous avez une nouvelle notification.', data: {} }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch (_) {}

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/admin-notif-icon.png',
      badge: '/admin-notif-icon.png',
      data: payload.data || {},
      tag: payload.data?.visite_id ? `visite-${payload.data.visite_id}` : undefined,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const data = event.notification.data || {}
  const type = data.type
  let path = '/notifications'
  if (type === 'NOUVELLE_VISITE' || type === 'visite_demande' || type === 'visite_confirmee' ||
      type === 'visite_contre_proposee' || type === 'visite_annulee') {
    path = '/mes-visites'
  } else if (type === 'nouveau_message' || type === 'NOUVEAU_MESSAGE') {
    // Même route que le clic sur une alerte "nouveau message" dans
    // NotificationsPage — ouvre directement le fil concerné.
    path = data.conversation_id ? `/conversations/${data.conversation_id}` : '/conversations'
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
