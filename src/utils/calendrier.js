// Outils de dates pour le calendrier de disponibilite (dates locales, sans decalage UTC).

export const JOURS = [
  { code: 'MONDAY', court: 'Lun', long: 'Lundi' },
  { code: 'TUESDAY', court: 'Mar', long: 'Mardi' },
  { code: 'WEDNESDAY', court: 'Mer', long: 'Mercredi' },
  { code: 'THURSDAY', court: 'Jeu', long: 'Jeudi' },
  { code: 'FRIDAY', court: 'Ven', long: 'Vendredi' },
  { code: 'SATURDAY', court: 'Sam', long: 'Samedi' },
  { code: 'SUNDAY', court: 'Dim', long: 'Dimanche' },
];

/** YYYY-MM-DD en heure locale (toISOString decalerait la date selon le fuseau). */
export function isoDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ajouterJours(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Lundi de la semaine contenant d. */
export function debutSemaine(d) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const decalage = (r.getDay() + 6) % 7;
  return ajouterJours(r, -decalage);
}

/** "2026-10-05T09:30:00" -> "09:30" */
export function heureDe(dateHeureIso) {
  return dateHeureIso.slice(11, 16);
}
