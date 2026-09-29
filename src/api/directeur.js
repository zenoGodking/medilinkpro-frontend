import { api } from './client';

// Directeur : etablissements dont il est responsable.
export async function getMesEtablissements() {
  const { data } = await api.get('/api/directeur/etablissements');
  return data;
}

// Directeur : patients recus dans ses etablissements (identite seulement).
export async function getMesPatientsEtablissement() {
  const { data } = await api.get('/api/directeur/patients');
  return data;
}
