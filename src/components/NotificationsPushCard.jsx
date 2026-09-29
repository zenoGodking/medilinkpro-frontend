import { useEffect, useState } from 'react';
import { BellRing, BellOff, BellPlus } from 'lucide-react';
import { Card, Button } from './ui';
import { etatNotifications, activerNotifications, desactiverNotifications } from '../utils/notificationsPush';

/**
 * Active les notifications push sur cet appareil (une fois par telephone / navigateur).
 * `raison` explique a l'utilisateur ce qu'il recevra.
 */
export default function NotificationsPushCard({ raison }) {
  const [etat, setEtat] = useState(null);
  const [erreur, setErreur] = useState(null);

  useEffect(() => { etatNotifications().then(setEtat); }, []);

  async function basculer() {
    setErreur(null);
    try {
      setEtat(etat === 'actif' ? await desactiverNotifications() : await activerNotifications());
    } catch {
      setErreur("Impossible d'activer les notifications sur cet appareil (le site doit etre en HTTPS).");
    }
  }

  if (!etat || etat === 'actif') {
    return etat === 'actif' ? (
      <p className="flex items-center justify-between gap-2 text-sm text-(--color-sage-500) bg-(--color-sage-100) rounded-xl px-4 py-2.5">
        <span className="flex items-center gap-2"><BellRing size={16} /> Notifications activees sur cet appareil.</span>
        <button type="button" onClick={basculer} className="text-xs font-semibold underline">Desactiver</button>
      </p>
    ) : null;
  }

  return (
    <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      {etat === 'refuse' ? <BellOff size={22} className="text-(--color-clay-500) shrink-0" /> : <BellPlus size={22} className="text-(--color-petrol-600) shrink-0" />}
      <div className="flex-1 text-sm">
        <p className="font-semibold text-(--color-ink-900)">
          {etat === 'refuse' ? 'Notifications bloquees' : etat === 'non-supporte' ? 'Notifications indisponibles' : 'Activez les notifications'}
        </p>
        <p className="text-(--color-ink-600)">
          {etat === 'refuse' ? "Vous les avez refusees : reautorisez-les dans les reglages du navigateur pour ce site."
            : etat === 'non-supporte' ? "Ce navigateur ne les gere pas. Sur iPhone, installez d'abord l'application (Partager > Sur l'ecran d'accueil)."
              : raison}
        </p>
        {erreur && <p className="text-(--color-clay-500) mt-1">{erreur}</p>}
      </div>
      {etat === 'inactif' && <Button onClick={basculer}><BellRing size={15} /> Activer</Button>}
    </Card>
  );
}
