import { useEffect, useState } from 'react';
import { FileText, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getConsultationsByMedecin, createConsultation } from '../../api/consultations';
import { getPatientsEcritureAutorisee } from '../../api/carnets';
import { useSearchParams } from 'react-router-dom';
import {
  Card, Button, Spinner, EmptyState, PageHeader, FieldLabel, TextInput, Textarea, Select,
} from '../../components/ui';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const INITIAL_FORM = { patientId: '', motif: '', diagnostic: '', compteRendu: '', typeConsultation: 'PHYSIQUE' };

export default function MedecinConsultationsPage() {
  const { user } = useAuth();
  // Arrivee depuis un carnet (?patient=...) : formulaire ouvert, patient preselectionne.
  const [searchParams] = useSearchParams();
  const patientPreselectionne = searchParams.get('patient') || '';
  const [consultations, setConsultations] = useState([]);
  const [patientsConnus, setPatientsConnus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(!!patientPreselectionne);
  const [form, setForm] = useState({ ...INITIAL_FORM, patientId: patientPreselectionne });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [data, accessibles] = await Promise.all([
        getConsultationsByMedecin(user.userId),
        getPatientsEcritureAutorisee(),
      ]);
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setConsultations(data);
      // Seuls les patients dans le carnet desquels le medecin peut ecrire.
      setPatientsConnus(accessibles.map((p) => ({ id: p.id, nom: `${p.prenom} ${p.nom}` })));
    } catch {
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.userId]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await createConsultation({
        patientId: form.patientId,
        medecinId: user.userId,
        motif: form.motif,
        diagnostic: form.diagnostic,
        compteRendu: form.compteRendu,
        typeConsultation: form.typeConsultation,
      });
      setForm(INITIAL_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Impossible de creer la consultation.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="w-7 h-7" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultations"
        description="Comptes rendus et diagnostics de vos patients."
        action={
          <Button variant="amber" onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Annuler' : 'Nouvelle consultation'}
          </Button>
        }
      />

      {showForm && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <p className="text-sm text-(--color-clay-500) bg-(--color-clay-100) rounded-xl px-3.5 py-3">{errorMsg}</p>
            )}

            <div>
              <FieldLabel>Patient</FieldLabel>
              <Select required value={form.patientId} onChange={(e) => update('patientId', e.target.value)}>
                <option value="">Selectionner un de vos patients</option>
                {patientsConnus.map((p) => (
                  <option key={p.id} value={p.id}>{p.nom}</option>
                ))}
              </Select>
            </div>

            <div>
              <FieldLabel>Motif</FieldLabel>
              <TextInput value={form.motif} onChange={(e) => update('motif', e.target.value)} placeholder="Douleur thoracique, controle..." />
            </div>

            <div>
              <FieldLabel>Diagnostic</FieldLabel>
              <Textarea rows={2} value={form.diagnostic} onChange={(e) => update('diagnostic', e.target.value)} />
            </div>

            <div>
              <FieldLabel>Compte rendu</FieldLabel>
              <Textarea rows={3} value={form.compteRendu} onChange={(e) => update('compteRendu', e.target.value)} />
            </div>

            <div>
              <FieldLabel>Type</FieldLabel>
              <Select value={form.typeConsultation} onChange={(e) => update('typeConsultation', e.target.value)}>
                <option value="PHYSIQUE">Consultation physique</option>
                <option value="TELECONSULTATION">Teleconsultation</option>
              </Select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Enregistrement...' : 'Enregistrer la consultation'}
            </Button>
          </form>
        </Card>
      )}

      {consultations.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="Aucune consultation enregistree" description="Vos comptes rendus apparaitront ici." />
        </Card>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-display font-semibold text-(--color-ink-900)">{c.patientNomComplet}</p>
                  <p className="text-sm text-(--color-ink-600)">{formatDate(c.date)}</p>
                </div>
              </div>
              {c.motif && <p className="text-sm text-(--color-ink-600) mt-3"><span className="font-medium text-(--color-ink-900)">Motif :</span> {c.motif}</p>}
              {c.diagnostic && <p className="text-sm text-(--color-ink-600) mt-1"><span className="font-medium text-(--color-ink-900)">Diagnostic :</span> {c.diagnostic}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
