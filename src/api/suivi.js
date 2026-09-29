import { api } from './client';

const base = (patientId) => `/api/suivi/patients/${patientId}`;
const get = async (url) => (await api.get(url)).data;
const post = async (url, body) => (await api.post(url, body)).data;
const patch = async (url, body) => (await api.patch(url, body)).data;

export const getMesures = (patientId) => get(`${base(patientId)}/mesures`);
export const ajouterMesure = (patientId, mesure) => post(`${base(patientId)}/mesures`, mesure);
export const supprimerMesure = (id) => api.delete(`/api/suivi/mesures/${id}`);

export const getRappels = (patientId) => get(`${base(patientId)}/rappels`);
export const ajouterRappel = (patientId, rappel) => post(`${base(patientId)}/rappels`, rappel);
export const basculerRappel = (id) => patch(`/api/suivi/rappels/${id}/basculer`);
export const supprimerRappel = (id) => api.delete(`/api/suivi/rappels/${id}`);

export const getVaccinations = (patientId) => get(`${base(patientId)}/vaccinations`);
export const ajouterVaccination = (patientId, vaccin) => post(`${base(patientId)}/vaccinations`, vaccin);
export const validerVaccination = (id) => patch(`/api/suivi/vaccinations/${id}/valider`);
export const supprimerVaccination = (id) => api.delete(`/api/suivi/vaccinations/${id}`);

export const getGrossesses = (patientId) => get(`${base(patientId)}/grossesses`);
export const declarerGrossesse = (patientId, dateDernieresRegles) => post(`${base(patientId)}/grossesses`, { dateDernieresRegles });
export const terminerGrossesse = (id, fin) => patch(`/api/suivi/grossesses/${id}/terminer`, fin);
export const ajouterVisitePrenatale = (id, visite) => post(`/api/suivi/grossesses/${id}/visites`, visite);
