import { api } from './client';

export async function getAllPatients() {
  const { data } = await api.get('/api/patients');
  return data;
}

export async function getDossierMedicalByPatient(patientId) {
  const { data } = await api.get(`/api/dossiers-medicaux/patient/${patientId}`);
  return data;
}

export async function getPatient(patientId) {
  const { data } = await api.get(`/api/patients/${patientId}`);
  return data;
}

export async function updatePatient(patientId, payload) {
  const { data } = await api.put(`/api/patients/${patientId}`, payload);
  return data;
}

export async function getConsultationsByPatient(patientId) {
  const { data } = await api.get(`/api/consultations/patient/${patientId}`);
  return data;
}

export async function getOrdonnancesByPatient(patientId) {
  const { data } = await api.get(`/api/ordonnances/patient/${patientId}`);
  return data;
}

export async function getResultatsAnalyses(dossierId) {
  const { data } = await api.get(`/api/resultats-analyses/dossier/${dossierId}`);
  return data;
}

// Medecin : declarer le deces d'un patient (le proche est informe).
export async function declarerDeces(patientId, { dateDeces, circonstances }) {
  const { data } = await api.post(`/api/patients/${patientId}/deces`, { dateDeces, circonstances });
  return data;
}
