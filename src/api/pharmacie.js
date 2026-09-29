import { api } from './client';

// Patient : QR code d'une ordonnance a presenter en pharmacie.
export async function getQrOrdonnance(ordonnanceId) {
  const { data } = await api.get(`/api/pharmacie/ordonnances/${ordonnanceId}/qr`);
  return data;
}

export async function verifierOrdonnance(jeton) {
  const { data } = await api.get(`/api/pharmacie/verifier/${encodeURIComponent(jeton)}`);
  return data;
}

export async function delivrerOrdonnance(jeton) {
  const { data } = await api.post(`/api/pharmacie/delivrer/${encodeURIComponent(jeton)}`);
  return data;
}

export async function getMesDelivrances() {
  const { data } = await api.get('/api/pharmacie/mes-delivrances');
  return data;
}

/** Lien encode dans le QR code de l'ordonnance. */
export function lienOrdonnance(jeton) {
  return `${window.location.origin}/pharmacie/ordonnance/${jeton}`;
}

/** Extrait le jeton d'un QR scanne (lien complet) ; renvoie null si ce n'est pas une ordonnance MediLinkPro. */
export function jetonDepuisQr(texte) {
  const m = /\/pharmacie\/ordonnance\/([A-Za-z0-9_-]{16,})/.exec(texte || '');
  return m ? m[1] : null;
}
