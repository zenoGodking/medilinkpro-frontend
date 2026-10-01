import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarHeart, MapPin, Video, Building2, X, Info, Star, CalendarClock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getRendezVousByPatient, updateStatutRendezVous, donnerAvis } from '../../api/rendezVous';
import { Card, Button, Spinner, EmptyState, StatutBadge, Etoiles, Textarea } from '../../components/ui';

function formatDateHeure(iso) {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

/** Formulaire d'avis sur le medecin, affiche sous un rendez-vous effectue. */
function FormulaireAvis({ rdv, onEnvoye }) {
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function envoyer(e) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      await donnerAvis(rdv.id, { note, commentaire });
      onEnvoye();
    } catch (err) {
      setErreur(err.response?.data?.message || "L'avis n'a pas pu être enregistré.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form onSubmit={envoyer} className="mt-4 pt-4 border-t border-(--color-petrol-100) space-y-3">
      <p className="text-sm font-semibold text-(--color-ink-900)">Comment s'est passé votre rendez-vous avec le Dr {rdv.medecinNomComplet} ?</p>
      <Etoiles valeur={note} onChange={setNote} taille={26} />
      <Textarea rows={2} maxLength={1000} placeholder="Votre commentaire (facultatif, visible des autres patients)"
        value={commentaire} onChange={(e) => setCommentaire(e.target.value)} />
      {erreur && <p className="text-sm text-(--color-clay-500)">{erreur}</p>}
      <Button type="submit" variant="amber" disabled={!note || envoi}>{envoi ? 'Envoi...' : 'Publier mon avis'}</Button>
    </form>
  );
}

export default function RendezVousListPage() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [avisOuvert, setAvisOuvert] = useState(null);
  // Une teleconsultation reste joignable jusqu'a 2 h apres son heure (fenetre de la salle cote serveur).
  const [maintenant] = useState(() => Date.now());

  const charger = useCallback(async () => {
    try {
      const data = await getRendezVousByPatient(user.userId);
      data.sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));
      setRendezVous(data);
    } catch {
      setRendezVous([]);
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    let annule = false;
    getRendezVousByPatient(user.userId)
      .then((data) => {
        if (annule) return;
        data.sort((a, b) => new Date(b.dateHeure) - new Date(a.dateHeure));
        setRendezVous(data);
      })
      .catch(() => { if (!annule) setRendezVous([]); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [user.userId]);

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await updateStatutRendezVous(id, 'ANNULE');
      await charger();
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-(--color-petrol-700)">Mes rendez-vous</h1>
          <p className="text-(--color-ink-600) mt-1">Retrouvez l'historique et vos prochains rendez-vous.</p>
        </div>
        <Link to="/patient/recherche">
          <Button variant="amber">Nouveau rendez-vous</Button>
        </Link>
      </div>

      {rendezVous.length === 0 ? (
        <Card>
          <EmptyState
            icon={CalendarHeart}
            title="Aucun rendez-vous"
            description="Vous n'avez encore pris aucun rendez-vous."
            action={<Link to="/patient/recherche"><Button variant="amber">Trouver un spécialiste</Button></Link>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {rendezVous.map((r) => {
            const { jour, heure } = formatDateHeure(r.dateHeure);
            const debut = new Date(r.dateHeure).getTime();
            const isPast = debut < maintenant;
            const canCancel = !isPast && (r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRME');
            const peutRejoindre = r.type === 'TELECONSULTATION' && r.statut === 'CONFIRME' && debut > maintenant - 2 * 3600 * 1000;
            const peutNoter = !r.avisDonne && (r.statut === 'TERMINE' || (r.statut === 'CONFIRME' && isPast));
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-semibold text-(--color-ink-900) capitalize">{jour}</p>
                      <StatutBadge statut={r.statut} />
                    </div>
                    <p className="text-sm text-(--color-ink-600) mt-0.5">{heure} · Dr {r.medecinNomComplet}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-(--color-ink-600) flex-wrap">
                      <span className="flex items-center gap-1">
                        {r.type === 'TELECONSULTATION' ? <Video size={13} /> : <Building2 size={13} />}
                        {r.type === 'TELECONSULTATION' ? 'Téléconsultation' : 'Consultation au cabinet'}
                      </span>
                      {r.etablissementNom && <span className="flex items-center gap-1"><MapPin size={13} /> {r.etablissementNom}</span>}
                      {r.statut === 'CONFIRME' && r.codeConfirmation && <span>Code : <strong>{r.codeConfirmation}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {peutRejoindre && (
                      <Link to={`/teleconsultation/${r.id}`}><Button><Video size={15} /> Rejoindre</Button></Link>
                    )}
                    {peutNoter && avisOuvert !== r.id && (
                      <Button variant="ghost" onClick={() => setAvisOuvert(r.id)}><Star size={15} /> Donner mon avis</Button>
                    )}
                    {canCancel && (
                      <Button variant="danger" onClick={() => handleCancel(r.id)} disabled={cancellingId === r.id}>
                        <X size={15} /> {cancellingId === r.id ? 'Annulation...' : 'Annuler'}
                      </Button>
                    )}
                  </div>
                </div>

                {r.statut === 'EN_ATTENTE' && (
                  <p className="mt-3 flex items-start gap-2 text-sm text-(--color-ink-600) bg-(--color-petrol-50) rounded-xl px-3.5 py-2.5">
                    <Info size={15} className="mt-0.5 shrink-0 text-(--color-petrol-400)" />
                    Le médecin doit confirmer votre demande. Vous serez notifié(e) de sa réponse.
                  </p>
                )}
                {r.dateHeureInitiale && r.statut !== 'REFUSE' && (
                  <p className="mt-3 flex items-start gap-2 text-sm text-(--color-amber-500) bg-(--color-amber-400)/10 rounded-xl px-3.5 py-2.5">
                    <CalendarClock size={15} className="mt-0.5 shrink-0" />
                    Reporté par le médecin (demande initiale : {formatDateHeure(r.dateHeureInitiale).jour} à {formatDateHeure(r.dateHeureInitiale).heure})
                    {r.motifMedecin ? ` — « ${r.motifMedecin} »` : ''}
                  </p>
                )}
                {r.statut === 'REFUSE' && (
                  <p className="mt-3 text-sm text-(--color-clay-500) bg-(--color-clay-100) rounded-xl px-3.5 py-2.5">
                    Le médecin ne peut pas vous recevoir à cet horaire{r.motifMedecin ? ` : « ${r.motifMedecin} »` : '.'}{' '}
                    <Link to={`/patient/rendez-vous/nouveau/${r.medecinId}`} className="font-semibold underline">Choisir un autre créneau</Link>
                  </p>
                )}
                {avisOuvert === r.id && (
                  <FormulaireAvis rdv={r} onEnvoye={() => { setAvisOuvert(null); charger(); }} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
