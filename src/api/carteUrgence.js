import { api } from './client';

export async function getMaCarteUrgence() {
  const { data } = await api.get('/api/carte-urgence/moi');
  return data.jeton;
}

export async function regenererCarteUrgence() {
  const { data } = await api.post('/api/carte-urgence/moi/regenerer');
  return data.jeton;
}

export async function scannerCarteUrgence(jeton) {
  const { data } = await api.get(`/api/carte-urgence/${encodeURIComponent(jeton)}`);
  return data;
}

/** Lien encode dans le QR code : ouvre la carte dans MediLinkPro (connexion requise). */
export function lienCarteUrgence(jeton) {
  return `${window.location.origin}/urgence/carte/${jeton}`;
}
