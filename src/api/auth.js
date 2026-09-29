import { api } from './client';

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
  formData.append('photo', visage.photo, 'visage.jpg');
  formData.append('descripteur', new Blob([JSON.stringify(visage.descripteur)], { type: 'application/json' }));
  const { data } = await api.post('/api/auth/register', formData, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}
