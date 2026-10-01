import { useEffect, useMemo, useState } from 'react';
import { UserCheck, X, Plus } from 'lucide-react';
import { Card, Button, Select } from './ui';
import { getMesAutorisations, autoriserMedecin, revoquerMedecin } from '../api/carnets';
import { searchMedecins } from '../api/medecins';

/**
 * Le patient choisit les medecins autorises a ecrire dans son carnet. Tout medecin peut
 * deja le lire ; ceux qui l'ont deja suivi (consultation, rendez-vous) peuvent aussi y ecrire.
 */
export default function AutorisationsMedecinsCard() {
  const [autorisations, setAutorisations] = useState([]);
  const [medecins, setMedecins] = useState([]);
  const [choix, setChoix] = useState('');
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    getMesAutorisations().then(setAutorisations).catch(() => {});
    searchMedecins({}).then(setMedecins).catch(() => {});
  }, []);

  const disponibles = useMemo(() => {
    const deja = new Set(autorisations.map((a) => a.medecinId));
    return medecins.filter((m) => !deja.has(m.id));
  }, [medecins, autorisations]);

  async function ajouter() {
    setErreur(null);
    try {
      const a = await autoriserMedecin(choix);
      setAutorisations((prev) => [a, ...prev]);
      setChoix('');
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'autoriser ce médecin.");
    }
  }

  async function retirer(medecinId) {
    setErreur(null);
    try {
      await revoquerMedecin(medecinId);
      setAutorisations((prev) => prev.filter((a) => a.medecinId !== medecinId));
    } catch {
      setErreur("Impossible de retirer l'autorisation.");
    }
  }

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display font-semibold text-(--color-ink-900)">
        <UserCheck size={18} className="text-(--color-petrol-600)" /> Médecins autorisés à écrire dans mon carnet
      </h2>
      <p className="text-sm text-(--color-ink-600) mt-0.5">
        Les médecins qui vous ont déjà suivi peuvent aussi y écrire. Les autres peuvent seulement le consulter.
      </p>

      {autorisations.length > 0 && (
        <ul className="mt-4 divide-y divide-(--color-petrol-100)">
          {autorisations.map((a) => (
            <li key={a.medecinId} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-(--color-ink-900)">Dr {a.medecinPrenom} {a.medecinNom}</p>
                <p className="text-xs text-(--color-ink-600)">{a.specialite}</p>
              </div>
              <Button variant="danger" className="!px-3 !py-1.5" onClick={() => retirer(a.medecinId)}>
                <X size={14} /> Retirer
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <Select value={choix} onChange={(e) => setChoix(e.target.value)}>
          <option value="">Choisir un médecin à autoriser...</option>
          {disponibles.map((m) => (
            <option key={m.id} value={m.id}>Dr {m.prenom} {m.nom}{m.specialite ? ` — ${m.specialite}` : ''}</option>
          ))}
        </Select>
        <Button onClick={ajouter} disabled={!choix}><Plus size={15} /> Autoriser</Button>
      </div>
      {erreur && <p className="text-sm text-(--color-clay-500) mt-2">{erreur}</p>}
    </Card>
  );
}
