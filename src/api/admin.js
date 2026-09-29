import { api } from './client';

export async function getComptesEnAttente(role) {
  const { data } = await api.get('/api/admin/comptes-en-attente', {
    params: role ? { role } : {},
  });
  return data;
}

// Tous les utilisateurs de la plateforme, tous statuts confondus.
export async function getTousLesUtilisateurs(role) {
  const { data } = await api.get('/api/admin/utilisateurs', {
    params: role ? { role } : {},
  });
  return data;
}

// Suppression definitive d'un compte, quel que soit son role.
export async function supprimerUtilisateur(id, adminId) {
  await api.delete(`/api/admin/utilisateurs/${id}`, { params: { adminId } });
}

export async function validerCompte(id, { approuve, motifRejet }) {
  const { data } = await api.patch(`/api/admin/comptes/${id}/valider`, { approuve, motifRejet });
  return data;
}

export async function remettreEnAttente(id) {
  const { data } = await api.patch(`/api/admin/comptes/${id}/remettre-en-attente`);
  return data;
}

export async function toggleActif(id) {
  const { data } = await api.patch(`/api/admin/comptes/${id}/toggle-actif`);
  return data;
}

// Admin : attribuer (ou retirer avec null) le directeur responsable d'un etablissement.
export async function attribuerDirecteur(etablissementId, directeurId) {
  const { data } = await api.patch(`/api/admin/etablissements/${etablissementId}/directeur`, { directeurId });
  return data;
}
