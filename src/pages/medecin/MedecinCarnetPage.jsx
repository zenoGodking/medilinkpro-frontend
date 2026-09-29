import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, PenLine, Plus, HeartCrack, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getCarnet } from '../../api/carnets';
import { declarerDeces } from '../../api/patients';
import { Card, Button, Spinner, PageHeader, EmptyState, FieldLabel, TextInput, Textarea } from '../../components/ui';
import CarnetSections from '../../components/CarnetSections';
import SuiviSante from '../../components/suivi/SuiviSante';

const MESSAGES_NOTIFICATION = {
  ENVOYE: 'Le proche a ete informe par SMS.',
  NON_ENVOYE_AUCUN_FOURNISSEUR: "Le message au proche est enregistre, mais aucun service SMS n'est encore configure : il n'a pas ete envoye.",
  ECHEC: "L'envoi du SMS au proche a echoue.",
};

/**
 * Declaration de deces : ouverte a tout medecin, avec confirmation explicite car
 * elle desactive le compte du patient et previent son proche.
 */
function DeclarationDeces({ patient, onDeclare }) {
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({ dateDeces: new Date().toISOString().slice(0, 10), circonstances: '' });
  const [confirmation, setConfirmation] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);
  const nomAttendu = `${patient.prenom} ${patient.nom}`;

  async function handleSubmit(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      onDeclare(await declarerDeces(patient.id, { dateDeces: form.dateDeces, circonstances: form.circonstances || null }));
    } catch (err) {
      setErreur(err.response?.data?.message || 'La declaration a echoue.');
    } finally {
      setEnvoi(false);
    }
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-(--color-ink-600) hover:text-(--color-clay-500)"
      >
        <HeartCrack size={15} /> Declarer le deces de ce patient
      </button>
    );
  }

  return (
    <Card className="p-5 border-(--color-clay-500)/40">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-2 text-sm text-(--color-clay-500)">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <p>
            Cette declaration desactive le compte du patient, annule ses demandes en cours et previent son proche
            {patient.contactUrgenceTelephone ? ` (${patient.contactUrgenceTelephone})` : ' (aucun numero renseigne)'}.
            Elle est enregistree a votre nom.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <FieldLabel>Date du deces</FieldLabel>
            <TextInput type="date" required max={new Date().toISOString().slice(0, 10)} value={form.dateDeces}
              onChange={(e) => setForm((f) => ({ ...f, dateDeces: e.target.value }))} />
          </div>
          <div>
            <FieldLabel>Recopiez le nom du patient pour confirmer</FieldLabel>
            <TextInput placeholder={nomAttendu} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </div>
        </div>
        <div>
          <FieldLabel>Circonstances (optionnel)</FieldLabel>
          <Textarea rows={2} value={form.circonstances} onChange={(e) => setForm((f) => ({ ...f, circonstances: e.target.value }))} />
        </div>
        {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
        <div className="flex gap-2">
          <Button type="submit" variant="danger" disabled={envoi || confirmation.trim().toLowerCase() !== nomAttendu.toLowerCase()}>
            {envoi ? 'Enregistrement...' : 'Confirmer le deces'}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOuvert(false)}>Annuler</Button>
        </div>
      </form>
    </Card>
  );
}

export default function MedecinCarnetPage() {
  const { patientId } = useParams();
  const [carnet, setCarnet] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [resultatDeces, setResultatDeces] = useState(null);

  const charger = useCallback(() => getCarnet(patientId)
    .then(setCarnet)
    .catch(() => setErreur('Impossible de charger ce carnet.')), [patientId]);

  useEffect(() => { charger(); }, [charger]);

  const retour = (
    <Link to="/medecin/patients" className="inline-flex items-center gap-1.5 text-sm font-medium text-(--color-ink-600) hover:text-(--color-petrol-600)">
      <ArrowLeft size={15} /> Tous les carnets
    </Link>
  );

  if (erreur) return <div className="space-y-4">{retour}<EmptyState icon={Lock} title="Carnet indisponible" description={erreur} /></div>;
  if (!carnet) return <div className="flex justify-center py-16"><Spinner className="w-6 h-6" /></div>;

  const p = carnet.patient;
  return (
    <div className="space-y-6 max-w-4xl">
      {retour}
      <PageHeader
        title={`${p.prenom} ${p.nom}`}
        description={p.decede ? `Decede le ${new Date(p.dateDeces).toLocaleDateString('fr-FR')}` : 'Carnet medical'}
        action={carnet.ecritureAutorisee ? (
          <Link to={`/medecin/consultations?patient=${p.id}`}>
            <Button variant="amber"><Plus size={16} /> Nouvelle consultation</Button>
          </Link>
        ) : null}
      />

      {resultatDeces && (
        <div className="flex items-start gap-2 bg-(--color-petrol-50) text-(--color-petrol-700) text-sm rounded-xl px-4 py-3">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>
            Deces enregistre.{' '}
            {resultatDeces.procheTelephone
              ? MESSAGES_NOTIFICATION[resultatDeces.statutNotification]
              : "Aucun numero de proche n'etait renseigne : personne n'a ete prevenu automatiquement."}
          </span>
        </div>
      )}

      {carnet.ecritureAutorisee ? (
        <div className="flex items-center gap-2 bg-(--color-sage-100) text-(--color-sage-500) text-sm font-medium rounded-xl px-4 py-3">
          <PenLine size={16} />
          {carnet.motifEcriture === 'AUTORISATION_PATIENT'
            ? 'Le patient vous a autorise a ecrire dans son carnet.'
            : 'Vous avez deja suivi ce patient : vous pouvez ecrire dans son carnet.'}
        </div>
      ) : !p.decede && (
        <div className="flex items-center gap-2 bg-(--color-petrol-50) text-(--color-ink-600) text-sm rounded-xl px-4 py-3">
          <Lock size={16} className="shrink-0" />
          Lecture seule : pour ecrire dans ce carnet, le patient doit vous y autoriser depuis son espace.
        </div>
      )}

      <CarnetSections carnet={carnet} />

      <div>
        <h2 className="font-display font-semibold text-lg text-(--color-ink-900) mb-3">Suivi (mesures, traitements, vaccins, grossesse)</h2>
        <SuiviSante patientId={p.id} peutEcrire={carnet.ecritureAutorisee} />
      </div>

      {!p.decede && (
        <DeclarationDeces
          patient={p}
          onDeclare={(r) => { setResultatDeces(r); charger(); }}
        />
      )}
    </div>
  );
}
