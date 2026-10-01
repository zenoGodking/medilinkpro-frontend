export const GROUPE_SANGUIN_LABELS = {
  A_POSITIF: 'A+', A_NEGATIF: 'A-',
  B_POSITIF: 'B+', B_NEGATIF: 'B-',
  AB_POSITIF: 'AB+', AB_NEGATIF: 'AB-',
  O_POSITIF: 'O+', O_NEGATIF: 'O-',
  INCONNU: 'Inconnu',
};

export function libelleGroupeSanguin(groupe) {
  return groupe ? GROUPE_SANGUIN_LABELS[groupe] || groupe : 'Non renseigné';
}
