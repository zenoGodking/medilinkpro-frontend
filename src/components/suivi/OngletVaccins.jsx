import { useCallback, useEffect, useState } from 'react';
import { Syringe, BadgeCheck, Plus, Trash2 } from 'lucide-react';
import { getVaccinations, ajouterVaccination, validerVaccination, supprimerVaccination } from '../../api/suivi';
import { Button, FieldLabel, TextInput, Spinner } from '../ui';

const VIDE = { vaccin: '', dose: '', dateVaccination: '', lot: '', lieu: '' };

/**
 * Carnet de vaccination. Le patient peut declarer ses anciens vaccins (carnet papier) ;
 * un medecin autorise les saisit ou les confirme (VALIDEE).
 */
export default function OngletVaccins({ patientId, estPatient, peutEcrire }) {
  const [vaccins, setVaccins] = useState(null);
  const [form, setForm] = useState(VIDE);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(() => getVaccinations(patientId).then(setVaccins).catch(() => setVaccins([])), [patientId]);
  useEffect(() => { charger(); }, [charger]);

  async function enregistrer(e) {
    e.preventDefault();
    setErreur(null);
    try {
      await ajouterVaccination(patientId, Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || null])));
      setForm(VIDE);
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Le vaccin n'a pas pu etre enregistre.");
    }
  }

  if (!vaccins) return <div className="flex justify-center py-8"><Spinner className="w-5 h-5" /></div>;
  const medecinAutorise = peutEcrire && !estPatient;

  return (
    <div className="space-y-4">
      {vaccins.length === 0 ? (
        <p className="text-sm text-(--color-ink-600)">Aucun vaccin enregistre.</p>
      ) : (
        <ul className="divide-y divide-(--color-petrol-100)">
          {vaccins.map((v) => (
            <li key={v.id} className="flex items-center gap-3 py-3">
              <Syringe size={18} className="text-(--color-petrol-400) shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-(--color-ink-900)">{v.vaccin}{v.dose && ` — ${v.dose}`}</p>
                <p className="text-xs text-(--color-ink-600)">
                  {new Date(v.dateVaccination).toLocaleDateString('fr-FR')}{v.lieu && ` · ${v.lieu}`}{v.lot && ` · lot ${v.lot}`}
                </p>
              </div>
              {v.statut === 'VALIDEE' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-(--color-sage-500)">
                  <BadgeCheck size={14} /> Valide{v.valideParNom && ` par ${v.valideParNom}`}
                </span>
              ) : (
                <span className="text-xs font-semibold text-(--color-ink-600)">Declare par le patient</span>
              )}
              {v.statut === 'DECLAREE' && medecinAutorise && (
                <Button variant="ghost" className="!px-3 !py-1.5" onClick={() => validerVaccination(v.id).then(charger)}>Valider</Button>
              )}
              {v.statut === 'DECLAREE' && estPatient && (
                <button type="button" aria-label="Supprimer" onClick={() => supprimerVaccination(v.id).then(charger)}
                  className="p-1.5 rounded-lg text-(--color-ink-300) hover:text-(--color-clay-500) hover:bg-(--color-clay-100)">
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {peutEcrire && (
        <form onSubmit={enregistrer} className="rounded-xl bg-(--color-petrol-50) p-4 space-y-3">
          <p className="text-sm text-(--color-ink-600)">
            {estPatient ? 'Recopiez un vaccin de votre carnet papier : il sera marque « declare » jusqu\'a validation par un medecin.'
              : 'Vaccin saisi par vous : il sera marque « valide ».'}
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><FieldLabel>Vaccin</FieldLabel><TextInput required value={form.vaccin} placeholder="Fievre jaune, Hepatite B..." onChange={(e) => setForm((f) => ({ ...f, vaccin: e.target.value }))} /></div>
            <div><FieldLabel>Dose</FieldLabel><TextInput value={form.dose} placeholder="1re dose, rappel" onChange={(e) => setForm((f) => ({ ...f, dose: e.target.value }))} /></div>
            <div><FieldLabel>Date</FieldLabel><TextInput type="date" required max={new Date().toISOString().slice(0, 10)} value={form.dateVaccination} onChange={(e) => setForm((f) => ({ ...f, dateVaccination: e.target.value }))} /></div>
            <div><FieldLabel>Lieu</FieldLabel><TextInput value={form.lieu} onChange={(e) => setForm((f) => ({ ...f, lieu: e.target.value }))} /></div>
            <div><FieldLabel>Numero de lot</FieldLabel><TextInput value={form.lot} onChange={(e) => setForm((f) => ({ ...f, lot: e.target.value }))} /></div>
          </div>
          {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
          <Button type="submit"><Plus size={15} /> Ajouter le vaccin</Button>
        </form>
      )}
    </div>
  );
}
