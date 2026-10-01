import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  // Reseau mobile lent : on laisse du temps, puis les lectures sont retentees (voir plus bas).
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const ESSAIS_LECTURE = 2;
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));

// Les fichiers uploades (ex: photos d'etablissements) sont renvoyes par l'API sous forme
// d'URL relative (/uploads/...). On les prefixe avec l'hote du backend pour l'affichage.
export function resolveMediaUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

// Injecte automatiquement le token JWT stocke en session sur chaque requete sortante.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('medilinkpro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Expose la lecture du token pour les canaux hors-axios (ex: WebSocket temps reel des alertes).
export function getToken() {
  return sessionStorage.getItem('medilinkpro_token');
}

// Si le token est expire ou invalide, l'API renvoie 401 : on deconnecte proprement.
// Les lectures (GET) qui echouent faute de reseau sont retentees avec un delai croissant ;
// une reponse servie par la copie locale du service worker est signalee a l'interface.
api.interceptors.response.use(
  (response) => {
    const copie = response.headers?.['x-medilinkpro-copie-locale'];
    if (response.config?.method === 'get' && response.config.url?.startsWith('/api/')) {
      window.dispatchEvent(new CustomEvent(copie ? 'medilinkpro:copie-locale' : 'medilinkpro:donnees-fraiches', { detail: { date: copie } }));
    }
    return response;
  },
  async (error) => {
    const config = error.config;
    const erreurReseau = !error.response && error.code !== 'ERR_CANCELED';
    if (config && erreurReseau && (config.method || 'get') === 'get') {
      config.essai = (config.essai || 0) + 1;
      if (config.essai <= ESSAIS_LECTURE) {
        await attendre(1000 * 2 ** (config.essai - 1));
        return api(config);
      }
    }
    if (error.response?.status === 401) {
      sessionStorage.removeItem('medilinkpro_token');
      sessionStorage.removeItem('medilinkpro_user');
      viderCopieLocale();
      if (window.location.pathname !== '/connexion') {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

// Efface la copie locale des donnees (service worker) : a la deconnexion, aucune donnee de sante
// ne doit rester sur l'appareil.
export function viderCopieLocale() {
  navigator.serviceWorker?.controller?.postMessage({ type: 'vider-copie-api' });
}
