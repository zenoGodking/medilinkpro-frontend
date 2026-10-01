import { useEffect, useState } from 'react';
import { Siren, Pencil } from 'lucide-react';
import { Card, Button, FieldLabel, TextInput, Select, Spinner } from './ui';
import { getPatient, updatePatient } from '../api/patients';
import { GROUPE_SANGUIN_LABELS, libelleGroupeSanguin } from '../utils/groupeSanguin';

const CHAMPS = ['groupeSanguin', 'allergies', 'conditionsUrgence', 'contactUrgenceNom', 'contactUrgenceTelephone'];

/**
 * Informations visibles par toute personne qui retrouve le patient accidente (scan facial) :
 * c'est le patient qui les renseigne et les tient a jour.
 */
export default function InfosUrgenceCard({ patientId }) {
  const [patient, setPatient] = useState(null);
  const [form, setForm] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  useEffect(() => {
    getPatient(patientId).then(setPatient).catch(() => setErreur('Informations indisponibles.'));
  }, [patientId]);

  function editer() {
    setForm(Object.fromEntries(CHAMPS.map((c) => [c, patient[c] || ''])));
  }

  async function enregistrer(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      // Chaine vide = effacer le champ ; le groupe sanguin vide n'est pas envoye.
      const payload = { ...form, groupeSanguin: form.groupeSanguin || null };
      setPatient(await updatePatient(patientId, payload));
      setForm(null);
    } catch (err) {
      setErreur(err.response?.data?.message || "Impossible d'enregistrer.");
    } finally {
      setEnvoi(false);
    }
  }

  if (!patient) {
    return <Card className="p-5 flex justify-center">{erreur ? <p className="text-sm">{erreur}</p> : <Spinner className="w-5 h-5" />}</Card>;
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display font-semibold text-(--color-ink-900)">
            <Siren size={18} className="text-(--color-clay-500)" /> Informations d'urgence
          </h2>
          <p className="text-sm text-(--color-ink-600) mt-0.5">
            Visibles par toute personne qui vous retrouve accidenté (via votre photo). N'y mettez que ce qui aide les secours.
          </p>
        </div>
        {!form && <Button variant="ghost" onClick={editer}><Pencil size={15} /> Modifier</Button>}
      </div>

      {form ? (
        <form onSubmit={enregistrer} className="mt-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Groupe sanguin</FieldLabel>
              <Select value={form.groupeSanguin} onChange={(e) => setForm((f) => ({ ...f, groupeSanguin: e.target.value }))}>
                <option value="">Je ne sais pas</option>
                {Object.entries(GROUPE_SANGUIN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Allergies</FieldLabel>
              <TextInput value={form.allergies} placeholder="Pénicilline, arachides..." onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} />
            </div>
          </div>
          <div>
            <FieldLabel>À signaler aux secours</FieldLabel>
            <TextInput value={form.conditionsUrgence} placeholder="Asthme, diabète, épilepsie, pacemaker, grossesse..."
              onChange={(e) => setForm((f) => ({ ...f, conditionsUrgence: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Proche à prévenir (nom)</FieldLabel>
              <TextInput value={form.contactUrgenceNom} onChange={(e) => setForm((f) => ({ ...f, contactUrgenceNom: e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Proche à prévenir (téléphone)</FieldLabel>
              <TextInput type="tel" value={form.contactUrgenceTelephone} placeholder="+237 6XX XXX XXX"
                onChange={(e) => setForm((f) => ({ ...f, contactUrgenceTelephone: e.target.value }))} />
            </div>
          </div>
          {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={envoi}>{envoi ? 'Enregistrement...' : 'Enregistrer'}</Button>
            <Button type="button" variant="ghost" onClick={() => setForm(null)}>Annuler</Button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><dt className="text-(--color-ink-600)">Groupe sanguin</dt><dd className="font-semibold">{libelleGroupeSanguin(patient.groupeSanguin)}</dd></div>
          <div><dt className="text-(--color-ink-600)">Allergies</dt><dd className="font-semibold">{patient.allergies || 'Aucune déclarée'}</dd></div>
          <div className="sm:col-span-2"><dt className="text-(--color-ink-600)">À signaler aux secours</dt><dd className="font-semibold">{patient.conditionsUrgence || 'Rien de renseigné'}</dd></div>
          <div className="sm:col-span-2">
            <dt className="text-(--color-ink-600)">Proche à prévenir</dt>
            <dd className="font-semibold">
              {patient.contactUrgenceTelephone
                ? `${patient.contactUrgenceNom ? `${patient.contactUrgenceNom} — ` : ''}${patient.contactUrgenceTelephone}`
                : 'Aucun — ajoutez-en un pour qu\'il soit prévenu en cas d\'accident'}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}
