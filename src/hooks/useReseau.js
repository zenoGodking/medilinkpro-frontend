import { useEffect, useState } from 'react';

function connexionLente() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null;
  if (!c) return false;
  return c.saveData === true || ['slow-2g', '2g'].includes(c.effectiveType) || (c.downlink && c.downlink < 0.5);
}

/**
 * Etat du reseau : en ligne / hors ligne, et connexion lente (2G, mode "economie de donnees"
 * du telephone) d'apres la Network Information API quand le navigateur la fournit.
 */
export function useReseau() {
  const [etat, setEtat] = useState(() => ({
    enLigne: typeof navigator === 'undefined' ? true : navigator.onLine,
    lent: connexionLente(),
  }));

  useEffect(() => {
    const maj = () => setEtat({ enLigne: navigator.onLine, lent: connexionLente() });
    window.addEventListener('online', maj);
    window.addEventListener('offline', maj);
    navigator.connection?.addEventListener?.('change', maj);
    return () => {
      window.removeEventListener('online', maj);
      window.removeEventListener('offline', maj);
      navigator.connection?.removeEventListener?.('change', maj);
    };
  }, []);

  return etat;
}

export function estConnexionLente() {
  return connexionLente();
}
