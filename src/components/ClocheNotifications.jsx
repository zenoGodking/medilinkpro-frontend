import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, getNombreNonLues, marquerNotificationLue, marquerToutesLues } from '../api/notifications';
import { getToken } from '../api/client';
import { useAlerteSocket } from '../hooks/useAlerteSocket';

const RAFRAICHISSEMENT_MS = 120000;

function ilYA(iso) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/**
 * Cloche des notifications (rendez-vous confirmés, reportés, rappels, ordonnances...).
 * Temps réel via WebSocket, avec un rafraîchissement périodique de secours sur réseau instable.
 */
export default function ClocheNotifications() {
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [nonLues, setNonLues] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [chargement, setChargement] = useState(false);
  const conteneurRef = useRef(null);

  const rafraichirCompteur = useCallback(() => {
    getNombreNonLues().then(setNonLues).catch(() => {});
  }, []);

  useEffect(() => {
    rafraichirCompteur();
    const id = setInterval(rafraichirCompteur, RAFRAICHISSEMENT_MS);
    const auRetour = () => { if (document.visibilityState === 'visible') rafraichirCompteur(); };
    document.addEventListener('visibilitychange', auRetour);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', auRetour);
    };
  }, [rafraichirCompteur]);

  const abonnements = useMemo(() => [{
    destination: '/user/queue/notifications',
    onMessage: (n) => {
      setNonLues((c) => c + 1);
      setNotifications((prev) => [n, ...prev.filter((x) => x.id !== n.id)]);
    },
  }], []);
  useAlerteSocket(getToken(), abonnements);

  useEffect(() => {
    if (!ouvert) return undefined;
    function fermer(e) {
      if (conteneurRef.current && !conteneurRef.current.contains(e.target)) setOuvert(false);
    }
    document.addEventListener('mousedown', fermer);
    return () => document.removeEventListener('mousedown', fermer);
  }, [ouvert]);

  async function basculer() {
    const suivant = !ouvert;
    setOuvert(suivant);
    if (suivant) {
      setChargement(true);
      try {
        setNotifications(await getNotifications());
      } catch {
        // garde la liste deja chargee
      } finally {
        setChargement(false);
      }
    }
  }

  async function ouvrir(n) {
    if (!n.lue) {
      marquerNotificationLue(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, lue: true } : x)));
      setNonLues((c) => Math.max(0, c - 1));
    }
    setOuvert(false);
    if (n.lien) navigate(n.lien);
  }

  async function toutLire() {
    await marquerToutesLues().catch(() => {});
    setNotifications((prev) => prev.map((x) => ({ ...x, lue: true })));
    setNonLues(0);
  }

  return (
    <div className="relative" ref={conteneurRef}>
      <button
        type="button"
        onClick={basculer}
        className="relative p-2 rounded-full text-(--color-ink-600) hover:bg-(--color-petrol-50) hover:text-(--color-petrol-700)"
        aria-label={`Notifications${nonLues ? ` (${nonLues} non lues)` : ''}`}
      >
        <Bell size={19} />
        {nonLues > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-(--color-clay-500) text-white text-[10px] font-bold flex items-center justify-center">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl border border-(--color-petrol-100) shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-petrol-100)">
            <p className="font-semibold text-sm text-(--color-ink-900)">Notifications</p>
            {nonLues > 0 && (
              <button type="button" onClick={toutLire} className="flex items-center gap-1 text-xs font-medium text-(--color-petrol-600) hover:underline">
                <CheckCheck size={14} /> Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {chargement && notifications.length === 0 ? (
              <p className="text-sm text-(--color-ink-300) text-center py-8">Chargement...</p>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-(--color-ink-300) text-center py-8">Aucune notification.</p>
            ) : notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => ouvrir(n)}
                className={`w-full text-left px-4 py-3 border-b border-(--color-petrol-50) hover:bg-(--color-ivory) flex gap-3 ${n.lue ? '' : 'bg-(--color-petrol-50)/60'}`}
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.lue ? 'bg-transparent' : 'bg-(--color-amber-500)'}`} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-(--color-ink-900)">{n.titre}</span>
                  <span className="block text-sm text-(--color-ink-600) line-clamp-3">{n.message}</span>
                  <span className="block text-xs text-(--color-ink-300) mt-1">{ilYA(n.dateCreation)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
