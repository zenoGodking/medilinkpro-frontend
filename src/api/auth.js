import { api } from './client';
import { compresserImage } from '../utils/compressionImage';

export async function login({ email, motDePasse }) {
  const { data } = await api.post('/api/auth/login', { email, motDePasse });
  return data;
}

/**
 * Inscription. Pour un patient, visage = { photo: Blob, descripteur: number[] } est obligatoire :
 * la requete part alors en multipart (donnees JSON + photo + empreinte faciale).
 */
export async function register(payload, visage) {
  if (!visage) {
    const { data } = await api.post('/api/auth/register', payload);
    return data;
  }
  const formData = new FormData();
  formData.append('donnees', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
  formData.append('photo', await compresserImage(visage.photo, { dimensionMax: 1000 }), 'visage.jpg');
  if (visage.descripteur) {
    formData.append('descripteur', new Blob([JSON.stringify(visage.descripteur)], { type: 'application/json' }));
  }
  const { data } = await api.post('/api/auth/register', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

// Mot de passe oublie : un code a 6 chiffres est envoye par SMS au numero du compte.
export async function demanderCodeReinitialisation(email) {
  const { data } = await api.post('/api/auth/mot-de-passe-oublie', { email });
  return data;
}

export async function reinitialiserMotDePasse({ email, code, nouveauMotDePasse }) {
  const { data } = await api.post('/api/auth/reinitialiser-mot-de-passe', { email, code, nouveauMotDePasse });
  return data;
}
