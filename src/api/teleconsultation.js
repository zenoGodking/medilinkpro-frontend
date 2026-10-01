import { api } from './client';

export async function getTeleconsultation(rendezVousId) {
  const { data } = await api.get(`/api/teleconsultations/${rendezVousId}`);
  return data;
}

// Medecin : compte rendu + ordonnance facultative ; cloture le rendez-vous et notifie le patient.
export async function cloturerTeleconsultation(rendezVousId, payload) {
  const { data } = await api.post(`/api/teleconsultations/${rendezVousId}/cloture`, payload);
  return data;
}
