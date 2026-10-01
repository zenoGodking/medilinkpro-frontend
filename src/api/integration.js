import { api } from './client';

// Etablissement (Directeur/Admin) invite un medecin a le rejoindre.
export async function inviterMedecin(etablissementId, medecinId, message) {
  const { data } = await api.post(
    `/api/etablissements/${etablissementId}/inviter-medecin/${medecinId}`,
    { message: message || null }
  );
  return data;
}

// Le medecin demande a rejoindre un etablissement.
export async function demanderIntegration(medecinId, etablissementId, message) {
  const { data } = await api.post(
    `/api/medecins/${medecinId}/demander-integration/${etablissementId}`,
    { message: message || null }
  );
  return data;
}

// Accepter ou refuser une demande (medecin ou etablissement selon qui a initie).
export async function repondreDemandeIntegration(demandeId, actorId, { accepter, messageReponse }) {
  const { data } = await api.patch(
    `/api/demandes-integration/${demandeId}/repondre`,
    { accepter, messageReponse },
    { params: { actorId } }
  );
  return data;
}

export async function getDemandesMedecin(medecinId) {
  const { data } = await api.get(`/api/medecins/${medecinId}/demandes-integration`);
  return data;
}

export async function getDemandesEtablissement(etablissementId) {
  const { data } = await api.get(`/api/etablissements/${etablissementId}/demandes-integration`);
  return data;
}

// Directeur/Admin : demandes d'adhesion en attente (directeur : ses etablissements, admin : toutes).
export async function getDemandesEnAttente() {
  const { data } = await api.get('/api/demandes-integration/en-attente');
  return data;
}
