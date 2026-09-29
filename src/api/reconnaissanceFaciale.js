import { api } from './client';

export async function rechercherParVisage(descripteur) {
  const { data } = await api.post('/api/reconnaissance-faciale/recherche', { descripteur });
  return data;
}

export async function getCarnetUrgence(patientId) {
  const { data } = await api.get(`/api/reconnaissance-faciale/patients/${patientId}/carnet`);
  return data;
}

export async function getMaPhotoFaciale() {
  const response = await api.get('/api/reconnaissance-faciale/moi/photo');
  return response.status === 204 ? null : response.data.photo;
}

export async function enregistrerMaPhotoFaciale({ photo, descripteur }) {
  const formData = new FormData();
  formData.append('photo', photo, 'visage.jpg');
  formData.append('descripteur', new Blob([JSON.stringify(descripteur)], { type: 'application/json' }));
  await api.put('/api/reconnaissance-faciale/moi/photo', formData, {
    headers: { 'Content-Type': undefined },
  });
}
