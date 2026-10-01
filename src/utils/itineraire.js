// Calcul d'itineraire et outils de navigation, entierement dans l'application (aucune redirection
// vers une application externe). Le calcul routier utilise un serveur OSRM : par defaut le serveur
// public de demonstration, a remplacer en production par votre propre instance (VITE_ROUTAGE_URL).

export const ROUTAGE_URL = (import.meta.env.VITE_ROUTAGE_URL || 'https://router.project-osrm.org').replace(/\/$/, '');
export const TUILES_URL = import.meta.env.VITE_TUILES_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TUILES_ATTRIBUTION = import.meta.env.VITE_TUILES_ATTRIBUTION || '&copy; OpenStreetMap';

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

/** Distance en metres entre deux points [lat, lng]. */
export function distance([lat1, lng1], [lat2, lng2]) {
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Cap (0-360 degres, 0 = nord) de a vers b. */
export function cap([lat1, lng1], [lat2, lng2]) {
  const y = Math.sin(rad(lng2 - lng1)) * Math.cos(rad(lat2));
  const x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lng2 - lng1));
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const POINTS_CARDINAUX = ['le nord', 'le nord-est', "l'est", 'le sud-est', 'le sud', 'le sud-ouest', "l'ouest", 'le nord-ouest'];
export function direction(degres) {
  return POINTS_CARDINAUX[Math.round(degres / 45) % 8];
}

export function formatDistance(m) {
  if (m == null) return '';
  if (m < 1000) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  return `${(m / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
}

export function formatDuree(s) {
  if (s == null) return '';
  const min = Math.max(1, Math.round(s / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

const MODIFICATEURS = {
  uturn: 'faites demi-tour',
  'sharp right': 'tournez franchement à droite',
  right: 'tournez à droite',
  'slight right': 'serrez à droite',
  straight: 'continuez tout droit',
  'slight left': 'serrez à gauche',
  left: 'tournez à gauche',
  'sharp left': 'tournez franchement à gauche',
};

const ORDINAUX = ['', 'première', 'deuxième', 'troisième', 'quatrième', 'cinquième', 'sixième'];

/** Traduit une etape OSRM en consigne francaise. */
export function consigne(step) {
  const { type, modifier, exit } = step.maneuver;
  const rue = step.name ? ` sur ${step.name}` : '';
  const vers = step.name ? ` vers ${step.name}` : '';
  switch (type) {
    case 'depart':
      return `Partez${modifier && modifier !== 'straight' ? ` en direction ${modifier.includes('left') ? 'de la gauche' : 'de la droite'}` : ''}${rue}`;
    case 'arrive':
      return 'Vous êtes arrivé(e) à destination';
    case 'roundabout':
    case 'rotary':
      return exit
        ? `Au rond-point, prenez la ${ORDINAUX[exit] || `${exit}e`} sortie${vers}`
        : `Entrez dans le rond-point${vers}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `Sortez du rond-point${vers}`;
    case 'fork':
      return `À l'embranchement, ${modifier?.includes('left') ? 'restez à gauche' : 'restez à droite'}${vers}`;
    case 'end of road':
      return `Au bout de la route, ${MODIFICATEURS[modifier] || 'tournez'}${rue}`;
    case 'merge':
      return `Rejoignez la voie${rue}`;
    case 'continue':
    case 'new name':
      return modifier && modifier !== 'straight' ? `${capitaliser(MODIFICATEURS[modifier] || 'continuez')}${rue}` : `Continuez${rue}`;
    default:
      return `${capitaliser(MODIFICATEURS[modifier] || 'continuez')}${rue}`;
  }
}

function capitaliser(t) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Itineraire routier entre deux points [lat, lng].
 * Retourne { points: [[lat,lng]...], distance (m), duree (s), etapes: [{ consigne, type, modifier, point, index }] }.
 */
export async function calculerItineraire(depart, arrivee, { signal } = {}) {
  const coords = `${depart[1]},${depart[0]};${arrivee[1]},${arrivee[0]}`;
  const reponse = await fetch(
    `${ROUTAGE_URL}/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`,
    { signal },
  );
  if (!reponse.ok) throw new Error('itinéraire indisponible');
  const json = await reponse.json();
  const route = json.routes?.[0];
  if (json.code !== 'Ok' || !route) throw new Error('itinéraire introuvable');

  const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const etapes = route.legs.flatMap((leg) => leg.steps).map((step) => {
    const point = [step.maneuver.location[1], step.maneuver.location[0]];
    return {
      consigne: consigne(step),
      type: step.maneuver.type,
      modifier: step.maneuver.modifier,
      point,
      index: indexPlusProche(points, point),
    };
  });
  return { points, distance: route.distance, duree: route.duration, etapes };
}

/** Indice du point de la polyligne le plus proche de p. */
export function indexPlusProche(points, p) {
  let meilleur = 0;
  let min = Infinity;
  points.forEach((q, i) => {
    const d = distance(p, q);
    if (d < min) {
      min = d;
      meilleur = i;
    }
  });
  return meilleur;
}

/** Distance (m) de p au trace (approximation par les sommets, suffisante pour detecter un ecart). */
export function ecartAuTrace(points, p) {
  return points.reduce((min, q) => Math.min(min, distance(p, q)), Infinity);
}

/** Longueur (m) du trace entre deux indices. */
export function longueurTrace(points, de, a) {
  let total = 0;
  for (let i = de; i < a && i < points.length - 1; i++) total += distance(points[i], points[i + 1]);
  return total;
}
