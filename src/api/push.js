import { api } from './client';

export async function getClePubliquePush() {
  const { data } = await api.get('/api/push/cle-publique');
  return data.clePublique;
}

export async function enregistrerAbonnementPush(abonnement) {
  await api.post('/api/push/abonnements', abonnement);
}

export async function supprimerAbonnementPush(endpoint) {
  await api.delete('/api/push/abonnements', { params: { endpoint } });
}
