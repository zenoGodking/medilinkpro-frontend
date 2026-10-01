import { api } from './client';

export async function getAllRendezVous() {
  const { data } = await api.get('/api/rendez-vous');
  return data;
}

export async function getRendezVousByPatient(patientId) {
  const { data } = await api.get(`/api/rendez-vous/patient/${patientId}`);
  return data;
}

export async function getRendezVousByMedecin(medecinId) {
  const { data } = await api.get(`/api/rendez-vous/medecin/${medecinId}`);
  return data;
}

export async function createRendezVous(payload) {
  const { data } = await api.post('/api/rendez-vous', payload);
  return data;
}

export async function updateStatutRendezVous(id, statut) {
  const { data } = await api.patch(`/api/rendez-vous/${id}/statut`, { statut });
  return data;
}

export async function deleteRendezVous(id) {
  await api.delete(`/api/rendez-vous/${id}`);
}

// Medecin : decisions sur une demande de rendez-vous (le patient est notifie).
export async function accepterRendezVous(id) {
  const { data } = await api.patch(`/api/rendez-vous/${id}/accepter`);
  return data;
}

export async function refuserRendezVous(id, motif) {
  const { data } = await api.patch(`/api/rendez-vous/${id}/refuser`, { motif: motif || null });
  return data;
}

export async function reporterRendezVous(id, nouvelleDateHeure, motif) {
  const { data } = await api.patch(`/api/rendez-vous/${id}/reporter`, { nouvelleDateHeure, motif: motif || null });
  return data;
}

// Patient : avis sur le medecin apres le rendez-vous.
export async function donnerAvis(id, { note, commentaire }) {
  const { data } = await api.post(`/api/rendez-vous/${id}/avis`, { note, commentaire: commentaire || null });
  return data;
}

export async function getAvisMedecin(medecinId) {
  const { data } = await api.get(`/api/rendez-vous/avis/medecins/${medecinId}`);
  return data;
}
