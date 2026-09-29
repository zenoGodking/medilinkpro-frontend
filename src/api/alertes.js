import { api } from './client';

// Patient : envoyer une alerte de soins a domicile. Avec latitude/longitude, elle est proposee
// d'abord aux infirmieres les plus proches ; sans position, a toutes les infirmieres connectees.
export async function creerAlerte(patientId, payload) {
  const { data } = await api.post(`/api/alertes/patients/${patientId}`, payload);
  return data;
}

// Patient : historique de ses propres alertes.
export async function getMesAlertes(patientId) {
  const { data } = await api.get(`/api/alertes/patients/${patientId}`);
  return data;
}

// Patient : annuler une alerte tant qu'aucune infirmiere n'a repondu.
export async function annulerAlerte(alerteId, patientId) {
  const { data } = await api.patch(`/api/alertes/${alerteId}/annuler`, null, { params: { patientId } });
  return data;
}

// Patient : noter l'infirmiere a la fin du service rendu -> cloture l'alerte.
export async function noterAlerte(alerteId, patientId, payload) {
  const { data } = await api.patch(`/api/alertes/${alerteId}/noter`, payload, { params: { patientId } });
  return data;
}

// Infirmier : etat initial des alertes en attente (avant que le flux WebSocket ne prenne le relais).
export async function getAlertesActives() {
  const { data } = await api.get('/api/alertes/actives');
  return data;
}

// Infirmier : repondre "present" a une alerte -> en devient responsable.
export async function repondreAlerte(alerteId, infirmierId) {
  const { data } = await api.patch(`/api/alertes/${alerteId}/repondre`, null, { params: { infirmierId } });
  return data;
}

// Infirmier : se retracter suite a un imprevu -> l'alerte redevient disponible pour les autres.
export async function retracterAlerte(alerteId, infirmierId) {
  const { data } = await api.patch(`/api/alertes/${alerteId}/retracter`, null, { params: { infirmierId } });
  return data;
}

// Infirmier : soumettre le compte-rendu de fin d'intervention -> la libere pour une nouvelle alerte.
export async function soumettreCompteRendu(alerteId, infirmierId, compteRendu) {
  const { data } = await api.patch(
    `/api/alertes/${alerteId}/compte-rendu`,
    { compteRendu },
    { params: { infirmierId } }
  );
  return data;
}

// Infirmier : ses interventions actuellement en cours (alertes repondues, pas encore notees).
export async function getInterventionsEnCours(infirmierId) {
  const { data } = await api.get(`/api/alertes/infirmiers/${infirmierId}/en-cours`);
  return data;
}

// Infirmier : note moyenne recue sur l'ensemble de ses interventions terminees.
export async function getNoteMoyenneInfirmier(infirmierId) {
  const { data } = await api.get(`/api/alertes/infirmiers/${infirmierId}/note-moyenne`);
  return data;
}

// Patient : derniere position connue de l'infirmiere en route (la suite arrive sur /user/queue/suivi).
export async function getSuiviInfirmier(alerteId) {
  const { data } = await api.get(`/api/alertes/${alerteId}/suivi`);
  return data;
}
