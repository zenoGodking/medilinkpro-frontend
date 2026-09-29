/**
 * Centralise le mapping entre le role d'un utilisateur et la racine de son
 * espace applicatif. Utilise pour la redirection post-connexion et pour
 * proteger les routes par role.
 */
export const HOME_BY_ROLE = {
  PATIENT: '/patient',
  MEDECIN: '/medecin',
  DIRECTEUR: '/directeur',
  ADMIN: '/admin',
  INFIRMIER: '/infirmier',
};

export function homeForRole(role) {
  return HOME_BY_ROLE[role] || '/connexion';
}
