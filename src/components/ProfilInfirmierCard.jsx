import { useEffect, useState } from 'react';
import { Star, Building2, ShieldCheck, CalendarCheck2 } from 'lucide-react';
import { getProfilInfirmier } from '../api/infirmiers';
import PhotoInfirmier from './PhotoInfirmier';

/** Carte d'identite de l'infirmiere en route : le patient sait qui va sonner a sa porte. */
export default function ProfilInfirmierCard({ infirmierId }) {
  const [profil, setProfil] = useState(null);

  useEffect(() => {
    let annule = false;
    getProfilInfirmier(infirmierId)
      .then((p) => { if (!annule) setProfil(p); })
      .catch(() => { if (!annule) setProfil(null); });
    return () => { annule = true; };
  }, [infirmierId]);

  if (!profil) return null;

  const membreDepuis = profil.membreDepuis
    ? new Date(profil.membreDepuis).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-(--color-petrol-100) bg-(--color-ivory) p-4">
      <PhotoInfirmier infirmierId={profil.id} disponible={profil.photoDisponible} className="w-20 h-20"
        alt={`${profil.prenom} ${profil.nom}`} />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-(--color-petrol-400)">Votre infirmier(e)</p>
        <p className="font-display font-semibold text-lg text-(--color-ink-900) leading-tight">{profil.prenom} {profil.nom}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-(--color-ink-600)">
          <span className="flex items-center gap-1"><ShieldCheck size={13} className="text-(--color-sage-500)" /> Compte vérifié</span>
          {profil.nombreAvis > 0 && (
            <span className="flex items-center gap-1">
              <Star size={13} className="fill-(--color-amber-400) text-(--color-amber-400)" />
              {profil.noteMoyenne?.toFixed(1)} ({profil.nombreAvis} avis)
            </span>
          )}
          <span className="flex items-center gap-1"><CalendarCheck2 size={13} /> {profil.nombreInterventions} intervention(s)</span>
          {profil.etablissementNom && <span className="flex items-center gap-1"><Building2 size={13} /> {profil.etablissementNom}</span>}
          {membreDepuis && <span>Membre depuis {membreDepuis}</span>}
        </div>
      </div>
    </div>
  );
}
