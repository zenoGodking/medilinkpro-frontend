import { useCallback, useEffect, useState } from 'react';
import { Baby, CalendarCheck2, CalendarClock, Plus } from 'lucide-react';
import { getGrossesses, declarerGrossesse, terminerGrossesse, ajouterVisitePrenatale } from '../../api/suivi';
import { Button, FieldLabel, TextInput, Textarea, Select, Spinner } from '../ui';

const date = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const aujourdHui = () => new Date().toISOString().slice(0, 10);
const VISITE_VIDE = { date: aujourdHui(), poids: '', tensionSystolique: '', tensionDiastolique: '', hauteurUterineCm: '', notes: '' };

function GrossesseEnCours({ g, peutEcrire, medecinAutorise, onMaj }) {
  const [visite, setVisite] = useState(VISITE_VIDE);
  const [fin, setFin] = useState(null);
  const [erreur, setErreur] = useState(null);
  const progression = Math.min(100, ((g.semainesAmenorrhee + g.joursAmenorrhee / 7) / 41) * 100);

  async function envoyerVisite(e) {
    e.preventDefault();
    setErreur(null);
    const num = (v) => (v === '' ? null : Number(String(v).replace(',', '.')));
    try {
      onMaj(await ajouterVisitePrenatale(g.id, {
        date: visite.date, poids: num(visite.poids), tensionSystolique: num(visite.tensionSystolique),
        tensionDiastolique: num(visite.tensionDiastolique), hauteurUterineCm: num(visite.hauteurUterineCm), notes: visite.notes || null,
      }));
      setVisite(VISITE_VIDE);
    } catch (err) {
      setErreur(err.response?.data?.message || "La visite n'a pas pu etre enregistree.");
    }
  }

  async function envoyerFin(e) {
    e.preventDefault();
    try {
      onMaj(await terminerGrossesse(g.id, fin));
      setFin(null);
    } catch (err) {
      setErreur(err.response?.data?.message || 'Impossible de cloturer le suivi.');
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="rounded-xl bg-(--color-petrol-50) p-3">
          <p className="text-xs text-(--color-ink-600)">Age gestationnel</p>
          <p className="font-display font-bold text-2xl text-(--color-petrol-700)">{g.semainesAmenorrhee} SA + {g.joursAmenorrhee} j</p>
          <p className="text-xs text-(--color-ink-600)">{g.trimestre}e trimestre</p>
        </div>
        <div className="rounded-xl bg-(--color-petrol-50) p-3">
          <p className="text-xs text-(--color-ink-600)">Terme prevu</p>
          <p className="font-semibold text-(--color-petrol-700)">{date(g.dateTermePrevue)}</p>
          <p className="text-xs text-(--color-ink-600)">Dernieres regles : {date(g.dateDernieresRegles)}</p>
        </div>
        <div className="rounded-xl bg-(--color-petrol-50) p-3 flex flex-col justify-center">
          <p className="text-xs text-(--color-ink-600) mb-1.5">Progression</p>
          <div className="h-2 rounded-full bg-(--color-petrol-100) overflow-hidden" role="meter" aria-valuemin={0} aria-valuemax={41} aria-valuenow={g.semainesAmenorrhee}>
            <div className="h-full bg-(--color-petrol-600)" style={{ width: `${progression}%` }} />
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-(--color-ink-900) mb-2">Consultations prenatales recommandees (OMS : 8 contacts)</p>
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {g.contactsRecommandes.map((c) => (
            <li key={c.semaine} className={`rounded-lg px-3 py-2 text-xs ${c.passe ? 'bg-(--color-petrol-50) text-(--color-ink-600)' : 'border border-(--color-petrol-100) text-(--color-ink-900)'}`}>
              <span className="flex items-center gap-1 font-semibold">
                {c.passe ? <CalendarCheck2 size={13} /> : <CalendarClock size={13} />} {c.semaine} SA
              </span>
              {new Date(c.datePrevue).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </li>
          ))}
        </ol>
      </div>

      <div>
        <p className="text-sm font-semibold text-(--color-ink-900) mb-2">Visites realisees</p>
        {g.visites.length === 0 ? (
          <p className="text-sm text-(--color-ink-600)">Aucune visite enregistree.</p>
        ) : (
          <ul className="divide-y divide-(--color-petrol-100)">
            {g.visites.map((v) => (
              <li key={v.id} className="py-2.5 text-sm">
                <p className="font-semibold text-(--color-ink-900)">{date(v.date)} · {v.ageGestationnel} · {v.medecinNom}</p>
                <p className="text-(--color-ink-600)">
                  {[v.poids && `Poids ${v.poids} kg`, v.tensionSystolique && `Tension ${v.tensionSystolique}/${v.tensionDiastolique ?? '?'}`,
                    v.hauteurUterineCm && `Hauteur uterine ${v.hauteurUterineCm} cm`].filter(Boolean).join(' · ')}
                </p>
                {v.notes && <p className="text-(--color-ink-600)">{v.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {medecinAutorise && (
        <form onSubmit={envoyerVisite} className="rounded-xl bg-(--color-petrol-50) p-4 space-y-3">
          <p className="text-sm font-semibold text-(--color-ink-900)">Nouvelle consultation prenatale</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div><FieldLabel>Date</FieldLabel><TextInput type="date" required max={aujourdHui()} value={visite.date} onChange={(e) => setVisite((v) => ({ ...v, date: e.target.value }))} /></div>
            <div><FieldLabel>Poids (kg)</FieldLabel><TextInput inputMode="decimal" value={visite.poids} onChange={(e) => setVisite((v) => ({ ...v, poids: e.target.value }))} /></div>
            <div><FieldLabel>Systolique</FieldLabel><TextInput inputMode="numeric" value={visite.tensionSystolique} onChange={(e) => setVisite((v) => ({ ...v, tensionSystolique: e.target.value }))} /></div>
            <div><FieldLabel>Diastolique</FieldLabel><TextInput inputMode="numeric" value={visite.tensionDiastolique} onChange={(e) => setVisite((v) => ({ ...v, tensionDiastolique: e.target.value }))} /></div>
            <div><FieldLabel>Haut. uterine (cm)</FieldLabel><TextInput inputMode="decimal" value={visite.hauteurUterineCm} onChange={(e) => setVisite((v) => ({ ...v, hauteurUterineCm: e.target.value }))} /></div>
          </div>
          <Textarea rows={2} placeholder="Observations" value={visite.notes} onChange={(e) => setVisite((v) => ({ ...v, notes: e.target.value }))} />
          <Button type="submit"><Plus size={15} /> Enregistrer la visite</Button>
        </form>
      )}

      {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}

      {peutEcrire && (fin ? (
        <form onSubmit={envoyerFin} className="rounded-xl border border-(--color-petrol-100) p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <FieldLabel>Fin du suivi</FieldLabel>
              <Select value={fin.statut} onChange={(e) => setFin((f) => ({ ...f, statut: e.target.value }))}>
                <option value="TERMINEE">Accouchement</option>
                <option value="INTERROMPUE">Grossesse interrompue</option>
              </Select>
            </div>
            <div><FieldLabel>Date</FieldLabel><TextInput type="date" required max={aujourdHui()} value={fin.dateFin} onChange={(e) => setFin((f) => ({ ...f, dateFin: e.target.value }))} /></div>
          </div>
          <TextInput placeholder="Precisions (optionnel)" value={fin.issue} onChange={(e) => setFin((f) => ({ ...f, issue: e.target.value }))} />
          <div className="flex gap-2">
            <Button type="submit">Cloturer le suivi</Button>
            <Button type="button" variant="ghost" onClick={() => setFin(null)}>Annuler</Button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setFin({ statut: 'TERMINEE', dateFin: aujourdHui(), issue: '' })}
          className="text-sm font-medium text-(--color-ink-600) hover:text-(--color-petrol-600)">Cloturer ce suivi de grossesse</button>
      ))}
    </div>
  );
}

export default function OngletGrossesse({ patientId, estPatient, peutEcrire }) {
  const [grossesses, setGrossesses] = useState(null);
  const [ddr, setDdr] = useState('');
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(() => getGrossesses(patientId).then(setGrossesses).catch(() => setGrossesses([])), [patientId]);
  useEffect(() => { charger(); }, [charger]);

  async function declarer(e) {
    e.preventDefault();
    setErreur(null);
    try {
      await declarerGrossesse(patientId, ddr);
      setDdr('');
      charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "La grossesse n'a pas pu etre enregistree.");
    }
  }

  if (!grossesses) return <div className="flex justify-center py-8"><Spinner className="w-5 h-5" /></div>;
  const enCours = grossesses.find((g) => g.statut === 'EN_COURS');
  const passees = grossesses.filter((g) => g.statut !== 'EN_COURS');
  const maj = (g) => setGrossesses((prev) => prev.map((x) => (x.id === g.id ? g : x)));

  return (
    <div className="space-y-5">
      {enCours ? (
        <GrossesseEnCours g={enCours} peutEcrire={peutEcrire} medecinAutorise={peutEcrire && !estPatient} onMaj={maj} />
      ) : peutEcrire ? (
        <form onSubmit={declarer} className="rounded-xl bg-(--color-petrol-50) p-4 space-y-3 max-w-md">
          <p className="flex items-center gap-2 text-sm font-semibold text-(--color-ink-900)"><Baby size={16} /> Demarrer un suivi de grossesse</p>
          <div>
            <FieldLabel>Date des dernieres regles</FieldLabel>
            <TextInput type="date" required max={aujourdHui()} value={ddr} onChange={(e) => setDdr(e.target.value)} />
          </div>
          {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
          <Button type="submit">Demarrer le suivi</Button>
        </form>
      ) : (
        <p className="text-sm text-(--color-ink-600)">Aucune grossesse en cours de suivi.</p>
      )}

      {passees.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-(--color-ink-900) mb-1">Grossesses precedentes</p>
          <ul className="text-sm text-(--color-ink-600) space-y-1">
            {passees.map((g) => (
              <li key={g.id}>
                {g.statut === 'TERMINEE' ? 'Accouchement' : 'Grossesse interrompue'} le {date(g.dateFin)} ({g.semainesAmenorrhee} SA)
                {g.issue && ` — ${g.issue}`} · {g.visites.length} visite(s)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
