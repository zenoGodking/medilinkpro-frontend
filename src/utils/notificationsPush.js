import { getClePubliquePush, enregistrerAbonnementPush, supprimerAbonnementPush } from '../api/push';

function versUint8Array(base64url) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

/** 'non-supporte' | 'refuse' | 'actif' | 'inactif' */
export async function etatNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'non-supporte';
  if (Notification.permission === 'denied') return 'refuse';
  const enregistrement = await navigator.serviceWorker.getRegistration();
  const abonnement = await enregistrement?.pushManager.getSubscription();
  return abonnement && Notification.permission === 'granted' ? 'actif' : 'inactif';
}

/** Demande l'autorisation, abonne l'appareil et l'enregistre pour l'utilisateur connecte. */
export async function activerNotifications() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'refuse' : 'inactif';
  const enregistrement = await navigator.serviceWorker.ready;
  let abonnement = await enregistrement.pushManager.getSubscription();
  if (!abonnement) {
    abonnement = await enregistrement.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: versUint8Array(await getClePubliquePush()),
    });
  }
  await enregistrerAbonnementPush(abonnement.toJSON());
  return 'actif';
}

export async function desactiverNotifications() {
  const enregistrement = await navigator.serviceWorker.getRegistration();
  const abonnement = await enregistrement?.pushManager.getSubscription();
  if (abonnement) {
    await supprimerAbonnementPush(abonnement.endpoint).catch(() => {});
    await abonnement.unsubscribe();
  }
  return 'inactif';
}
