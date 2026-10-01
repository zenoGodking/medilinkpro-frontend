import { useEffect, useState } from 'react';
import { CalendarClock, Plus, Trash2, Save, Info, CalendarOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getDisponibilites, definirSemaine, ajouterAbsence, supprimerAbsence,
} from '../../api/disponibilites';
import { Card, Button, Spinner, PageHeader, FieldLabel, TextInput, Select } from '../../components/ui';
import { JOURS } from '../../utils/calendrier';

const DUREES = [15, 20, 30, 45, 60];

function formatDate(iso) {
  return new Date(`${iso}T00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

function nombreCreneaux(p) {
  if (!p.heureDebut || !p.heureFin) return 0;
  const [h1, m1] = p.heureDebut.split(':').map(Number);
  const [h2, m2] = p.heureFin.split(':').map(Number);
  const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
  return minutes > 0 ? Math.floor(minutes / p.dureeCreneauMinutes) : 0;
}

/**
 * Semaine type du medecin (plages horaires par jour, duree des creneaux) et absences.
 * Les patients ne peuvent reserver que sur les creneaux generes a partir de ces plages.
 */
export default function MedecinDisponibilitesPage() {
  const { user } = useAuth();
  const [plages, setPlages] = useState([]);
  const [parDefaut, setParDefaut] = useState(false);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [absenceForm, setAbsenceForm] = useState({ dateDebut: '', dateFin: '', motif: '' });
  const [absenceErreur, setAbsenceErreur] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getDisponibilites(user.userId)
      .then((d) => {
        if (cancelled) return;
        setPlages(d.plages.map((p, i) => ({ ...p, cle: i })));
        setParDefaut(d.parDefaut);
        setAbsences(d.absences);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user.userId]);

  function ajouterPlage(jour) {
    setPlages((prev) => [...prev, {
      cle: Date.now() + Math.random(), jourSemaine: jour, heureDebut: '08:00', heureFin: '12:00', dureeCreneauMinutes: 30,
    }]);
    setMessage(null);
  }

  function modifier(cle, champ, valeur) {
    setPlages((prev) => prev.map((p) => (p.cle === cle ? { ...p, [champ]: valeur } : p)));
    setMessage(null);
  }

  function retirer(cle) {
    setPlages((prev) => prev.filter((p) => p.cle !== cle));
    setMessage(null);
  }

  async function enregistrer() {
    setSaving(true);
    setMessage(null);
    try {
      const d = await definirSemaine(plages.map(({ jourSemaine, heureDebut, heureFin, dureeCreneauMinutes }) => ({
        jourSemaine, heureDebut, heureFin, dureeCreneauMinutes: Number(dureeCreneauMinutes),
      })));
      setPlages(d.plages.map((p, i) => ({ ...p, cle: i })));
      setParDefaut(d.parDefaut);
      setMessage({ ok: true, texte: 'Disponibilités enregistrées. Les patients voient vos nouveaux créneaux.' });
    } catch (err) {
      setMessage({ ok: false, texte: err.response?.data?.message || "L'enregistrement a échoué." });
    } finally {
      setSaving(false);
    }
  }

  async function handleAjouterAbsence(e) {
    e.preventDefault();
    setAbsenceErreur(null);
    try {
      const a = await ajouterAbsence({ ...absenceForm, motif: absenceForm.motif || null });
      setAbsences((prev) => [...prev, a].sort((x, y) => x.dateDebut.localeCompare(y.dateDebut)));
      setAbsenceForm({ dateDebut: '', dateFin: '', motif: '' });
    } catch (err) {
      setAbsenceErreur(err.response?.data?.message || "Impossible d'ajouter cette absence.");
    }
  }

  async function handleSupprimerAbsence(id) {
    await supprimerAbsence(id);
    setAbsences((prev) => prev.filter((a) => a.id !== id));
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes disponibilités"
        description="Définissez vos heures de consultation : les patients réservent uniquement sur ces créneaux."
        action={<Button onClick={enregistrer} disabled={saving}><Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer ma semaine'}</Button>}
      />

      {parDefaut && (
        <div className="flex items-start gap-2 text-sm bg-(--color-petrol-50) text-(--color-petrol-600) rounded-xl px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0" />
          Vous n'avez pas encore défini votre semaine : les heures ouvrables par défaut s'appliquent
          (lundi-vendredi, 08:00-12:00 et 14:00-17:00). Ajustez-les puis enregistrez.
        </div>
      )}
      {message && (
        <p className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 ${message.ok
          ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-clay-100) text-(--color-clay-500)'}`}>
          {message.ok && <CheckCircle2 size={16} />} {message.texte}
        </p>
      )}

      <div className="space-y-3">
        {JOURS.map((jour) => {
          const duJour = plages.filter((p) => p.jourSemaine === jour.code);
          return (
            <Card key={jour.code} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-display font-semibold text-(--color-ink-900) w-24">{jour.long}</p>
                {duJour.length === 0 && <p className="text-sm text-(--color-ink-300) flex-1">Ne consulte pas</p>}
                <Button variant="ghost" className="!px-3 !py-1.5 ml-auto" onClick={() => ajouterPlage(jour.code)}>
                  <Plus size={15} /> Plage
                </Button>
              </div>
              {duJour.length > 0 && (
                <div className="mt-3 space-y-2">
                  {duJour.map((p) => (
                    <div key={p.cle} className="flex flex-wrap items-end gap-2">
                      <div className="w-28">
                        <FieldLabel>De</FieldLabel>
                        <TextInput type="time" value={p.heureDebut} onChange={(e) => modifier(p.cle, 'heureDebut', e.target.value)} />
                      </div>
                      <div className="w-28">
                        <FieldLabel>A</FieldLabel>
                        <TextInput type="time" value={p.heureFin} onChange={(e) => modifier(p.cle, 'heureFin', e.target.value)} />
                      </div>
                      <div className="w-32">
                        <FieldLabel>Créneaux de</FieldLabel>
                        <Select value={p.dureeCreneauMinutes} onChange={(e) => modifier(p.cle, 'dureeCreneauMinutes', Number(e.target.value))}>
                          {DUREES.map((d) => <option key={d} value={d}>{d} min</option>)}
                        </Select>
                      </div>
                      <p className="text-xs text-(--color-ink-600) pb-3">{nombreCreneaux(p)} créneau(x)</p>
                      <button
                        type="button"
                        onClick={() => retirer(p.cle)}
                        className="p-2.5 mb-0.5 rounded-xl text-(--color-clay-500) hover:bg-(--color-clay-100)"
                        title="Retirer cette plage"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <section>
        <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-3 flex items-center gap-2">
          <CalendarOff size={19} className="text-(--color-petrol-600)" /> Absences et congés
        </h2>
        <Card className="p-5 space-y-4">
          <form onSubmit={handleAjouterAbsence} className="flex flex-wrap items-end gap-3">
            <div>
              <FieldLabel>Du</FieldLabel>
              <TextInput type="date" required value={absenceForm.dateDebut}
                onChange={(e) => setAbsenceForm((f) => ({ ...f, dateDebut: e.target.value, dateFin: f.dateFin || e.target.value }))} />
            </div>
            <div>
              <FieldLabel>Au (inclus)</FieldLabel>
              <TextInput type="date" required min={absenceForm.dateDebut} value={absenceForm.dateFin}
                onChange={(e) => setAbsenceForm((f) => ({ ...f, dateFin: e.target.value }))} />
            </div>
            <div className="flex-1 min-w-40">
              <FieldLabel>Motif (optionnel)</FieldLabel>
              <TextInput value={absenceForm.motif} placeholder="Congés, congrès..."
                onChange={(e) => setAbsenceForm((f) => ({ ...f, motif: e.target.value }))} />
            </div>
            <Button type="submit" variant="amber"><Plus size={15} /> Ajouter</Button>
          </form>
          {absenceErreur && <p className="text-sm text-(--color-clay-500)">{absenceErreur}</p>}
          {absences.length === 0 ? (
            <p className="text-sm text-(--color-ink-300)">Aucune absence prévue.</p>
          ) : (
            <ul className="divide-y divide-(--color-petrol-100)">
              {absences.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span>
                    <span className="font-medium text-(--color-ink-900)">
                      {a.dateDebut === a.dateFin ? formatDate(a.dateDebut) : `${formatDate(a.dateDebut)} → ${formatDate(a.dateFin)}`}
                    </span>
                    {a.motif && <span className="text-(--color-ink-600)"> · {a.motif}</span>}
                  </span>
                  <button type="button" onClick={() => handleSupprimerAbsence(a.id)}
                    className="p-1.5 rounded-lg text-(--color-clay-500) hover:bg-(--color-clay-100)" title="Supprimer">
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <p className="flex items-center gap-1.5 text-xs text-(--color-ink-600)">
        <CalendarClock size={13} /> Les rendez-vous déjà pris restent valables si vous modifiez votre semaine.
      </p>
    </div>
  );
}
