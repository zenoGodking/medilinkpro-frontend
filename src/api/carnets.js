import { api } from './client';

// Carnet complet (le patient lui-meme, tout medecin, admin) + droits d'ecriture du medecin connecte.
export async function getCarnet(patientId) {
  const { data } = await api.get(`/api/carnets/${patientId}`);
  return data;
}

// Medecin : patients dans le carnet desquels il peut ecrire (autorisation ou ancien patient).
export async function getPatientsEcritureAutorisee() {
  const { data } = await api.get('/api/carnets/ecriture-autorisee');
  return data;
}

// Patient : medecins autorises a ecrire dans son carnet.
export async function getMesAutorisations() {
  const { data } = await api.get('/api/carnets/autorisations');
  return data;
}

export async function autoriserMedecin(medecinId) {
  const { data } = await api.post('/api/carnets/autorisations', { medecinId });
  return data;
}

export async function revoquerMedecin(medecinId) {
  await api.delete(`/api/carnets/autorisations/${medecinId}`);
}

// Patient : qui a consulte ou modifie son carnet.
export async function getJournalAcces() {
  const { data } = await api.get('/api/carnets/journal');
  return data;
}
