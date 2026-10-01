import { useEffect, useState } from 'react';
import { WifiOff, Signal, History } from 'lucide-react';
import { useReseau } from '../hooks/useReseau';

/**
 * Bandeau d'etat du reseau : hors ligne, connexion lente, ou donnees affichees depuis la copie
 * locale (le service worker sert la derniere version connue quand le serveur ne repond pas).
 */
export default function BandeauReseau() {
  const { enLigne, lent } = useReseau();
  const [copieLocale, setCopieLocale] = useState(null);

  useEffect(() => {
    const surCopie = (e) => setCopieLocale(e.detail?.date || new Date().toISOString());
    const surFraiche = () => setCopieLocale(null);
    window.addEventListener('medilinkpro:copie-locale', surCopie);
    window.addEventListener('medilinkpro:donnees-fraiches', surFraiche);
    return () => {
      window.removeEventListener('medilinkpro:copie-locale', surCopie);
      window.removeEventListener('medilinkpro:donnees-fraiches', surFraiche);
    };
  }, []);

  let contenu = null;
  if (!enLigne) {
    contenu = { icone: WifiOff, texte: 'Hors connexion : vous consultez les dernières données chargées. Les modifications reprendront au retour du réseau.', classe: 'bg-(--color-clay-500) text-white' };
  } else if (copieLocale) {
    const heure = new Date(copieLocale).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    contenu = { icone: History, texte: `Réseau instable : certaines données affichées datent de ${heure}.`, classe: 'bg-(--color-amber-400) text-(--color-petrol-900)' };
  } else if (lent) {
    contenu = { icone: Signal, texte: 'Connexion lente : mode économie de données activé (photos compressées, vidéo allégée).', classe: 'bg-(--color-petrol-50) text-(--color-petrol-700)' };
  }
  if (!contenu) return null;
  const Icone = contenu.icone;
  return (
    <div className={`text-xs sm:text-sm px-4 py-2 flex items-center justify-center gap-2 text-center ${contenu.classe}`} role="status">
      <Icone size={15} className="shrink-0" /> {contenu.texte}
    </div>
  );
}
