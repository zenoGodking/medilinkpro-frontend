import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarPlus, AlertCircle, CheckCircle2, Building2, Video, Clock,
} from 'lucide-react';
import { getMedecin } from '../../api/medecins';
import { createRendezVous } from '../../api/rendezVous';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Spinner } from '../../components/ui';
import { heureDe } from '../../utils/calendrier';
import SelecteurCreneau from '../../components/SelecteurCreneau';
import AvisMedecin from '../../components/AvisMedecin';

/**
 * Prise de rendez-vous sur le calendrier du medecin : le patient choisit le type de consultation
 * puis un creneau libre parmi les heures de consultation publiees (semaine par semaine).
 */
export default function NouveauRendezVousPage() {
  const { medecinId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [medecin, setMedecin] = useState(null);
  const [loadingMedecin, setLoadingMedecin] = useState(true);
  const [type, setType] = useState('PHYSIQUE');
  const [choisi, setChoisi] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [success, setSuccess] = useState(false);
  const [rechargement, setRechargement] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMedecin(medecinId)
      .then((data) => { if (!cancelled) setMedecin(data); })
      .catch(() => { if (!cancelled) setErrorMsg('Médecin introuvable.'); })
      .finally(() => { if (!cancelled) setLoadingMedecin(false); });
    return () => { cancelled = true; };
  }, [medecinId]);

  async function handleSubmit() {
    if (!choisi) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await createRendezVous({
        patientId: user.userId,
        medecinId,
        dateHeure: choisi.debut,
        type,
        etablissementId: type === 'PHYSIQUE' ? medecin?.etablissementId || null : null,
      });
      setSuccess(true);
      setTimeout(() => navigate('/patient/rendez-vous'), 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Ce créneau n'est plus disponible. Choisissez un autre horaire.");
      setChoisi(null);
      setRechargement((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingMedecin) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }


  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/patient/recherche" className="inline-flex items-center gap-1.5 text-sm text-(--color-petrol-600) font-medium mb-5 hover:underline">
        <ArrowLeft size={15} /> Retour à la recherche
      </Link>

      <Card className="p-6">
        {medecin && (
          <div className="mb-5 flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-xl text-(--color-petrol-700)">Dr {medecin.prenom} {medecin.nom}</p>
              <p className="text-sm text-(--color-amber-500) font-medium">{medecin.specialite}</p>
              {medecin.etablissementNom && (
                <p className="text-sm text-(--color-ink-600) mt-1 flex items-center gap-1.5"><Building2 size={14} /> {medecin.etablissementNom}</p>
              )}
            </div>
            {medecin.tarif != null && (
              <p className="text-sm text-(--color-ink-600)">Consultation : <span className="font-semibold text-(--color-ink-900)">{medecin.tarif} FCFA</span></p>
            )}
          </div>
        )}
        {medecin && (
          <details className="mb-5 group">
            <summary className="cursor-pointer text-sm font-medium text-(--color-petrol-600) list-none">
              Avis des patients {medecin.nombreAvis > 0 ? `(${medecin.noteMoyenne?.toFixed(1)}/5 · ${medecin.nombreAvis})` : ''}
            </summary>
            <div className="mt-3"><AvisMedecin medecinId={medecinId} /></div>
          </details>
        )}

        {success ? (
          <div className="flex flex-col items-center text-center py-8">
            <CheckCircle2 size={40} className="text-(--color-sage-500) mb-3" />
            <p className="font-display font-semibold text-lg text-(--color-ink-900)">Demande envoyée !</p>
            <p className="text-sm text-(--color-ink-600) mt-1">Le médecin va la confirmer : vous serez notifié(e). Redirection...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {errorMsg && (
              <div className="flex items-start gap-2 bg-(--color-clay-100) text-(--color-clay-500) text-sm rounded-xl px-3.5 py-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 max-w-md">
              {[
                { valeur: 'PHYSIQUE', label: 'Au cabinet', icon: Building2 },
                { valeur: 'TELECONSULTATION', label: 'Téléconsultation', icon: Video },
              ].map(({ valeur, label, icon: Icon }) => (
                <button
                  key={valeur}
                  type="button"
                  onClick={() => setType(valeur)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${type === valeur
                    ? 'border-(--color-petrol-600) bg-(--color-petrol-50) text-(--color-petrol-700)'
                    : 'border-(--color-petrol-100) text-(--color-ink-600) hover:bg-(--color-petrol-50)'}`}
                >
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>

            <SelecteurCreneau medecinId={medecinId} choisi={choisi} onChoisir={setChoisi} rechargement={rechargement} />

            <div className="flex items-center justify-between gap-3 flex-wrap border-t border-(--color-petrol-100) pt-4">
              <p className="text-sm text-(--color-ink-600) flex items-center gap-1.5">
                <Clock size={15} />
                {choisi
                  ? <>Le <span className="font-semibold text-(--color-ink-900)">
                      {new Date(choisi.debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} a {heureDe(choisi.debut)}
                    </span></>
                  : 'Choisissez un créneau libre'}
              </p>
              <Button onClick={handleSubmit} disabled={!choisi || submitting}>
                <CalendarPlus size={16} />
                {submitting ? 'Envoi...' : 'Demander ce rendez-vous'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
