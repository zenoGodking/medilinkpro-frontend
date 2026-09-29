import { useCallback, useEffect, useState } from 'react';
import { Pill, Plus, Trash2, X, BellOff, Bell } from 'lucide-react';
import { getRappels, ajouterRappel, basculerRappel, supprimerRappel } from '../../api/suivi';
import { Button, FieldLabel, TextInput, Spinner } from '../ui';
import NotificationsPushCard from '../NotificationsPushCard';

/** Rappels de medicaments : geres par le patient, consultables par les medecins. */
export default function OngletRappels({ patientId, estPatient }) {
  const [rappels, setRappels] = useState(null);
  const [form, setForm] = useState({ medicament: '', dosage: '', heures: ['08:00'], dateFin: '' });
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(() => getRappels(patientId).then(setRappels).catch(() => setRappels([])), [patientId]);
  useEffect(() => { charger(); }, [charger]);

  async function enregistrer(e) {
    e.preventDefault();
    setErreur(null);
    try {
      await ajouterRappel(patientId, {
        medicament: form.medicament, dosage: form.dosage || null,
        heures: form.heures.filter(Boolean), dateFin: form.dateFin || null,
      });
      setForm({ medicament: '', dosage: '', heures: ['08:00'], dateFin: '' });
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "Le rappel n'a pas pu etre cree.");
    }
  }

  const majHeure = (i, v) => setForm((f) => ({ ...f, heures: f.heures.map((h, j) => (j === i ? v : h)) }));

  if (!rappels) return <div className="flex justify-center py-8"><Spinner className="w-5 h-5" /></div>;

  return (
    <div className="space-y-4">
      {rappels.length === 0 ? (
        <p className="text-sm text-(--color-ink-600)">Aucun traitement enregistre.</p>
      ) : (
        <ul className="divide-y divide-(--color-petrol-100)">
          {rappels.map((r) => (
            <li key={r.id} className={`flex items-center gap-3 py-3 ${r.actif ? '' : 'opacity-50'}`}>
              <Pill size={18} className="text-(--color-petrol-400) shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-(--color-ink-900)">{r.medicament}{r.dosage && ` — ${r.dosage}`}</p>
                <p className="text-xs text-(--color-ink-600)">
                  {r.heures.map((h) => h.slice(0, 5)).join(' · ')}
                  {r.dateFin ? ` · jusqu'au ${new Date(r.dateFin).toLocaleDateString('fr-FR')}` : ' · au long cours'}
                </p>
              </div>
              {estPatient && (
                <>
                  <button type="button" onClick={() => basculerRappel(r.id).then(charger)} aria-label={r.actif ? 'Suspendre' : 'Reprendre'}
                    className="p-1.5 rounded-lg text-(--color-petrol-600) hover:bg-(--color-petrol-50)">
                    {r.actif ? <Bell size={15} /> : <BellOff size={15} />}
                  </button>
                  <button type="button" onClick={() => supprimerRappel(r.id).then(charger)} aria-label="Supprimer"
                    className="p-1.5 rounded-lg text-(--color-ink-300) hover:text-(--color-clay-500) hover:bg-(--color-clay-100)">
                    <Trash2 size={15} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {estPatient && <NotificationsPushCard raison="Recevez une notification a chaque heure de prise, meme application fermee." />}

      {estPatient && (
        <form onSubmit={enregistrer} className="rounded-xl bg-(--color-petrol-50) p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Medicament</FieldLabel>
              <TextInput required value={form.medicament} placeholder="Metformine" onChange={(e) => setForm((f) => ({ ...f, medicament: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Dose</FieldLabel>
              <TextInput value={form.dosage} placeholder="500 mg, 1 comprime" onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))} />
            </div>
          </div>
          <div>
            <FieldLabel>Heures de prise</FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {form.heures.map((h, i) => (
                <span key={i} className="flex items-center gap-1">
                  <input type="time" required value={h} onChange={(e) => majHeure(i, e.target.value)}
                    className="px-2.5 py-2 rounded-xl border border-(--color-petrol-100) bg-white text-sm" />
                  {form.heures.length > 1 && (
                    <button type="button" aria-label="Retirer cette heure" onClick={() => setForm((f) => ({ ...f, heures: f.heures.filter((_, j) => j !== i) }))}
                      className="text-(--color-ink-300) hover:text-(--color-clay-500)"><X size={14} /></button>
                  )}
                </span>
              ))}
              <button type="button" onClick={() => setForm((f) => ({ ...f, heures: [...f.heures, '20:00'] }))}
                className="text-sm font-semibold text-(--color-petrol-600) hover:underline">+ une heure</button>
            </div>
          </div>
          <div className="max-w-xs">
            <FieldLabel>Fin du traitement (vide = au long cours)</FieldLabel>
            <TextInput type="date" value={form.dateFin} onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))} />
          </div>
          {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
          <Button type="submit"><Plus size={15} /> Ajouter le traitement</Button>

        </form>
      )}
    </div>
  );
}
