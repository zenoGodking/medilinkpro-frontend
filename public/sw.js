/*
 * Service worker MediLinkPro :
 * 1. Notifications push (alertes, rappels de rendez-vous et de medicaments...), application fermee.
 * 2. Mode reseau faible :
 *    - l'application (HTML, JS, CSS, icones) est mise en cache : elle s'ouvre meme avec un reseau tres lent ;
 *      la page est toujours redemandee en ligne d'abord, les fichiers versionnes (/assets/) servis du cache ;
 *    - les lectures de l'API (GET) passent par le reseau, avec une copie de secours servie si le serveur
 *      ne repond pas a temps. Cette copie est rangee par session (empreinte du jeton) : un autre
 *      utilisateur du meme appareil n'y a jamais acces, et elle est effacee a la deconnexion.
 */
const VERSION = 'v2';
const CACHE_APP = `medilinkpro-app-${VERSION}`;
const CACHE_API = 'medilinkpro-api';
const DELAI_RESEAU_MS = 8000;
const DUREE_COPIE_MS = 24 * 3600 * 1000;
const ENTETE_COPIE = 'X-Medilinkpro-Copie-Locale';
const API_EXCLUES = ['/api/auth/', '/api/notifications', '/api/teleconsultations/'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_APP)
    .then((c) => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png']))
    .catch(() => {})
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const noms = await caches.keys();
    await Promise.all(noms.filter((n) => n.startsWith('medilinkpro-app-') && n !== CACHE_APP).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'vider-copie-api') {
    event.waitUntil(caches.delete(CACHE_API));
  }
});

self.addEventListener('fetch', (event) => {
  const requete = event.request;
  if (requete.method !== 'GET') return;
  const url = new URL(requete.url);

  if (url.pathname.startsWith('/api/')) {
    if (!requete.headers.get('Authorization') || API_EXCLUES.some((p) => url.pathname.startsWith(p))
        || /\/(pages\/\d+|photo)$/.test(url.pathname)) return;
    event.respondWith(reseauPuisCopie(requete));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (requete.mode === 'navigate') {
    // Page : en ligne d'abord (derniere version), sinon l'application en cache
    event.respondWith(fetch(requete).then((r) => {
      const copie = r.clone();
      caches.open(CACHE_APP).then((c) => c.put('/', copie));
      return r;
    }).catch(() => caches.match('/')));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/models/')) {
    // Fichiers versionnes ou statiques : cache d'abord
    event.respondWith(caches.match(requete).then((enCache) => enCache || fetch(requete).then((r) => {
      if (r.ok) {
        const copie = r.clone();
        caches.open(CACHE_APP).then((c) => c.put(requete, copie));
      }
      return r;
    })));
  }
});

let dernierePurge = 0;
async function purgerCopiesAnciennes(cache) {
  if (Date.now() - dernierePurge < 3600 * 1000) return;
  dernierePurge = Date.now();
  for (const requete of await cache.keys()) {
    const r = await cache.match(requete);
    const date = r?.headers.get('X-Medilinkpro-Date-Copie');
    if (!date || Date.now() - new Date(date).getTime() > DUREE_COPIE_MS) await cache.delete(requete);
  }
}

async function cleSession(requete) {
  const jeton = requete.headers.get('Authorization') || '';
  const empreinte = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(jeton));
  const hex = Array.from(new Uint8Array(empreinte)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${requete.url}#${hex}`;
}

async function reseauPuisCopie(requete) {
  const cle = await cleSession(requete);
  const cache = await caches.open(CACHE_API);
  try {
    const reponse = await Promise.race([
      fetch(requete),
      new Promise((_, rejeter) => setTimeout(() => rejeter(new Error('delai')), DELAI_RESEAU_MS)),
    ]);
    if (reponse.ok) {
      const corps = await reponse.clone().blob();
      const entetes = new Headers(reponse.headers);
      entetes.set('X-Medilinkpro-Date-Copie', new Date().toISOString());
      await cache.put(cle, new Response(corps, { status: 200, headers: entetes }));
      purgerCopiesAnciennes(cache);
    }
    return reponse;
  } catch {
    const copie = await cache.match(cle);
    if (copie) {
      const date = copie.headers.get('X-Medilinkpro-Date-Copie');
      if (date && Date.now() - new Date(date).getTime() < DUREE_COPIE_MS) {
        const entetes = new Headers(copie.headers);
        entetes.set(ENTETE_COPIE, date);
        return new Response(await copie.blob(), { status: 200, headers: entetes });
      }
    }
    // Pas de copie : on laisse la requete aboutir (ou echouer) normalement
    return fetch(requete);
  }
}

self.addEventListener('push', (event) => {
  let message;
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
