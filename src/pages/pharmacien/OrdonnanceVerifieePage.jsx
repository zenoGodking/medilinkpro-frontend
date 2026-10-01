import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, ShieldX, CheckCircle2, AlertTriangle, ArrowLeft, Pill } from 'lucide-react';
import { verifierOrdonnance, delivrerOrdonnance } from '../../api/pharmacie';
import { Card, Button, Spinner, PageHeader } from '../../components/ui';

const date = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
const dateHeure = (d) => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default function OrdonnanceVerifieePage() {
  const { jeton } = useParams();
  const [o, setO] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [confirmer, setConfirmer] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    verifierOrdonnance(jeton).then(setO).catch((err) => setErreur(err.response?.status === 404
      ? err.response.data.message : "Vérification impossible pour le moment."));
  }, [jeton]);

  async function delivrer() {
    setEnvoi(true);
    try {
      setO(await delivrerOrdonnance(jeton));
      setMessage('Ordonnance délivrée et enregistrée.');
    } catch (err) {
      setMessage(null);
      setErreur(err.response?.data?.message || 'Délivrance impossible.');
    } finally {
      setEnvoi(false);
      setConfirmer(false);
    }
  }

  const retour = (
    <Link to="/pharmacien" className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-ink-600) hover:text-(--color-petrol-600)">
      <ArrowLeft size={15} /> Scanner une autre ordonnance
    </Link>
  );

  if (!o && !erreur) return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  if (!o) {
    return (
      <div className="space-y-4 max-w-xl">
        {retour}
        <Card className="p-6 flex items-start gap-3 border-(--color-clay-500)/40">
          <ShieldX size={28} className="text-(--color-clay-500) shrink-0" />
          <div>
            <p className="font-display font-semibold text-(--color-clay-500)">Ordonnance non reconnue</p>
            <p className="text-sm text-(--color-ink-600) mt-1">{erreur}</p>
          </div>
        </Card>
      </div>
    );
  }

  const delivrable = !o.delivree && !o.expiree;
  return (
    <div className="space-y-5 max-w-2xl">
      {retour}
      <PageHeader title="Ordonnance vérifiée" description={`Émise le ${date(o.dateEmission)} · valable jusqu'au ${date(o.dateExpiration)}`} />

      {o.delivree ? (
        <p className={`flex items-start gap-2 text-sm rounded-xl px-4 py-3 ${message ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-clay-100) text-(--color-clay-500)'}`}>
          {message ? <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> : <AlertTriangle size={17} className="mt-0.5 shrink-0" />}
          <span>{message ? `${message} ` : 'Déjà délivrée : ne pas délivrer à nouveau. '}Délivrée le {dateHeure(o.dateDelivrance)} par {o.delivreePar}.</span>
        </p>
      ) : o.expiree ? (
        <p className="flex items-start gap-2 text-sm rounded-xl px-4 py-3 bg-(--color-clay-100) text-(--color-clay-500)">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" /> Ordonnance expirée le {date(o.dateExpiration)} : le patient doit consulter à nouveau.
        </p>
      ) : (
        <p className="flex items-center gap-2 text-sm rounded-xl px-4 py-3 bg-(--color-sage-100) text-(--color-sage-500)">
          <ShieldCheck size={17} /> Ordonnance authentique, valide et pas encore délivrée.
        </p>
      )}
      {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}

      <Card className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-(--color-ink-600)">Patient (vérifiez son identité)</p>
            <p className="font-semibold text-(--color-ink-900)">{o.patientPrenom} {o.patientNom}</p>
            {o.patientDateNaissance && <p className="text-(--color-ink-600)">Ne(e) le {date(o.patientDateNaissance)}</p>}
          </div>
          <div>
            <p className="text-xs text-(--color-ink-600)">Prescripteur</p>
            <p className="font-semibold text-(--color-ink-900)">Dr {o.medecinNomComplet}</p>
            <p className="text-(--color-ink-600)">{[o.medecinSpecialite, o.medecinNumeroOrdre && `Ordre n° ${o.medecinNumeroOrdre}`].filter(Boolean).join(' · ')}</p>
          </div>
        </div>
        <div className="rounded-xl bg-(--color-petrol-50) p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-(--color-petrol-600)"><Pill size={13} /> Médicaments</p>
          <p className="text-(--color-ink-900) whitespace-pre-line mt-1">{o.medicaments}</p>
          {o.posologie && <p className="text-sm text-(--color-ink-600) whitespace-pre-line mt-2">Posologie : {o.posologie}</p>}
        </div>

        {delivrable && (confirmer ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-(--color-ink-600)">Confirmer la délivrance ? Elle ne pourra plus être délivrée ailleurs.</span>
            <Button onClick={delivrer} disabled={envoi}>{envoi ? 'Enregistrement...' : 'Oui, délivrer'}</Button>
            <Button variant="ghost" onClick={() => setConfirmer(false)}>Annuler</Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => setConfirmer(true)}><CheckCircle2 size={16} /> Marquer comme délivrée</Button>
        ))}
      </Card>
    </div>
  );
}
