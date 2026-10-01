import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getCreneaux } from '../api/disponibilites';
import { JOURS, isoDate, ajouterJours, debutSemaine, heureDe } from '../utils/calendrier';

const SEMAINES_MAX = 8;

/**
 * Grille semaine par semaine des creneaux d'un medecin (calendrier de disponibilite).
 * Les creneaux pris sont barres ; `rechargement` force une relecture (ex: apres un conflit).
 */
export default function SelecteurCreneau({ medecinId, choisi, onChoisir, rechargement = 0 }) {
  const [semaine, setSemaine] = useState(0);
  const [resultat, setResultat] = useState({ cle: null, creneaux: [] });

  const lundi = useMemo(() => ajouterJours(debutSemaine(new Date()), semaine * 7), [semaine]);
  const jours = useMemo(() => JOURS.map((j, i) => ({ ...j, date: ajouterJours(lundi, i) })), [lundi]);
  const cleRequete = `${medecinId}|${isoDate(lundi)}|${rechargement}`;
  const chargement = resultat.cle !== cleRequete;
  const creneaux = useMemo(() => (chargement ? [] : resultat.creneaux), [chargement, resultat]);

  useEffect(() => {
    let annule = false;
    getCreneaux(medecinId, isoDate(lundi), isoDate(ajouterJours(lundi, 6)))
      .then((data) => { if (!annule) setResultat({ cle: cleRequete, creneaux: data }); })
      .catch(() => { if (!annule) setResultat({ cle: cleRequete, creneaux: [] }); });
    return () => { annule = true; };
  }, [medecinId, lundi, cleRequete]);

  const parJour = useMemo(() => {
    const map = {};
    creneaux.forEach((c) => { (map[c.debut.slice(0, 10)] ||= []).push(c); });
    return map;
  }, [creneaux]);

  const aujourdhui = isoDate(new Date());
  const libres = creneaux.filter((c) => c.libre).length;

  function changerSemaine(delta) {
    setSemaine((s) => s + delta);
    onChoisir(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" disabled={semaine === 0} onClick={() => changerSemaine(-1)}
          className="p-2 rounded-xl hover:bg-(--color-petrol-50) disabled:opacity-30" aria-label="Semaine précédente">
          <ChevronLeft size={18} />
        </button>
        <p className="font-display font-semibold text-(--color-ink-900) text-center">
          Semaine du {lundi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
          <span className="block text-xs font-normal text-(--color-ink-600)">
            {chargement ? 'Chargement...' : `${libres} créneau${libres > 1 ? 'x' : ''} libre${libres > 1 ? 's' : ''}`}
          </span>
        </p>
        <button type="button" disabled={semaine >= SEMAINES_MAX - 1} onClick={() => changerSemaine(1)}
          className="p-2 rounded-xl hover:bg-(--color-petrol-50) disabled:opacity-30" aria-label="Semaine suivante">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="grid grid-cols-7 gap-2 min-w-[640px]">
          {jours.map((j) => {
            const cle = isoDate(j.date);
            const duJour = parJour[cle] || [];
            return (
              <div key={cle} className="space-y-1.5">
                <div className={`text-center rounded-lg py-1.5 ${cle === aujourdhui ? 'bg-(--color-petrol-600) text-white' : 'bg-(--color-petrol-50) text-(--color-ink-900)'}`}>
                  <p className="text-xs font-semibold">{j.court}</p>
                  <p className="text-sm">{j.date.getDate()}</p>
                </div>
                {chargement ? null : duJour.length === 0 ? (
                  <p className="text-[11px] text-center text-(--color-ink-300) pt-2">—</p>
                ) : duJour.map((c) => {
                  const selectionne = choisi?.debut === c.debut;
                  return (
                    <button
                      key={c.debut}
                      type="button"
                      disabled={!c.libre}
                      onClick={() => onChoisir(c)}
                      className={`w-full text-sm rounded-lg py-1.5 font-medium transition-colors ${!c.libre
                        ? 'bg-(--color-ivory) text-(--color-ink-300) line-through cursor-not-allowed'
                        : selectionne
                          ? 'bg-(--color-amber-400) text-(--color-petrol-900)'
                          : 'bg-white border border-(--color-petrol-100) text-(--color-petrol-600) hover:border-(--color-petrol-400)'}`}
                    >
                      {heureDe(c.debut)}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      {!chargement && libres === 0 && (
        <p className="text-sm text-center text-(--color-ink-600)">Aucun créneau libre cette semaine, essayez la semaine suivante.</p>
      )}
    </div>
  );
}
