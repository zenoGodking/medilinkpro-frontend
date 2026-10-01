import { useState } from 'react';
import { Activity, Pill, Syringe, Baby } from 'lucide-react';
import { Card } from '../ui';
import OngletMesures from './OngletMesures';
import OngletRappels from './OngletRappels';
import OngletVaccins from './OngletVaccins';
import OngletGrossesse from './OngletGrossesse';

const ONGLETS = [
  { cle: 'mesures', libelle: 'Mesures', icon: Activity },
  { cle: 'medicaments', libelle: 'Médicaments', icon: Pill },
  { cle: 'vaccins', libelle: 'Vaccins', icon: Syringe },
  { cle: 'grossesse', libelle: 'Grossesse', icon: Baby },
];

/**
 * Suivi de sante d'un patient, partage entre l'espace patient (estPatient) et le carnet
 * consulte par un medecin (peutEcrire = medecin autorise ; sinon lecture seule).
 */
export default function SuiviSante({ patientId, estPatient = false, peutEcrire = false }) {
  const [onglet, setOnglet] = useState('mesures');
  const props = { patientId, estPatient, peutEcrire: estPatient || peutEcrire };

  return (
    <Card className="p-5">
      <div role="tablist" className="flex flex-wrap gap-1 border-b border-(--color-petrol-100) mb-5">
        {ONGLETS.map(({ cle, libelle, icon: Icon }) => (
          <button key={cle} type="button" role="tab" aria-selected={onglet === cle} onClick={() => setOnglet(cle)}
            className={`flex items-center gap-1.5 px-3 py-2 -mb-px text-sm font-medium border-b-2 transition-colors ${onglet === cle
              ? 'border-(--color-petrol-600) text-(--color-petrol-700)' : 'border-transparent text-(--color-ink-600) hover:text-(--color-petrol-600)'}`}>
            <Icon size={15} /> {libelle}
          </button>
        ))}
      </div>
      {onglet === 'mesures' && <OngletMesures {...props} />}
      {onglet === 'medicaments' && <OngletRappels {...props} />}
      {onglet === 'vaccins' && <OngletVaccins {...props} />}
      {onglet === 'grossesse' && <OngletGrossesse {...props} />}
    </Card>
  );
}
