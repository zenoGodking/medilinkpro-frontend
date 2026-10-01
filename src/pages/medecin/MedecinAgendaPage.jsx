import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarHeart, MapPin, Video, Building2, Check, X, CalendarClock, UserX, CheckCircle2, FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getRendezVousByMedecin, updateStatutRendezVous, accepterRendezVous, refuserRendezVous, reporterRendezVous,
} from '../../api/rendezVous';
import { Card, Button, Spinner, EmptyState, StatutBadge, PageHeader, TextInput } from '../../components/ui';
import SelecteurCreneau from '../../components/SelecteurCreneau';
import { heureDe } from '../../utils/calendrier';

function formatDateHeure(iso) {
  const d = new Date(iso);
  return {
    jour: d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };
}

const ONGLETS = [
  { id: 'demandes', libelle: 'À traiter' },
  { id: 'avenir', libelle: 'À venir' },
  { id: 'passes', libelle: 'Passés' },
];

/**
 * Agenda du medecin : il accepte, reporte (sur un creneau libre de son calendrier) ou refuse les
 * demandes ; le patient est notifie a chaque decision. Les rendez-vous passes sont clotures
 * (effectue / absence) et les teleconsultations rejointes d'ici.
 */
export default function MedecinAgendaPage() {
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onglet, setOnglet] = useState('demandes');
  const [enCours, setEnCours] = useState(null);
  const [action, setAction] = useState(null); // { id, type: 'refuser' | 'reporter' }
  const [motif, setMotif] = useState('');
  const [creneau, setCreneau] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [maintenant] = useState(() => Date.now());

  const charger = useCallback(async () => {
    try {
      const data = await getRendezVousByMedecin(user.userId);
      data.sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
      setRendezVous(data);
    } catch {
      setRendezVous([]);
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    let annule = false;
    getRendezVousByMedecin(user.userId)
      .then((data) => {
        if (annule) return;
        data.sort((a, b) => new Date(a.dateHeure) - new Date(b.dateHeure));
        setRendezVous(data);
      })
      .catch(() => { if (!annule) setRendezVous([]); })
      .finally(() => { if (!annule) setLoading(false); });
    return () => { annule = true; };
  }, [user.userId]);

  async function executer(id, operation) {
    setEnCours(id);
    setErreur(null);
    try {
      await operation();
      setAction(null);
      setMotif('');
      setCreneau(null);
      await charger();
    } catch (err) {
      setErreur(err.response?.data?.message || "L'opération a échoué.");
    } finally {
      setEnCours(null);
    }
  }

  function ouvrirAction(id, type) {
    setAction({ id, type });
    setMotif('');
    setCreneau(null);
    setErreur(null);
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner className="w-7 h-7" /></div>;
  }

  const estPasse = (r) => new Date(r.dateHeure).getTime() < maintenant;
  const listes = {
    demandes: rendezVous.filter((r) => r.statut === 'EN_ATTENTE' && !estPasse(r)),
    avenir: rendezVous.filter((r) => r.statut === 'CONFIRME' && !estPasse(r)),
    passes: rendezVous.filter((r) => estPasse(r) || !['EN_ATTENTE', 'CONFIRME'].includes(r.statut)).reverse(),
  };
  const liste = listes[onglet];

  return (
    <div className="space-y-6">
      <PageHeader title="Mon agenda" description="Acceptez, reportez ou refusez les demandes : le patient est notifié de chaque décision." />

      <div className="flex gap-2 flex-wrap">
        {ONGLETS.map((o) => (
          <button key={o.id} type="button" onClick={() => setOnglet(o.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${onglet === o.id
              ? 'bg-(--color-petrol-600) text-white' : 'bg-white border border-(--color-petrol-100) text-(--color-ink-600) hover:bg-(--color-petrol-50)'}`}>
            {o.libelle}
            {listes[o.id].length > 0 && o.id !== 'passes' && (
              <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${onglet === o.id ? 'bg-white/20' : 'bg-(--color-amber-400)/25 text-(--color-amber-500)'}`}>
                {listes[o.id].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {erreur && <p className="text-sm text-(--color-clay-500) bg-(--color-clay-100) rounded-xl px-4 py-3">{erreur}</p>}

      {liste.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarHeart} title={onglet === 'demandes' ? 'Aucune demande en attente' : 'Aucun rendez-vous'}
            description={onglet === 'demandes' ? 'Les nouvelles demandes de vos patients apparaîtront ici.' : undefined} />
        </Card>
      ) : (
        <div className="space-y-3">
          {liste.map((r) => {
            const { jour, heure } = formatDateHeure(r.dateHeure);
            const ouvert = action?.id === r.id;
            const passe = estPasse(r);
            const peutRejoindre = r.type === 'TELECONSULTATION' && r.statut === 'CONFIRME'
              && new Date(r.dateHeure).getTime() > maintenant - 2 * 3600 * 1000;
            return (
              <Card key={r.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-semibold text-(--color-ink-900) capitalize">{jour}</p>
                      <StatutBadge statut={r.statut} />
                    </div>
                    <p className="text-sm text-(--color-ink-600) mt-0.5">
                      {heure} · <Link to={`/medecin/patients/${r.patientId}`} className="font-medium hover:underline">{r.patientNomComplet}</Link>
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-(--color-ink-600) flex-wrap">
                      <span className="flex items-center gap-1">
                        {r.type === 'TELECONSULTATION' ? <Video size={13} /> : <Building2 size={13} />}
                        {r.type === 'TELECONSULTATION' ? 'Téléconsultation' : 'Consultation au cabinet'}
                      </span>
                      {r.etablissementNom && <span className="flex items-center gap-1"><MapPin size={13} /> {r.etablissementNom}</span>}
                      {r.dateHeureInitiale && <span className="flex items-center gap-1"><CalendarClock size={13} /> reporté</span>}
                    </div>
                  </div>

                  {!ouvert && (
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      {r.statut === 'EN_ATTENTE' && !passe && (
                        <Button disabled={enCours === r.id} onClick={() => executer(r.id, () => accepterRendezVous(r.id))}>
                          <Check size={15} /> Accepter
                        </Button>
                      )}
                      {peutRejoindre && (
                        <Link to={`/teleconsultation/${r.id}`}><Button><Video size={15} /> Rejoindre</Button></Link>
                      )}
                      {['EN_ATTENTE', 'CONFIRME'].includes(r.statut) && !passe && (
                        <>
                          <Button variant="ghost" onClick={() => ouvrirAction(r.id, 'reporter')}><CalendarClock size={15} /> Reporter</Button>
                          <Button variant="danger" onClick={() => ouvrirAction(r.id, 'refuser')}><X size={15} /> {r.statut === 'EN_ATTENTE' ? 'Refuser' : 'Annuler'}</Button>
                        </>
                      )}
                      {r.statut === 'CONFIRME' && passe && (
                        <>
                          <Button variant="ghost" disabled={enCours === r.id} onClick={() => executer(r.id, () => updateStatutRendezVous(r.id, 'TERMINE'))}>
                            <CheckCircle2 size={15} /> Effectué
                          </Button>
                          <Button variant="danger" disabled={enCours === r.id} onClick={() => executer(r.id, () => updateStatutRendezVous(r.id, 'NO_SHOW'))}>
                            <UserX size={15} /> Absent
                          </Button>
                        </>
                      )}
                      {r.statut === 'TERMINE' && (
                        <Link to={`/medecin/patients/${r.patientId}`}><Button variant="ghost"><FileText size={15} /> Carnet</Button></Link>
                      )}
                    </div>
                  )}
                </div>

                {r.motifMedecin && !ouvert && (
                  <p className="mt-3 text-xs text-(--color-ink-600)">Motif communiqué au patient : « {r.motifMedecin} »</p>
                )}

                {ouvert && (
                  <div className="mt-4 pt-4 border-t border-(--color-petrol-100) space-y-3">
                    {action.type === 'reporter' && (
                      <>
                        <p className="text-sm font-semibold text-(--color-ink-900)">Choisissez le nouveau créneau</p>
                        <SelecteurCreneau medecinId={user.userId} choisi={creneau} onChoisir={setCreneau} />
                      </>
                    )}
                    <TextInput
                      value={motif}
                      maxLength={500}
                      onChange={(e) => setMotif(e.target.value)}
                      placeholder={action.type === 'reporter' ? 'Motif du report (facultatif, transmis au patient)' : 'Motif (facultatif, transmis au patient)'}
                    />
                    <div className="flex justify-end gap-2 flex-wrap">
                      <Button variant="ghost" onClick={() => setAction(null)}>Retour</Button>
                      {action.type === 'reporter' ? (
                        <Button disabled={!creneau || enCours === r.id}
                          onClick={() => executer(r.id, () => reporterRendezVous(r.id, creneau.debut, motif))}>
                          <CalendarClock size={15} /> Reporter{creneau ? ` au ${new Date(creneau.debut).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à ${heureDe(creneau.debut)}` : ''}
                        </Button>
                      ) : (
                        <Button variant="danger" disabled={enCours === r.id} onClick={() => executer(r.id, () => refuserRendezVous(r.id, motif))}>
                          <X size={15} /> Confirmer {r.statut === 'EN_ATTENTE' ? 'le refus' : "l'annulation"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
