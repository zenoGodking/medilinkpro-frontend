import { api } from './client';

// Semaine type + absences a venir d'un medecin (heures ouvrables par defaut si non definies).
export async function getDisponibilites(medecinId) {
  const { data } = await api.get(`/api/disponibilites/medecins/${medecinId}`);
  return data;
}

// Creneaux reservables entre deux dates (YYYY-MM-DD, 31 jours max), avec leur etat libre/pris.
export async function getCreneaux(medecinId, du, au) {
  const { data } = await api.get(`/api/disponibilites/medecins/${medecinId}/creneaux`, { params: { du, au } });
  return data;
}

// Medecin : remplace sa semaine type.
export async function definirSemaine(plages) {
  const { data } = await api.put('/api/disponibilites/moi', { plages });
  return data;
}

export async function ajouterAbsence(payload) {
  const { data } = await api.post('/api/disponibilites/moi/absences', payload);
  return data;
}

export async function supprimerAbsence(absenceId) {
  await api.delete(`/api/disponibilites/moi/absences/${absenceId}`);
}
