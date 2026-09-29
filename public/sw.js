/*
 * Service worker MediLinkPro : affiche les notifications push (alertes de soins a domicile,
 * rappels de medicaments...) meme application fermee, et ouvre la bonne page au clic.
 * Aucun cache de l'application : chaque ouverture charge la version en ligne a jour.
 */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { corps: event.data ? event.data.text() : '' };
  }
  event.waitUntil(self.registration.showNotification(message.titre || 'MediLinkPro', {
    body: message.corps || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: message.tag || undefined,
    renotify: Boolean(message.tag),
    data: { url: message.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const cible = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil((async () => {
    const fenetres = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existante = fenetres.find((c) => c.url.startsWith(self.location.origin));
    if (existante) {
      await existante.focus();
      return existante.navigate(cible);
    }
    return self.clients.openWindow(cible);
  })());
});
