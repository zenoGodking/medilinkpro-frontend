import { api } from './client';
import { compresserImage } from '../utils/compressionImage';

export async function getMonProfilInfirmier() {
  const { data } = await api.get('/api/infirmiers/moi');
  return data;
}

// Ajoute ou remplace la photo de profil (obligatoire pour repondre aux alertes).
export async function changerPhotoInfirmier(photo) {
  const formData = new FormData();
  formData.append('photo', await compresserImage(photo, { dimensionMax: 1000 }), 'photo.jpg');
  const { data } = await api.put('/api/infirmiers/moi/photo', formData, { headers: { 'Content-Type': undefined } });
  return data;
}

export async function demanderIntegrationInfirmier(etablissementId, message) {
  const { data } = await api.post(`/api/infirmiers/moi/demander-integration/${etablissementId}`, { message: message || null });
  return data;
}

export async function getMesDemandesInfirmier() {
  const { data } = await api.get('/api/infirmiers/moi/demandes-integration');
  return data;
}

// Profil d'une infirmiere (patients qu'elle a pris en charge, directeurs, admin).
export async function getProfilInfirmier(infirmierId) {
  const { data } = await api.get(`/api/infirmiers/${infirmierId}/profil`);
  return data;
}

// La photo est privee : on la telecharge avec le JWT puis on l'affiche via une URL blob.
export async function getPhotoInfirmier(infirmierId) {
  const { data } = await api.get(`/api/infirmiers/${infirmierId}/photo`, { responseType: 'blob' });
  return data;
}

export async function getInfirmiersEtablissement(etablissementId) {
  const { data } = await api.get(`/api/etablissements/${etablissementId}/infirmiers`);
  return data;
}
