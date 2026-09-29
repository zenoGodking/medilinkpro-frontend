import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, MapPin, Phone, MessageSquare, Wifi, WifiOff, Clock, CheckCircle2, Star, UndoDot, ClipboardCheck, Send, Lock, Navigation, LocateFixed, LocateOff } from 'lucide-react';
import {
  getAlertesActives, repondreAlerte, retracterAlerte, soumettreCompteRendu,
  getInterventionsEnCours, getNoteMoyenneInfirmier,
} from '../../api/alertes';
import { getToken } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useAlerteSocket } from '../../hooks/useAlerteSocket';
import { usePositionGps } from '../../hooks/usePositionGps';
import NotificationsPushCard from '../../components/NotificationsPushCard';
import { Card, Button, Textarea, Spinner, EmptyState, PageHeader } from '../../components/ui';

/** Petit bip synthetise (Web Audio API) pour signaler une nouvelle alerte sans fichier son externe. */
function jouerBip() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio non disponible (autoplay bloque, navigateur non supporte...) : on ignore silencieusement.
  }
}

function tempsEcoule(dateIso) {
  const secondes = Math.floor((Date.now() - new Date(dateIso).getTime()) / 1000);
  if (secondes < 60) return "a l'instant";
  const minutes = Math.floor(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.floor(minutes / 60);
  return `il y a ${heures} h`;
}

function formatDistance(km) {
  return km == null ? null : `a ${km.toLocaleString('fr-FR')} km`;
}

/** Itineraire vers le patient dans l'application de navigation de l'appareil (Google Maps). */
function lienItineraire(a) {
  if (a.latitude == null) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${a.latitude},${a.longitude}`;
}

function CarteNoteMoyenne({ infirmierId }) {
  const [note, setNote] = useState(null);

  useEffect(() => {
    getNoteMoyenneInfirmier(infirmierId).then(setNote).catch(() => setNote(null));
  }, [infirmierId]);

  if (!note || note.nombreAvis === 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-(--color-petrol-50) text-(--color-petrol-600)">
      <Star size={13} className="fill-(--color-amber-400) text-(--color-amber-400)" />
      {note.moyenne?.toFixed(1)} ({note.nombreAvis} avis)
    </span>
  );
}

export default function InfirmierAlertesPage() {
  const { user } = useAuth();
  const [alertesEnAttente, setAlertesEnAttente] = useState([]);
  const [mesInterventions, setMesInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enCoursId, setEnCoursId] = useState(null);
  const [retractionId, setRetractionId] = useState(null);
  const [compteRendus, setCompteRendus] = useState({});
  const [erreur, setErreur] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const isFirstLoad = useRef(true);
  const occupeeRef = useRef(false);
  const token = useMemo(() => getToken(), []);

  // Une infirmiere ne peut gerer qu'une seule intervention a la fois : tant qu'elle
  // est occupee, on n'affiche/ecoute plus les nouvelles alertes EN_ATTENTE.
  useEffect(() => {
    occupeeRef.current = mesInterventions.length > 0;
  }, [mesInterventions]);

  const chargerAlertesActives = useCallback(async () => {
    try {
      const actives = await getAlertesActives();
      setAlertesEnAttente(actives);
    } catch {
      // Silencieux : la liste se remettra a jour au prochain evenement WebSocket.
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [actives, enCours] = await Promise.all([
          getAlertesActives(),
          getInterventionsEnCours(user.userId),
        ]);
        setAlertesEnAttente(actives);
        setMesInterventions(enCours);
      } finally {
        setLoading(false);
        isFirstLoad.current = false;
      }
    })();
  }, [user.userId]);

  const onAlerteMiseAJour = useCallback((alerte) => {
    if (alerte.statut === 'EN_ATTENTE') {
      // Occupee : on ignore les nouvelles alertes tant que le compte-rendu n'est pas envoye.
      if (occupeeRef.current) return;
      setAlertesEnAttente((prev) => {
        if (prev.some((a) => a.id === alerte.id)) return prev.map((a) => (a.id === alerte.id ? alerte : a));
        if (!isFirstLoad.current) jouerBip();
        return [alerte, ...prev];
      });
      return;
    }

    if (alerte.statut === 'REPONDUE') {
      setAlertesEnAttente((prev) => prev.filter((a) => a.id !== alerte.id));
      setMesInterventions((prev) => {
        if (alerte.infirmierId !== user.userId) return prev.filter((a) => a.id !== alerte.id);
        if (prev.some((a) => a.id === alerte.id)) return prev.map((a) => (a.id === alerte.id ? alerte : a));
        return [alerte, ...prev];
      });
      return;
    }

    // SERVICE_RENDU, TERMINEE ou ANNULEE : l'alerte n'est plus "en cours" pour l'infirmiere.
    setAlertesEnAttente((prev) => prev.filter((a) => a.id !== alerte.id));
    setMesInterventions((prev) => {
      const etaitLaMienne = prev.some((a) => a.id === alerte.id);
      if (etaitLaMienne && alerte.statut === 'TERMINEE' && alerte.note) {
        setConfirmation(`Le patient a note votre intervention : ${alerte.note}/5${alerte.commentaire ? ` - "${alerte.commentaire}"` : ''}`);
        setTimeout(() => setConfirmation(null), 6000);
      }
      const suivante = prev.filter((a) => a.id !== alerte.id);
      // Elle vient d'etre liberee : on rafraichit les alertes en attente qu'on avait ignorees.
      if (etaitLaMienne && suivante.length === 0) chargerAlertesActives();
      return suivante;
    });
  }, [user.userId, chargerAlertesActives]);

  // /topic/alertes : alertes en diffusion generale ; /user/queue/alertes : alertes proposees
  // a cette infirmiere parce qu'elle fait partie des plus proches du patient.
  const subscriptions = useMemo(
    () => [
      { destination: '/topic/alertes', onMessage: onAlerteMiseAJour },
      { destination: '/user/queue/alertes', onMessage: onAlerteMiseAJour },
    ],
    [onAlerteMiseAJour]
  );
  const { connected, publish } = useAlerteSocket(token, subscriptions);

  // Partage continu de la position : sert a recevoir les alertes proches, puis au suivi
  // en temps reel par le patient pendant l'intervention.
  const envoyerPosition = useCallback(
    (p) => publish('/app/infirmiers/position', p),
    [publish]
  );
  const { position, erreur: erreurGps } = usePositionGps(true, envoyerPosition);
  const positionRef = useRef(null);
  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  useEffect(() => {
    // (Re)connexion : renvoie tout de suite la derniere position connue.
    if (connected && positionRef.current) envoyerPosition(positionRef.current);
  }, [connected, envoyerPosition]);

  async function handleRepondre(alerteId) {
    setErreur(null);
    setEnCoursId(alerteId);
    try {
      const alerte = await repondreAlerte(alerteId, user.userId);
      setAlertesEnAttente((prev) => prev.filter((a) => a.id !== alerteId));
      setMesInterventions((prev) => [alerte, ...prev]);
    } catch (err) {
      if (err.response?.status === 409) {
        setErreur(err.response?.data?.message || "Cette alerte n'est plus disponible.");
        chargerAlertesActives();
      } else {
        setErreur('Impossible de repondre a cette alerte pour le moment.');
      }
    } finally {
      setEnCoursId(null);
    }
  }

  async function handleRetracter(alerteId) {
    setErreur(null);
    setEnCoursId(alerteId);
    try {
      await retracterAlerte(alerteId, user.userId);
      setMesInterventions((prev) => prev.filter((a) => a.id !== alerteId));
      chargerAlertesActives();
    } catch {
      setErreur("Impossible de vous retracter de cette intervention pour le moment.");
    } finally {
      setEnCoursId(null);
      setRetractionId(null);
    }
  }

  async function handleEnvoyerCompteRendu(alerteId) {
    const texte = (compteRendus[alerteId] || '').trim();
    if (!texte) return;
    setErreur(null);
    setEnCoursId(alerteId);
    try {
      await soumettreCompteRendu(alerteId, user.userId, texte);
      setMesInterventions((prev) => prev.filter((a) => a.id !== alerteId));
      setCompteRendus((prev) => {
        const suite = { ...prev };
        delete suite[alerteId];
        return suite;
      });
      setConfirmation('Compte-rendu envoye. Vous etes de nouveau disponible pour une nouvelle alerte.');
      setTimeout(() => setConfirmation(null), 5000);
      chargerAlertesActives();
    } catch {
      setErreur("Impossible d'envoyer le compte-rendu pour le moment.");
    } finally {
      setEnCoursId(null);
    }
  }

  const occupee = mesInterventions.length > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Alertes de soins a domicile"
        description="Les demandes des patients proches de vous apparaissent ici en temps reel. Gardez cette page ouverte."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                position ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-clay-100) text-(--color-clay-500)'
              }`}
            >
              {position ? <LocateFixed size={13} /> : <LocateOff size={13} />}
              {position ? 'Position partagee' : 'Position inconnue'}
            </span>
            <CarteNoteMoyenne infirmierId={user.userId} />
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
                connected ? 'bg-(--color-sage-100) text-(--color-sage-500)' : 'bg-(--color-clay-100) text-(--color-clay-500)'
              }`}
            >
              {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
              {connected ? 'Connecte' : 'Connexion...'}
            </span>
          </div>
        }
      />

      <NotificationsPushCard raison="Recevez les demandes de soins proches de vous meme ecran eteint ou application fermee." />

      {erreurGps && (
        <div className="flex items-center gap-2 bg-(--color-amber-400)/20 text-(--color-amber-500) text-sm font-medium rounded-xl px-4 py-3">
          <LocateOff size={16} /> {erreurGps} Sans position, vous ne recevez que les alertes diffusees a toutes les infirmieres.
        </div>
      )}

      {confirmation && (
        <div className="flex items-center gap-2 bg-(--color-sage-100) text-(--color-sage-500) text-sm font-medium rounded-xl px-4 py-3">
          <CheckCircle2 size={16} /> {confirmation}
        </div>
      )}
      {erreur && (
        <div className="flex items-center gap-2 bg-(--color-clay-100) text-(--color-clay-500) text-sm font-medium rounded-xl px-4 py-3">
          {erreur}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-7 h-7" />
        </div>
      ) : (
        <>
          {occupee && (
            <div>
              <h2 className="flex items-center gap-1.5 font-display font-semibold text-(--color-ink-900) mb-3">
                <ClipboardCheck size={16} /> Mon intervention en cours
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {mesInterventions.map((a) => (
                  <Card key={a.id} className="p-5 border-(--color-sage-500)/40 sm:col-span-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-display font-semibold text-(--color-ink-900)">
                        {a.patientPrenom} {a.patientNom}
                      </p>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-(--color-sage-100) text-(--color-sage-500)">
                        En cours
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-sm text-(--color-ink-600)">
                      <p className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0" /> {a.adresse}</p>
                      {a.patientTelephone && (
                        <a href={`tel:${a.patientTelephone}`} className="flex items-center gap-1.5 hover:underline"><Phone size={14} /> {a.patientTelephone}</a>
                      )}
                      {a.message && (
                        <p className="flex items-start gap-1.5"><MessageSquare size={14} className="mt-0.5 shrink-0" /> {a.message}</p>
                      )}
                    </div>

                    {lienItineraire(a) && (
                      <a href={lienItineraire(a)} target="_blank" rel="noreferrer" className="block mt-4">
                        <Button variant="primary" className="w-full">
                          <Navigation size={15} /> Itineraire vers le patient
                        </Button>
                      </a>
                    )}
                    <p className="mt-2 text-xs text-(--color-ink-600)">
                      Le patient suit votre position en temps reel tant que cette page reste ouverte.
                    </p>

                    <div className="mt-4 pt-4 border-t border-(--color-petrol-100) space-y-2">
                      <label className="text-sm font-semibold text-(--color-ink-900)">
                        Compte-rendu de l'intervention
                      </label>
                      <Textarea
                        rows={3}
                        placeholder="Decrivez le soin apporte, l'etat du patient, les recommandations..."
                        value={compteRendus[a.id] || ''}
                        onChange={(e) => setCompteRendus((prev) => ({ ...prev, [a.id]: e.target.value }))}
                      />
                      <Button
                        variant="amber"
                        className="w-full"
                        disabled={!(compteRendus[a.id] || '').trim() || enCoursId === a.id}
                        onClick={() => handleEnvoyerCompteRendu(a.id)}
                      >
                        <Send size={15} />
                        {enCoursId === a.id ? 'Envoi...' : 'Envoyer le compte-rendu et cloturer'}
                      </Button>
                    </div>

                    {retractionId === a.id ? (
                      <div className="mt-3 flex items-center gap-2">
                        <p className="text-xs text-(--color-ink-600) flex-1">Confirmer la retractation ?</p>
                        <Button variant="ghost" className="!px-3 !py-1.5" onClick={() => setRetractionId(null)}>
                          Non
                        </Button>
                        <Button
                          variant="danger"
                          className="!px-3 !py-1.5"
                          disabled={enCoursId === a.id}
                          onClick={() => handleRetracter(a.id)}
                        >
                          Oui, me retracter
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRetractionId(a.id)}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 text-xs text-(--color-ink-300) hover:text-(--color-clay-500) transition-colors"
                      >
                        <UndoDot size={13} /> Un imprevu ? Me retracter sans compte-rendu
                      </button>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            {occupee ? (
              <Card className="p-6 flex items-center gap-3 bg-(--color-petrol-50)/50 border-dashed">
                <Lock size={18} className="text-(--color-petrol-400) shrink-0" />
                <p className="text-sm text-(--color-ink-600)">
                  Vous etes en intervention. Les nouvelles alertes vous seront proposees
                  des que vous aurez envoye votre compte-rendu.
                </p>
              </Card>
            ) : alertesEnAttente.length === 0 ? (
              <Card>
                <EmptyState
                  icon={BellRing}
                  title="Aucune alerte en attente"
                  description="Vous serez notifiee instantanement des qu'un patient envoie une demande de soins a domicile."
                />
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {alertesEnAttente.map((a) => (
                  <Card key={a.id} className="p-5 border-(--color-amber-400)/40">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-display font-semibold text-(--color-ink-900)">
                          {a.patientPrenom} {a.patientNom}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-(--color-ink-300) mt-0.5">
                          <Clock size={12} /> {tempsEcoule(a.dateCreation)}
                          {a.distanceKm != null && (
                            <span className="ml-1.5 inline-flex items-center gap-1 font-semibold text-(--color-petrol-600)">
                              <Navigation size={12} /> {formatDistance(a.distanceKm)}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-(--color-amber-400)/20 text-(--color-amber-500)">
                        En attente
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm text-(--color-ink-600)">
                      <p className="flex items-start gap-1.5"><MapPin size={14} className="mt-0.5 shrink-0" /> {a.adresse}</p>
                      {a.patientTelephone && (
                        <p className="flex items-center gap-1.5"><Phone size={14} /> {a.patientTelephone}</p>
                      )}
                      {a.message && (
                        <p className="flex items-start gap-1.5"><MessageSquare size={14} className="mt-0.5 shrink-0" /> {a.message}</p>
                      )}
                    </div>

                    <Button
                      variant="amber"
                      className="w-full mt-4"
                      disabled={enCoursId === a.id}
                      onClick={() => handleRepondre(a.id)}
                    >
                      {enCoursId === a.id ? 'Envoi...' : 'Je suis disponible - Repondre present'}
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
