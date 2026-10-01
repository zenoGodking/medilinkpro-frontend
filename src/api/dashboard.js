import { api } from './client';

// Indicateurs des 30 derniers jours (directeur : ses etablissements ; admin : toute la plateforme).
export async function getStatistiques() {
  const { data } = await api.get('/api/dashboard/statistiques');
  return data;
}
