import { useEffect, useState } from 'react';
import { MessageSquareQuote } from 'lucide-react';
import { getAvisMedecin } from '../api/rendezVous';
import { Etoiles } from './ui';

/** Moyenne et derniers avis des patients sur un medecin. */
export default function AvisMedecin({ medecinId, limite = 5 }) {
  const [resume, setResume] = useState(null);

  useEffect(() => {
    let annule = false;
    getAvisMedecin(medecinId).then((r) => { if (!annule) setResume(r); }).catch(() => {});
    return () => { annule = true; };
  }, [medecinId]);

  if (!resume) return null;
  if (resume.nombre === 0) {
    return <p className="text-sm text-(--color-ink-300)">Pas encore d'avis de patients.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Etoiles valeur={resume.moyenne} />
        <span className="font-semibold text-(--color-ink-900)">{resume.moyenne.toFixed(1)}</span>
        <span className="text-sm text-(--color-ink-600)">({resume.nombre} avis)</span>
      </div>
      {resume.avis.filter((a) => a.commentaire && !a.masque).slice(0, limite).map((a) => (
        <div key={a.id} className="bg-(--color-ivory) rounded-xl px-4 py-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-medium text-(--color-ink-900)">
              <MessageSquareQuote size={14} className="text-(--color-petrol-400)" /> {a.auteur}
            </span>
            <Etoiles valeur={a.note} taille={12} />
          </div>
          <p className="text-(--color-ink-600) mt-1">{a.commentaire}</p>
        </div>
      ))}
    </div>
  );
}
